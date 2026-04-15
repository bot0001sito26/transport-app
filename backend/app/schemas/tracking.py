from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class LocationBase(BaseModel):
    truck_id: int
    travel_id: Optional[int] = None
    latitude: float
    longitude: float
    speed: float = 0.0
    device_time: datetime
    source: str


class LocationCreate(LocationBase):
    pass


class Location(LocationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
