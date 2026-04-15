from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.travels import Travel as TravelSchema, TravelCreate, TravelStart, TravelFinish, TravelDeliver
from app.api.deps import get_current_user
from app.models.users import User
from app.services import travels as travel_service

router = APIRouter()


@router.get("/active/{truck_id}", response_model=Optional[TravelSchema])
def get_active_trip(
    truck_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    return travel_service.get_active_trip_for_truck_service(db=db, truck_id=truck_id)


@router.get("/history/{truck_id}", response_model=List[TravelSchema])
def get_truck_history(
    truck_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """Obtiene el historial de viajes finalizados y liquidados de un camión, con paginación."""
    return travel_service.get_truck_history_service(
        db=db,
        truck_id=truck_id,
        skip=skip,
        limit=limit
    )


@router.post("/", response_model=TravelSchema)
def load_truck(
    *,
    db: Session = Depends(get_db),
    travel_in: TravelCreate,
    current_user: User = Depends(get_current_user)
):
    return travel_service.create_travel_service(db=db, travel_in=travel_in, current_user=current_user)


@router.patch("/{travel_id}/start", response_model=TravelSchema)
def start_travel(
    travel_id: int,
    travel_in: TravelStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return travel_service.start_travel_service(
        db=db,
        travel_id=travel_id,
        travel_in=travel_in,
        _current_user=current_user
    )


@router.patch("/{travel_id}/deliver", response_model=TravelSchema)
def deliver_travel(
    travel_id: int,
    travel_in: TravelDeliver,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """PASO 3: Entrega la carga en obra. Pasa de 'en_curso' a 'retornando'."""
    return travel_service.deliver_travel_service(
        db=db,
        travel_id=travel_id,
        travel_in=travel_in,
        _current_user=current_user
    )


@router.patch("/{travel_id}/finish", response_model=TravelSchema)
def finish_travel(
    travel_id: int,
    travel_in: TravelFinish,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return travel_service.finish_travel_service(
        db=db,
        travel_id=travel_id,
        travel_in=travel_in,
        _current_user=current_user
    )


@router.get("/", response_model=List[TravelSchema])
def read_travels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    return travel_service.get_travels_service(
        db=db,
        _current_user=current_user,
        skip=skip,
        limit=limit
    )
