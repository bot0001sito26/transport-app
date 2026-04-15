from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.trucks import Truck
from app.schemas.trucks import TruckCreate, TruckUpdate
from app.models.users import User
from sqlalchemy import func
from app.models.travels import Travel
from app.models.finances import Expense


def create_truck_service(db: Session, truck_in: TruckCreate, current_user: User) -> Truck:
    if current_user.role != "owner":
        raise HTTPException(
            status_code=403, detail="Solo los dueños pueden registrar camiones")

    existing_truck = db.query(Truck).filter(
        Truck.plate == truck_in.plate).first()
    if existing_truck:
        raise HTTPException(
            status_code=400, detail="Ya existe un camión registrado con esa placa")

    db_truck = Truck(**truck_in.model_dump(), owner_id=current_user.id)
    db.add(db_truck)
    db.commit()
    db.refresh(db_truck)
    return db_truck


def get_trucks_service(db: Session, current_user: User, skip: int = 0, limit: int = 100):
    query = db.query(Truck).options(
        joinedload(Truck.driver),
        joinedload(Truck.official)
    )

    if current_user.role == "admin":
        return query.offset(skip).limit(limit).all()
    elif current_user.role == "owner":
        return query.filter(Truck.owner_id == current_user.id).offset(skip).limit(limit).all()
    else:
        raise HTTPException(status_code=403, detail="Acceso denegado")


def get_truck_service(db: Session, truck_id: int, current_user: User):
    # Importación local para evitar errores de importación circular
    from app.services.finances import get_user_current_balance

    truck = db.query(Truck).options(
        joinedload(Truck.driver),
        joinedload(Truck.official)
    ).filter(Truck.id == truck_id).first()

    if not truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    is_assigned_staff = (
        current_user.role in ["driver", "official"] and
        current_user.assigned_truck_id == truck.id
    )

    if current_user.role != "admin" and truck.owner_id != current_user.id and not is_assigned_staff:
        raise HTTPException(
            status_code=403, detail="No tienes permiso para ver esta unidad")

    # Inyectamos el saldo actual directamente al objeto para que el Frontend lo reciba
    if truck.driver:
        setattr(truck.driver, "current_balance",
                get_user_current_balance(db, truck.driver.id))

    if truck.official:
        setattr(truck.official, "current_balance",
                get_user_current_balance(db, truck.official.id))

    return truck


def update_truck_service(db: Session, truck_id: int, truck_in: TruckUpdate, current_user: User) -> Truck:
    db_truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not db_truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    if db_truck.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Solo el dueño puede modificar este camión")

    update_data = truck_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_truck, field, value)

    db.add(db_truck)
    db.commit()
    db.refresh(db_truck)
    return db_truck


def get_truck_stats_service(db: Session, truck_id: int, current_user: User):
    # 1. Buscamos el camión
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    # 2. Verificamos permisos: Solo admin, dueño o personal asignado pueden ver las estadísticasif current_user.role != "admin" and truck.owner_id != current_user.id:
    if current_user.role != "admin" and truck.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para ver las estadísticas de esta unidad"
        )

    # --- El resto del código que ya teníamos (el conteo y las sumas) ---
    total_trips = db.query(Travel).filter(
        Travel.truck_id == truck_id,
        Travel.status.ilike('finalizado')
    ).count()

    trips = db.query(Travel.start_odometer, Travel.end_odometer).filter(
        Travel.truck_id == truck_id,
        Travel.status.ilike('finalizado')
    ).all()

    total_km = 0.0
    for start_odo, end_odo in trips:
        try:
            s = float(start_odo) if start_odo else 0.0
            e = float(end_odo) if end_odo else 0.0
            if e > s:
                total_km += (e - s)
        except Exception:  # pylint: disable=broad-exception-caught
            pass

    fuel_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.truck_id == truck_id,
        Expense.category.ilike('combustible')
    ).scalar() or 0.0

    return {
        "total_km": round(total_km, 2),
        "total_trips": total_trips,
        "total_fuel_expenses": round(fuel_expenses, 2)
    }
