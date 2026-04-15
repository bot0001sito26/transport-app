from pydantic import BaseModel, ConfigDict
from typing import Optional


class UserBase(BaseModel):
    username: str
    full_name: str
    dni: str
    role: str  # 'admin', 'owner', 'driver', 'official'
    phone: Optional[str] = None
    assigned_truck_id: Optional[int] = None
    telegram_chat_id: Optional[str] = None
    license_type: Optional[str] = None


class UserCreate(UserBase):
    password: str
    created_by_id: Optional[int] = None


class User(UserBase):
    id: int
    is_active: bool
    current_balance: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
