import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(5.0, gt=0, le=500)
    is_active: bool = True


class LocationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    radius_km: float | None = Field(None, gt=0, le=500)
    is_active: bool | None = None


class LocationRead(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    radius_km: float
    is_active: bool
    created_at: datetime
