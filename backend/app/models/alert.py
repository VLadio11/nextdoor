import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (UniqueConstraint("post_id", "matched_keyword", name="uq_alert_post_keyword"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("discovered_posts.id", ondelete="CASCADE"), nullable=False
    )
    matched_keyword: Mapped[str] = mapped_column(String(500), nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    post: Mapped["DiscoveredPost"] = relationship("DiscoveredPost", back_populates="alerts")
    notification_logs: Mapped[list["NotificationLog"]] = relationship(
        "NotificationLog", back_populates="alert"
    )
