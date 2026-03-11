import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.models.recipient import Recipient
from app.schemas.recipient import RecipientCreate, RecipientRead, RecipientUpdate

router = APIRouter(prefix="/recipients", tags=["recipients"])


@router.get("/", response_model=list[RecipientRead])
async def list_recipients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Recipient).order_by(Recipient.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=RecipientRead, status_code=status.HTTP_201_CREATED)
async def create_recipient(body: RecipientCreate, db: AsyncSession = Depends(get_db)):
    rec = Recipient(id=uuid.uuid4(), **body.model_dump())
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.get("/{recipient_id}", response_model=RecipientRead)
async def get_recipient(recipient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    rec = await db.get(Recipient, recipient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return rec


@router.put("/{recipient_id}", response_model=RecipientRead)
async def update_recipient(
    recipient_id: uuid.UUID, body: RecipientUpdate, db: AsyncSession = Depends(get_db)
):
    rec = await db.get(Recipient, recipient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recipient not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rec, field, value)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipient(recipient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    rec = await db.get(Recipient, recipient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recipient not found")
    await db.delete(rec)
    await db.commit()
