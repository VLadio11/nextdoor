import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from app.mock_store import alerts
from app.schemas.alert import AlertWithLogs

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertWithLogs])
async def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
):
    items = sorted(alerts.values(), key=lambda x: x["triggered_at"], reverse=True)
    if start_date:
        items = [a for a in items if a["triggered_at"] >= start_date]
    if end_date:
        items = [a for a in items if a["triggered_at"] <= end_date]
    return items[offset : offset + limit]


@router.get("/{alert_id}", response_model=AlertWithLogs)
async def get_alert(alert_id: uuid.UUID):
    alert = alerts.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
