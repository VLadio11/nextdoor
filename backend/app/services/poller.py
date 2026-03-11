"""Poll orchestrator — the main polling loop.

On each invocation:
1. Load active locations and keywords from DB.
2. For each location, fetch posts via the configured source.
3. Deduplicate against previously seen posts.
4. Store new posts and create Alert records for keyword matches.
5. Dispatch email notifications for each new alert.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import SessionLocal
from app.logging_config import get_logger
from app.models.alert import Alert
from app.models.keyword import Keyword
from app.models.location import Location
from app.models.post import DiscoveredPost
from app.models.recipient import Recipient
from app.services.deduplicator import PostDeduplicator
from app.services.matcher import KeywordMatcher
from app.services.notifier import AlertNotifier
from app.services.sources.nextdoor import NextdoorSource

logger = get_logger(__name__)


class PollOrchestrator:
    def __init__(self) -> None:
        self._source = NextdoorSource()
        self._matcher = KeywordMatcher()
        self._dedup = PostDeduplicator()
        self._notifier = AlertNotifier()

    async def run(self) -> dict:
        """Execute one full poll cycle. Returns a summary dict."""
        summary = {"locations_polled": 0, "new_posts": 0, "new_alerts": 0, "errors": []}

        async with SessionLocal() as db:
            locations = await self._load_active_locations(db)
            keywords = await self._load_active_keywords(db)
            recipients = await self._load_active_recipients(db)

            if not locations:
                logger.info("poll_skipped", reason="no active locations")
                return summary
            if not keywords:
                logger.info("poll_skipped", reason="no active keywords")
                return summary

            keyword_phrases = [kw.phrase for kw in keywords]

            for location in locations:
                summary["locations_polled"] += 1
                try:
                    raw_posts = await self._source.fetch_posts(
                        latitude=location.latitude,
                        longitude=location.longitude,
                        radius_km=location.radius_km,
                        keywords=keyword_phrases,
                    )
                    logger.info(
                        "poll_fetched",
                        location=location.name,
                        count=len(raw_posts),
                    )

                    for raw in raw_posts:
                        if await self._dedup.is_seen(db, raw.source, raw.external_id):
                            continue

                        post = DiscoveredPost(
                            id=uuid.uuid4(),
                            source=raw.source,
                            external_id=raw.external_id,
                            location_id=location.id,
                            content=raw.content,
                            author_name=raw.author_name,
                            posted_at=raw.posted_at,
                            neighborhood=raw.neighborhood,
                            source_url=raw.source_url,
                            raw_payload=raw.raw_payload,
                        )
                        db.add(post)
                        await db.flush()  # get post.id before creating alerts
                        summary["new_posts"] += 1

                        matched_keywords = self._matcher.match(raw.content, keyword_phrases)
                        for phrase in matched_keywords:
                            alert = await self._create_alert_if_new(db, post.id, phrase)
                            if alert:
                                summary["new_alerts"] += 1
                                await db.flush()
                                # Re-load alert with post relationship for notifier
                                alert.post = post
                                await self._notifier.notify(db, alert, recipients, location.name)

                    await db.commit()

                except Exception as exc:
                    logger.exception("poll_location_error", location=location.name, error=str(exc))
                    summary["errors"].append(f"{location.name}: {exc}")
                    await db.rollback()

        logger.info("poll_complete", **summary)
        return summary

    async def _create_alert_if_new(
        self, db: AsyncSession, post_id: uuid.UUID, matched_keyword: str
    ) -> Alert | None:
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        stmt = (
            pg_insert(Alert)
            .values(id=uuid.uuid4(), post_id=post_id, matched_keyword=matched_keyword)
            .on_conflict_do_nothing(constraint="uq_alert_post_keyword")
            .returning(Alert.id, Alert.post_id, Alert.matched_keyword, Alert.triggered_at)
        )
        result = await db.execute(stmt)
        row = result.fetchone()
        if row is None:
            return None
        alert = Alert(id=row.id, post_id=row.post_id, matched_keyword=row.matched_keyword, triggered_at=row.triggered_at)
        return alert

    @staticmethod
    async def _load_active_locations(db: AsyncSession) -> list[Location]:
        result = await db.execute(select(Location).where(Location.is_active.is_(True)))
        return list(result.scalars().all())

    @staticmethod
    async def _load_active_keywords(db: AsyncSession) -> list[Keyword]:
        result = await db.execute(select(Keyword).where(Keyword.is_active.is_(True)))
        return list(result.scalars().all())

    @staticmethod
    async def _load_active_recipients(db: AsyncSession) -> list[Recipient]:
        result = await db.execute(select(Recipient).where(Recipient.is_active.is_(True)))
        return list(result.scalars().all())
