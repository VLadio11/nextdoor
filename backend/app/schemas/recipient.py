import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RecipientCreate(BaseModel):
    email: EmailStr
    name: str | None = Field(None, max_length=255)
    is_active: bool = True


class RecipientUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = Field(None, max_length=255)
    is_active: bool | None = None


class RecipientRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    name: str | None
    is_active: bool
    created_at: datetime
