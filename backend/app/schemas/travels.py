from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class GuideType(str, Enum):
    carga = "carga"
    entrega = "entrega"

# --- 1. SCHEMAS DE GUÍAS ---


class TravelGuideBase(BaseModel):
    photo_url: str
    guide_type: GuideType
    weight_kg: Optional[float] = None


class TravelGuide(TravelGuideBase):
    id: int
    destination_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GuideCreateItem(BaseModel):
    photo_url: str
    weight_kg: float
# --- 2. SCHEMAS DE DESTINOS (CLIENTES) ---


class TravelDestinationBase(BaseModel):
    client_name: str


class DestinationCreateItem(TravelDestinationBase):
    # Al crear el viaje, recibimos las fotos de carga para este cliente
    load_photos: List[GuideCreateItem]


class TravelDestination(TravelDestinationBase):
    id: int
    travel_id: int
    status: str
    guides: List[TravelGuide] = []
    model_config = ConfigDict(from_attributes=True)


class DestinationDeliverItem(BaseModel):
    # Al reportar entrega, decimos a qué destino le pertenecen las fotos firmadas
    destination_id: int
    delivery_photos: List[GuideCreateItem]

# --- 3. SCHEMAS DE VIAJE ---


class TravelBase(BaseModel):
    truck_id: int
    driver_id: int
    official_id: int
    extra_official_id: Optional[int] = None
    material_type: str
    weight_kg: float


class TravelCreate(TravelBase):
    # Reemplazamos destination_client y photo_url por la lista de destinos estructurada
    destinations: List[DestinationCreateItem]


class TravelStart(BaseModel):
    start_odometer: float
    start_odometer_photo_url: str


class TravelDeliver(BaseModel):
    # Recibimos las fotos firmadas mapeadas a sus respectivos destinos
    delivered_destinations: List[DestinationDeliverItem]


class TravelFinish(BaseModel):
    end_odometer: float
    end_odometer_photo_url: str


class Travel(TravelBase):
    id: int
    status: str
    loaded_at: datetime
    start_time: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    end_time: Optional[datetime] = None

    start_odometer: Optional[float] = None
    start_odometer_photo_url: Optional[str] = None
    end_odometer: Optional[float] = None
    end_odometer_photo_url: Optional[str] = None

    # Array anidado que FastAPI devolverá automáticamente gracias a SQLAlchemy
    destinations: List[TravelDestination] = []

    model_config = ConfigDict(from_attributes=True)
