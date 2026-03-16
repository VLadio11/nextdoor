import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.mock_store import keywords
from app.schemas.keyword import KeywordCreate, KeywordRead, KeywordUpdate

router = APIRouter(prefix="/keywords", tags=["keywords"])


@router.get("/", response_model=list[KeywordRead])
async def list_keywords():
    return sorted(keywords.values(), key=lambda x: x["created_at"], reverse=True)


@router.post("/", response_model=KeywordRead, status_code=status.HTTP_201_CREATED)
async def create_keyword(body: KeywordCreate):
    kw = {
        "id": uuid.uuid4(),
        "phrase": body.phrase.strip().lower(),
        "is_active": body.is_active,
        "created_at": datetime.now(timezone.utc),
    }
    keywords[kw["id"]] = kw
    return kw


@router.get("/{keyword_id}", response_model=KeywordRead)
async def get_keyword(keyword_id: uuid.UUID):
    kw = keywords.get(keyword_id)
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return kw


@router.put("/{keyword_id}", response_model=KeywordRead)
async def update_keyword(keyword_id: uuid.UUID, body: KeywordUpdate):
    kw = keywords.get(keyword_id)
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    data = body.model_dump(exclude_unset=True)
    if "phrase" in data:
        data["phrase"] = data["phrase"].strip().lower()
    kw.update(data)
    return kw


@router.delete("/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_keyword(keyword_id: uuid.UUID):
    if keyword_id not in keywords:
        raise HTTPException(status_code=404, detail="Keyword not found")
    del keywords[keyword_id]
