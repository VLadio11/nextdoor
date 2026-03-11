import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.deps import get_db
from app.models.post import DiscoveredPost
from app.schemas.post import DiscoveredPostRead

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=list[DiscoveredPostRead])
async def list_posts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    location_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DiscoveredPost).order_by(DiscoveredPost.first_seen_at.desc())
    if location_id:
        stmt = stmt.where(DiscoveredPost.location_id == location_id)
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
