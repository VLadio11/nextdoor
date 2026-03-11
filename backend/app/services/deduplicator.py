"""Post deduplication using the database as the single source of truth.

Relies on the UNIQUE(source, external_id) constraint on discovered_posts.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import DiscoveredPost


class PostDeduplicator:
    async def is_seen(self, db: AsyncSession, source: str, external_id: str) -> bool:
        result = await db.execute(
            select(DiscoveredPost.id).where(
                DiscoveredPost.source == source,
                DiscoveredPost.external_id == external_id,
            )
        )
        return result.scalar_one_or_none() is not None
