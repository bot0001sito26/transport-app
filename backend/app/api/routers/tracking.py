from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.tracking import Location as LocationSchema, LocationCreate
from app.api.deps import get_current_user
from app.models.users import User
from app.services import tracking as tracking_service

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Recibe la data de los dispositivos en tiempo real a través de Telegram"""
    data = await request.json()
    return await tracking_service.process_telegram_webhook_service(db=db, data=data)


@router.post("/", response_model=LocationSchema)
def add_location(
    location_in: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registra una nueva coordenada GPS para un camión."""
    return tracking_service.add_location_service(db=db, location_in=location_in, _current_user=current_user)


@router.get("/{truck_id}/history", response_model=List[LocationSchema])
def get_truck_route(
    truck_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene el historial de ubicaciones de un camión para dibujar la ruta."""
    return tracking_service.get_truck_route_service(db=db, truck_id=truck_id, limit=limit, current_user=current_user)
