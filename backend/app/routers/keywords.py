import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.models.keyword import Keyword
from app.schemas.keyword import KeywordCreate, KeywordRead, KeywordUpdate

router = APIRouter(prefix="/keywords", tags=["keywords"])


@router.get("/", response_model=list[KeywordRead])
async def list_keywords(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Keyword).order_by(Keyword.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=KeywordRead, status_code=status.HTTP_201_CREATED)
async def create_keyword(body: KeywordCreate, db: AsyncSession = Depends(get_db)):
    kw = Keyword(id=uuid.uuid4(), phrase=body.phrase.strip().lower(), is_active=body.is_active)
    db.add(kw)
    await db.commit()
    await db.refresh(kw)
    return kw


@router.get("/{keyword_id}", response_model=KeywordRead)
async def get_keyword(keyword_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    kw = await db.get(Keyword, keyword_id)
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return kw


@router.put("/{keyword_id}", response_model=KeywordRead)
async def update_keyword(
    keyword_id: uuid.UUID, body: KeywordUpdate, db: AsyncSession = Depends(get_db)
):
    kw = await db.get(Keyword, keyword_id)
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    data = body.model_dump(exclude_unset=True)
    if "phrase" in data:
        data["phrase"] = data["phrase"].strip().lower()
    for field, value in data.items():
        setattr(kw, field, value)
    await db.commit()
    await db.refresh(kw)
    return kw


@router.delete("/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_keyword(keyword_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    kw = await db.get(Keyword, keyword_id)
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    await db.delete(kw)
    await db.commit()
