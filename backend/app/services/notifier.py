"""Email alert notifier.

Sends HTML+plain-text emails via SMTP (async) with retry logic.
Logs every attempt to notification_logs.
"""

import asyncio
import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.logging_config import get_logger
from app.models.alert import Alert
from app.models.notification_log import NotificationLog
from app.models.recipient import Recipient
from app.services.email_renderer import render_alert_email

logger = get_logger(__name__)

_MAX_RETRIES = 3
_RETRY_BACKOFF = [5.0, 10.0, 20.0]


class AlertNotifier:
    async def notify(
        self,
        db: AsyncSession,
        alert: Alert,
        recipients: list[Recipient],
        location_name: str | None,
    ) -> None:
        post = alert.post
        subject, html_body, plain_body = render_alert_email(
            keyword=alert.matched_keyword,
            content=post.content,
            author_name=post.author_name,
            neighborhood=post.neighborhood,
            posted_at=post.posted_at,
            source_url=post.source_url,
            location_name=location_name,
        )

        for recipient in recipients:
            log = NotificationLog(
                id=uuid.uuid4(),
                alert_id=alert.id,
                recipient_id=recipient.id,
                status="pending",
                attempt_count=0,
            )
            db.add(log)

            success = await self._send_with_retry(recipient.email, subject, html_body, plain_body, log)
            if success:
                log.status = "sent"
                log.sent_at = datetime.now(timezone.utc)
                logger.info("alert_sent", recipient=recipient.email, keyword=alert.matched_keyword)
            else:
                log.status = "failed"
                logger.error("alert_failed", recipient=recipient.email, keyword=alert.matched_keyword)

        await db.commit()

    async def _send_with_retry(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        plain_body: str,
        log: NotificationLog,
    ) -> bool:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from
        msg["To"] = to_email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        for attempt, backoff in enumerate((*_RETRY_BACKOFF, None), start=1):
            log.attempt_count = attempt
            try:
                await aiosmtplib.send(
                    msg,
                    hostname=settings.smtp_host,
                    port=settings.smtp_port,
                    username=settings.smtp_user or None,
                    password=settings.smtp_password or None,
                    use_tls=False,
                    start_tls=settings.smtp_use_tls,
                )
                return True
            except Exception as exc:
                log.error_message = str(exc)
                logger.warning("smtp_send_failed", attempt=attempt, error=str(exc))
                if backoff is not None:
                    await asyncio.sleep(backoff)

        return False
