from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.finances import Advance, Expense, Salary
from app.models.travels import Travel
from app.models.users import User
from app.models.trucks import Truck
from app.schemas.finances import AdvanceCreate, ExpenseCreate, SalaryCreate
from sqlalchemy import func
import traceback


def create_advance_service(db: Session, advance_in: AdvanceCreate, current_user: User) -> Advance:
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=403, detail="Solo los dueños pueden registrar viáticos")

    employee = db.query(User).filter(User.id == advance_in.user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    db_advance = Advance(**advance_in.model_dump())
    db.add(db_advance)
    db.commit()
    db.refresh(db_advance)
    return db_advance


def create_salary_service(db: Session, salary_in: SalaryCreate, current_user: User) -> Salary:
    if current_user.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=403, detail="Solo los dueños pueden registrar sueldos")

    employee = db.query(User).filter(User.id == salary_in.user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    db_salary = Salary(**salary_in.model_dump())
    db.add(db_salary)
    db.commit()
    db.refresh(db_salary)
    return db_salary


def create_expense_service(db: Session, expense_in: ExpenseCreate, _current_user: User) -> Expense:
    # 1. Verificar el camión y validar que tenga fondos suficientes
    truck = db.query(Truck).filter(Truck.id == expense_in.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    if truck.current_balance < expense_in.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Fondo insuficiente en la unidad. Saldo actual: ${truck.current_balance:.2f}"
        )

    # 2. Validar el viaje SOLO si se envía un travel_id
    if expense_in.travel_id:
        travel = db.query(Travel).filter(
            Travel.id == expense_in.travel_id).first()
        if not travel:
            raise HTTPException(status_code=404, detail="Viaje no encontrado")

    category = expense_in.category.lower()

    # 3. Validación estricta para Combustible
    if category == "combustible":
        if not expense_in.gallons or not expense_in.odometer_reading:
            raise HTTPException(
                status_code=400,
                detail="Para combustible es obligatorio registrar los galones y el odómetro actual."
            )
        if not expense_in.photo_url:
            raise HTTPException(
                status_code=400,
                detail="El comprobante (foto) del combustible es obligatorio."
            )

    # 4. Validación estricta para Peajes
    if category == "peaje":
        if not expense_in.photo_url:
            raise HTTPException(
                status_code=400,
                detail="Para registrar un peaje es obligatorio subir la foto del ticket."
            )

    # 5. Descontar el dinero de la caja chica del camión (LA CORRECCIÓN)
    truck.current_balance -= expense_in.amount

    # 6. Guardar el gasto
    db_expense = Expense(**expense_in.model_dump())
    db.add(db_expense)
    db.add(truck)  # Guardamos el nuevo saldo del camión
    db.commit()
    db.refresh(db_expense)

    return db_expense


def get_trip_liquidation_service(db: Session, travel_id: int) -> dict:
    travel = db.query(Travel).filter(Travel.id == travel_id).first()
    if not travel:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    try:
        total_expenses = db.query(func.sum(Expense.amount)).filter(
            Expense.travel_id == travel_id).scalar() or 0.0

        start_raw = getattr(travel, 'start_odometer', "0")
        end_raw = getattr(travel, 'end_odometer', "0")
        start_val = str(start_raw).strip() if start_raw else "0"
        end_val = str(end_raw).strip() if end_raw else "0"
        start_odo = float(start_val) if start_val.replace(
            '.', '', 1).isdigit() else 0.0
        end_odo = float(end_val) if end_val.replace(
            '.', '', 1).isdigit() else 0.0
        odometer_km = (end_odo - start_odo) if (end_odo >
                                                0 and start_odo > 0) else 0.0

        estado = getattr(travel, 'status', "FINALIZADO") or "FINALIZADO"
        material = getattr(travel, 'material_type', getattr(
            travel, 'material', "SIN ESPECIFICAR")) or "SIN ESPECIFICAR"

        # --- LÓGICA DE EXTRACCIÓN DE DESTINOS ---
        destino = "SIN DESTINO"
        if hasattr(travel, 'destinations') and travel.destinations:
            nombres = [d.client_name for d in travel.destinations if hasattr(
                d, 'client_name')]
            if nombres:
                destino = " / ".join(nombres)
        elif getattr(travel, 'destination_client', None):
            destino = travel.destination_client

        return {
            "travel_id": travel.id,
            "status": estado,
            "material": material,
            "destination": destino,
            "total_advances": 0.0,
            "total_expenses": float(total_expenses),
            "balance": 0.0,
            "odometer_km": float(odometer_km),
            "gps_km": float(odometer_km),
            "km_difference": 0.0
        }
    except Exception as e:
        print("======== ERROR CRÍTICO EN LIQUIDACIÓN ========")
        print(traceback.format_exc())
        print("==============================================")
        raise HTTPException(status_code=500, detail=str(e)) from e


def get_user_current_balance(db: Session, user_id: int) -> float:
    total_given = db.query(func.sum(Advance.amount)).filter(
        Advance.user_id == user_id).scalar() or 0.0
    return total_given
