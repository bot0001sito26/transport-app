from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class OwnerNoteBase(BaseModel):
    content: str
    category: Optional[str] = "General"
    truck_id: Optional[int] = None


class OwnerNoteCreate(OwnerNoteBase):
    pass


class OwnerNoteResponse(OwnerNoteBase):
    id: int
    owner_id: int
    date_recorded: datetime

    model_config = ConfigDict(from_attributes=True)
