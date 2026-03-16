import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.mock_store import locations
from app.schemas.location import LocationCreate, LocationRead, LocationUpdate

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/", response_model=list[LocationRead])
async def list_locations():
    return sorted(locations.values(), key=lambda x: x["created_at"], reverse=True)


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(body: LocationCreate):
    loc = {"id": uuid.uuid4(), "created_at": datetime.now(timezone.utc), **body.model_dump()}
    locations[loc["id"]] = loc
    return loc


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: uuid.UUID):
    loc = locations.get(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


@router.put("/{location_id}", response_model=LocationRead)
async def update_location(location_id: uuid.UUID, body: LocationUpdate):
    loc = locations.get(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        loc[field] = value
    return loc


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: uuid.UUID):
    if location_id not in locations:
        raise HTTPException(status_code=404, detail="Location not found")
    del locations[location_id]
