import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class KeywordCreate(BaseModel):
    phrase: str = Field(..., min_length=1, max_length=500)
    is_active: bool = True


class KeywordUpdate(BaseModel):
    phrase: str | None = Field(None, min_length=1, max_length=500)
    is_active: bool | None = None


class KeywordRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    phrase: str
    is_active: bool
    created_at: datetime
