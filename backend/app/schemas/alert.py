import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.post import DiscoveredPostRead


class AlertRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    post_id: uuid.UUID
    matched_keyword: str
    triggered_at: datetime
    post: DiscoveredPostRead | None = None


class AlertWithLogs(AlertRead):
    notification_logs: list["NotificationLogRead"] = []


class NotificationLogRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    alert_id: uuid.UUID
    recipient_id: uuid.UUID
    sent_at: datetime | None
    status: str
    error_message: str | None
    attempt_count: int


AlertWithLogs.model_rebuild()
