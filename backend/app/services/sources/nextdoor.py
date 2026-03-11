"""Nextdoor official Search API client.

Official API: https://developer.nextdoor.com
Requires approval from Nextdoor's partnerships team before use.
Contact: partnerships@nextdoor.com

When SIM_MODE=true, this module delegates to SimulatedPostGenerator instead
of making real API calls. Set SIM_MODE=false once you have API credentials.
"""

import asyncio
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.logging_config import get_logger
from app.services.sources.base import BaseSource, RawPost
from app.services.sources.simulator import SimulatedPostGenerator

logger = get_logger(__name__)

_NEXTDOOR_SEARCH_URL = "https://api.nextdoor.com/v1/search/posts"
_MAX_RETRIES = 3
_RETRY_BACKOFF = [2.0, 4.0, 8.0]


class NextdoorSource(BaseSource):
    """Nextdoor Search API source.

    Fetches public 'anyone' posts within a radius of a lat/lng coordinate
    that match the provided keywords.

    Authentication: Bearer token obtained via OAuth2 client_credentials flow
    using NEXTDOOR_API_KEY (client_id) and NEXTDOOR_API_SECRET (client_secret).
    """

    source_name = "nextdoor"

    def __init__(self) -> None:
        self._sim = SimulatedPostGenerator() if settings.sim_mode else None
        self._token_cache: tuple[str, datetime] | None = None
        self._rate_limit_delay = 60.0 / max(settings.nextdoor_requests_per_minute, 1)

    async def fetch_posts(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        keywords: list[str],
    ) -> list[RawPost]:
        if settings.sim_mode:
            logger.info("sim_mode_active", note="Using simulated posts — set SIM_MODE=false for production")
            return await self._sim.generate(latitude, longitude, radius_km, keywords)

        if not settings.nextdoor_api_key or not settings.nextdoor_api_secret:
            logger.error("nextdoor_credentials_missing", detail="Set NEXTDOOR_API_KEY and NEXTDOOR_API_SECRET")
            return []

        posts: list[RawPost] = []
        for keyword in keywords:
            result = await self._fetch_for_keyword(latitude, longitude, radius_km, keyword)
            posts.extend(result)
            await asyncio.sleep(self._rate_limit_delay)
        return posts

    async def _fetch_for_keyword(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        keyword: str,
    ) -> list[RawPost]:
        token = await self._get_access_token()
        if not token:
            return []

        params = {
            "lat": latitude,
            "lng": longitude,
            "radius_km": radius_km,
            "q": keyword,
            "limit": 50,
        }
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

        for attempt, backoff in enumerate((*_RETRY_BACKOFF, None), start=1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(_NEXTDOOR_SEARCH_URL, params=params, headers=headers)

                if resp.status_code == 429:
                    wait = float(resp.headers.get("Retry-After", 60))
                    logger.warning("nextdoor_rate_limited", retry_after=wait)
                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                return self._parse_response(resp.json())

            except httpx.HTTPStatusError as exc:
                logger.error("nextdoor_http_error", status=exc.response.status_code, attempt=attempt)
            except httpx.RequestError as exc:
                logger.error("nextdoor_request_error", error=str(exc), attempt=attempt)

            if backoff is not None:
                await asyncio.sleep(backoff)

        return []

    async def _get_access_token(self) -> str | None:
        """Obtain and cache OAuth2 client_credentials token."""
        now = datetime.now(timezone.utc)
        if self._token_cache:
            token, expiry = self._token_cache
            if now < expiry:
                return token

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://auth.nextdoor.com/v2/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": settings.nextdoor_api_key,
                        "client_secret": settings.nextdoor_api_secret,
                        "scope": "search:posts",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                token = data["access_token"]
                expires_in = int(data.get("expires_in", 3600)) - 60
                from datetime import timedelta
                expiry = now + timedelta(seconds=expires_in)
                self._token_cache = (token, expiry)
                return token
        except Exception as exc:
            logger.error("nextdoor_token_error", error=str(exc))
            return None

    @staticmethod
    def _parse_response(data: dict) -> list[RawPost]:
        posts = []
        for item in data.get("posts", []):
            posts.append(
                RawPost(
                    external_id=str(item["id"]),
                    source="nextdoor",
                    content=item.get("body", item.get("text", "")),
                    author_name=item.get("author", {}).get("name"),
                    posted_at=_parse_dt(item.get("created_at")),
                    neighborhood=item.get("neighborhood", {}).get("name"),
                    source_url=item.get("url"),
                    raw_payload=item,
                )
            )
        return posts


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
