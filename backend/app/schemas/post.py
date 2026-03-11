import uuid
from datetime import datetime

from pydantic import BaseModel


class DiscoveredPostRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    source: str
    external_id: str
    location_id: uuid.UUID | None
    content: str
    author_name: str | None
    posted_at: datetime | None
    neighborhood: str | None
    source_url: str | None
    first_seen_at: datetime
