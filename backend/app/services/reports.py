from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import math
import calendar
from datetime import datetime, timezone
from typing import Optional

from app.models.trucks import Truck
from app.models.travels import Travel
from app.models.finances import Advance, Expense  # pylint: disable=unused-import
from app.models.tracking import Location
from app.models.users import User


def calculate_gps_distance(locations):
    """Fórmula de Haversine para calcular distancia entre puntos GPS."""
    if len(locations) < 2:
        return 0.0
    total_distance = 0.0
    R = 6371.0
    for i in range(len(locations) - 1):
        lat1, lon1 = math.radians(locations[i].latitude), math.radians(
            locations[i].longitude)
        lat2, lon2 = math.radians(
            locations[i+1].latitude), math.radians(locations[i+1].longitude)
        a = math.sin((lat2 - lat1) / 2)**2 + math.cos(lat1) * \
            math.cos(lat2) * math.sin((lon2 - lon1) / 2)**2
        total_distance += R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))
    return round(total_distance, 2)


def generate_liquidation_service(db: Session, travel_id: int, current_user: User):
    travel = db.query(Travel).filter(Travel.id == travel_id).first()
    if not travel:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    # --- SOLUCIÓN LINTER: Validación de Seguridad ---
    if current_user.role == "owner":
        truck = db.query(Truck).filter(Truck.id == travel.truck_id).first()
        if truck and truck.owner_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="No tienes permisos sobre la auditoría de esta unidad")
    # -------------------------------------------------

    total_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.travel_id == travel_id).scalar() or 0.0

    # Manejo seguro del odómetro (evita Error 500 por strings vacíos)
    start_val = str(travel.start_odometer).strip(
    ) if travel.start_odometer else "0"
    end_val = str(travel.end_odometer).strip() if travel.end_odometer else "0"

    start_odo = float(start_val) if start_val.replace(
        '.', '', 1).isdigit() else 0.0
    end_odo = float(end_val) if end_val.replace('.', '', 1).isdigit() else 0.0
    odometer_km = (end_odo - start_odo) if (end_odo >
                                            0 and start_odo > 0) else 0.0

    end_time_filter = travel.end_time if travel.end_time else datetime.now(
        timezone.utc)
    locations = db.query(Location).filter(
        Location.truck_id == travel.truck_id,
        Location.device_time >= travel.start_time,
        Location.device_time <= end_time_filter
    ).order_by(Location.device_time.asc()).all()

    gps_km = calculate_gps_distance(locations)

    return {
        "travel_id": travel.id,
        "status": travel.status or "FINALIZADO",
        "material": travel.material_type or "SIN ESPECIFICAR",
        "destination": travel.destination_client or "SIN DESTINO",
        "total_advances": 0.0,
        "total_expenses": float(total_expenses),
        "balance": 0.0,
        "odometer_km": float(odometer_km),
        "gps_km": float(gps_km),
        "km_difference": round(abs(odometer_km - gps_km), 2)
    }


def generate_monthly_summary_service(db: Session, current_user: User, month: Optional[int], year: Optional[int]):
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=403, detail="Acceso denegado. Reporte exclusivo.")

    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    _, last_day = calendar.monthrange(target_year, target_month)
    start_date = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
    end_date = datetime(target_year, target_month, last_day,
                        23, 59, 59, tzinfo=timezone.utc)

    if current_user.role == "admin":
        trucks = db.query(Truck).all()
    else:
        trucks = db.query(Truck).filter(
            Truck.owner_id == current_user.id).all()

    truck_ids = [t.id for t in trucks] if trucks else []

    # NUEVO: Cálculo global de TODOS los gastos del mes (estén o no en un viaje)
    grand_total_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.truck_id.in_(truck_ids),
        Expense.created_at >= start_date,
        Expense.created_at <= end_date
    ).scalar() or 0.0

    # NUEVO: Cálculo global EXCLUSIVO de combustible del mes
    fuel_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.truck_id.in_(truck_ids),
        func.lower(Expense.category) == "combustible",
        Expense.created_at >= start_date,
        Expense.created_at <= end_date
    ).scalar() or 0.0

    trucks_detail = []
    grand_total_km = 0.0
    total_trips = 0

    for truck in trucks:
        travels = db.query(Travel).filter(
            Travel.truck_id == truck.id,
            Travel.status == "finalizado",
            Travel.end_time >= start_date,
            Travel.end_time <= end_date
        ).all()

        t_travels = len(travels)
        total_trips += t_travels
        t_km = 0.0

        for t in travels:
            s_val = str(t.start_odometer).strip() if t.start_odometer else "0"
            e_val = str(t.end_odometer).strip() if t.end_odometer else "0"
            s_odo = float(s_val) if s_val.replace(
                '.', '', 1).isdigit() else 0.0
            e_odo = float(e_val) if e_val.replace(
                '.', '', 1).isdigit() else 0.0
            if e_odo > s_odo:
                t_km += (e_odo - s_odo)

        # Gastos específicos de este camión
        t_exp = db.query(func.sum(Expense.amount)).filter(
            Expense.truck_id == truck.id,
            Expense.created_at >= start_date,
            Expense.created_at <= end_date
        ).scalar() or 0.0

        trucks_detail.append({
            "truck_id": truck.id,
            "license_plate": truck.plate,
            "total_travels": t_travels,
            "total_km": t_km,
            "total_advances": 0.0,
            "total_expenses": float(t_exp),
            "balance": 0.0
        })
        grand_total_km += t_km

    return {
        "month": target_month,
        "year": target_year,
        "owner_id": current_user.id,
        "trucks_detail": trucks_detail,
        "grand_total_km": float(grand_total_km),
        "total_trips": total_trips,
        "grand_total_advances": 0.0,
        "grand_total_expenses": float(grand_total_expenses),
        "fuel_expenses": float(fuel_expenses),
        "grand_total_balance": 0.0
    }
