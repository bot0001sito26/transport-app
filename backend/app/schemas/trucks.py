from pydantic import BaseModel, ConfigDict
from typing import Optional


class UserSummary(BaseModel):
    id: int
    full_name: str
    role: str
    phone: Optional[str] = None
    current_balance: Optional[float] = 0.0
    model_config = ConfigDict(from_attributes=True)


class TruckBase(BaseModel):
    plate: str
    brand: str
    model: str
    capacity_tons: float
    current_balance: Optional[float] = 0.0
    status: str = "disponible"
    current_travel_id: Optional[int] = None


class TruckCreate(TruckBase):
    pass


class TruckUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    capacity_tons: Optional[float] = None
    status: Optional[str] = None
    current_travel_id: Optional[int] = None


class Truck(TruckBase):
    id: int
    owner_id: int

    driver: Optional[UserSummary] = None
    official: Optional[UserSummary] = None
    extra_official: Optional[UserSummary] = None
    model_config = ConfigDict(from_attributes=True)


class TruckStats(BaseModel):
    total_km: float
    total_trips: int
    total_fuel_expenses: float
