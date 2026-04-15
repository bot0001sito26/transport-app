from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.trucks import Truck as TruckSchema, TruckCreate, TruckUpdate, TruckStats
from app.api.deps import get_current_user
from app.models.users import User
from app.services import trucks as truck_service

router = APIRouter()


@router.post("/", response_model=TruckSchema)
def create_truck(
    *,
    db: Session = Depends(get_db),
    truck_in: TruckCreate,
    current_user: User = Depends(get_current_user)
):
    """Permite a un Owner registrar un nuevo camión en su flota"""
    return truck_service.create_truck_service(db=db, truck_in=truck_in, current_user=current_user)


@router.get("/", response_model=List[TruckSchema])
def read_trucks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Lista los camiones según el rol: Admin ve todos, Owner solo los suyos"""
    return truck_service.get_trucks_service(db=db, current_user=current_user, skip=skip, limit=limit)


@router.get("/{truck_id}", response_model=TruckSchema)
def read_truck(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene los detalles de un camión específico"""
    return truck_service.get_truck_service(db=db, truck_id=truck_id, current_user=current_user)


@router.patch("/{truck_id}", response_model=TruckSchema)
def update_truck(
    truck_id: int,
    truck_in: TruckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza la información de un camión"""
    return truck_service.update_truck_service(db=db, truck_id=truck_id, truck_in=truck_in, current_user=current_user)


# --- NUEVA RUTA OPTIMIZADA ---
@router.get("/{truck_id}/stats", response_model=TruckStats)
def read_truck_stats(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene el histórico total de gastos y km calculados en la base de datos"""
    return truck_service.get_truck_stats_service(db=db, truck_id=truck_id, current_user=current_user)
