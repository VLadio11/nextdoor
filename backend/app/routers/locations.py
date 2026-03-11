import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationRead, LocationUpdate

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/", response_model=list[LocationRead])
async def list_locations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Location).order_by(Location.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(body: LocationCreate, db: AsyncSession = Depends(get_db)):
    loc = Location(id=uuid.uuid4(), **body.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    loc = await db.get(Location, location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


@router.put("/{location_id}", response_model=LocationRead)
async def update_location(
    location_id: uuid.UUID, body: LocationUpdate, db: AsyncSession = Depends(get_db)
):
    loc = await db.get(Location, location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    loc = await db.get(Location, location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    await db.delete(loc)
    await db.commit()
