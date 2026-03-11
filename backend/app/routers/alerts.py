import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.deps import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertWithLogs

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertWithLogs])
async def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Alert)
        .options(
            selectinload(Alert.post),
            selectinload(Alert.notification_logs),
        )
        .order_by(Alert.triggered_at.desc())
    )
    if start_date:
        stmt = stmt.where(Alert.triggered_at >= start_date)
    if end_date:
        stmt = stmt.where(Alert.triggered_at <= end_date)
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{alert_id}", response_model=AlertWithLogs)
async def get_alert(alert_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Alert)
        .options(
            selectinload(Alert.post),
            selectinload(Alert.notification_logs),
        )
        .where(Alert.id == alert_id)
    )
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
