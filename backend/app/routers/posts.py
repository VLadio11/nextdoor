import uuid

from fastapi import APIRouter, Query

from app.mock_store import posts
from app.schemas.post import DiscoveredPostRead

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=list[DiscoveredPostRead])
async def list_posts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    location_id: uuid.UUID | None = Query(None),
):
    items = sorted(posts.values(), key=lambda x: x["first_seen_at"], reverse=True)
    if location_id:
        items = [p for p in items if p["location_id"] == location_id]
    return items[offset : offset + limit]
