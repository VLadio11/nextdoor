import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.mock_store import recipients
from app.schemas.recipient import RecipientCreate, RecipientRead, RecipientUpdate

router = APIRouter(prefix="/recipients", tags=["recipients"])


@router.get("/", response_model=list[RecipientRead])
async def list_recipients():
    return sorted(recipients.values(), key=lambda x: x["created_at"], reverse=True)


@router.post("/", response_model=RecipientRead, status_code=status.HTTP_201_CREATED)
async def create_recipient(body: RecipientCreate):
    rec = {"id": uuid.uuid4(), "created_at": datetime.now(timezone.utc), **body.model_dump()}
    recipients[rec["id"]] = rec
    return rec


@router.get("/{recipient_id}", response_model=RecipientRead)
async def get_recipient(recipient_id: uuid.UUID):
    rec = recipients.get(recipient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return rec


@router.put("/{recipient_id}", response_model=RecipientRead)
async def update_recipient(recipient_id: uuid.UUID, body: RecipientUpdate):
    rec = recipients.get(recipient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recipient not found")
    rec.update(body.model_dump(exclude_unset=True))
    return rec


@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipient(recipient_id: uuid.UUID):
    if recipient_id not in recipients:
        raise HTTPException(status_code=404, detail="Recipient not found")
    del recipients[recipient_id]
