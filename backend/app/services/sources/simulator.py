"""Simulated post generator for development and testing.

Produces realistic fake Nextdoor-style posts so the full alerting pipeline
can be exercised without a live API key. Activated when SIM_MODE=true.
"""

import random
import uuid
from datetime import datetime, timedelta, timezone

from app.services.sources.base import RawPost

_NEIGHBORHOODS = [
    "Maple Heights",
    "Riverside Commons",
    "Oak Park",
    "Sunset Hills",
    "Elmwood",
    "Pinecrest",
    "Harbor View",
    "Willow Creek",
]

_POST_TEMPLATES = [
    "Has anyone seen a {keyword} near {street}? Please let me know.",
    "Heads up neighbors — there's a {keyword} situation on {street}.",
    "Looking for recommendations for {keyword} services in the area.",
    "Anyone else notice the {keyword} on {street} this morning?",
    "Free {keyword} available — first come first served on {street}.",
    "Lost {keyword} last seen near {street}. Please contact me if found.",
    "Community meeting about {keyword} this Saturday at the park.",
    "Warning: {keyword} spotted near {street}. Stay alert.",
    "Does anyone have a {keyword}? Happy to pay. Located on {street}.",
    "Just a reminder about {keyword} rules in our neighborhood.",
]

_STREETS = [
    "Oak Ave",
    "Maple St",
    "Cedar Blvd",
    "Elm Dr",
    "Pine Rd",
    "Birch Ln",
    "Walnut Way",
    "Spruce Ct",
]

_NAMES = [
    "Sarah M.",
    "James K.",
    "Maria L.",
    "David R.",
    "Emily S.",
    "Carlos T.",
    "Nancy W.",
    "Brian H.",
    "Lisa P.",
    "Kevin O.",
]


class SimulatedPostGenerator:
    """Generates synthetic posts that realistically match keyword searches."""

    async def generate(
        self,
        latitude: float,
        longitude: float,
        radius_km: float,
        keywords: list[str],
    ) -> list[RawPost]:
        posts: list[RawPost] = []

        # Produce 0–3 posts per keyword, with ~60% chance of a match
        for keyword in keywords:
            count = random.choices([0, 1, 2, 3], weights=[40, 35, 15, 10])[0]
            for _ in range(count):
                posts.append(self._make_post(keyword))

        # Add 0–2 unrelated posts (no keyword) to simulate noise
        for _ in range(random.randint(0, 2)):
            posts.append(self._make_post(random.choice(["garage sale", "lost cat", "free firewood"])))

        return posts

    def _make_post(self, keyword: str) -> RawPost:
        street = random.choice(_STREETS)
        template = random.choice(_POST_TEMPLATES)
        content = template.format(keyword=keyword, street=street)
        neighborhood = random.choice(_NEIGHBORHOODS)
        author = random.choice(_NAMES)
        minutes_ago = random.randint(5, 60 * 24 * 7)  # up to 7 days ago
        posted_at = datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)
        post_id = str(uuid.uuid4())

        return RawPost(
            external_id=f"sim_{post_id}",
            source="nextdoor",
            content=content,
            author_name=author,
            posted_at=posted_at,
            neighborhood=neighborhood,
            source_url=f"https://nextdoor.com/p/{post_id}/",
            raw_payload={"simulated": True, "id": post_id},
        )
