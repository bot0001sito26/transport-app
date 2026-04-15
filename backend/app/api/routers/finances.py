from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.db.database import get_db
from app.schemas.finances import (
    Advance as AdvanceSchema, AdvanceCreate,
    Expense as ExpenseSchema, ExpenseCreate,
    Salary as SalarySchema, SalaryCreate,
    LiquidationReport
)
from app.api.deps import get_current_user
from app.models.users import User
from app.models.trucks import Truck
from app.models.finances import Expense, Advance, Salary, TruckFund
from app.services import finances as finance_service

router = APIRouter()

# --- Schemas Rápidos para Fondos ---


class TruckFundCreate(BaseModel):
    truck_id: int
    amount: float
    photo_url: str


class TruckFundOut(BaseModel):
    id: int
    truck_id: int
    user_id: int
    amount: float
    photo_url: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


@router.post("/truck-funds/")
def add_truck_fund(
    fund_in: TruckFundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Inyecta dinero físico al fondo de ruta y guarda el comprobante."""
    truck = db.query(Truck).filter(Truck.id == fund_in.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    new_fund_record = TruckFund(
        truck_id=fund_in.truck_id,
        user_id=current_user.id,
        amount=fund_in.amount,
        photo_url=fund_in.photo_url
    )
    db.add(new_fund_record)

    truck.current_balance = (truck.current_balance or 0.0) + fund_in.amount
    db.add(truck)

    db.commit()
    return {"message": "Fondo recargado con éxito", "new_balance": truck.current_balance}


@router.get("/truck-funds/{truck_id}", response_model=List[TruckFundOut])
def get_truck_funds(truck_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    """Obtiene el historial de inyecciones de capital del camión."""
    return db.query(TruckFund).filter(TruckFund.truck_id == truck_id).order_by(TruckFund.created_at.desc()).all()
# -------------------------------------------------------------------------


@router.post("/advances/", response_model=AdvanceSchema)
def create_advance(advance_in: AdvanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return finance_service.create_advance_service(db=db, advance_in=advance_in, current_user=current_user)


@router.post("/salaries/", response_model=SalarySchema)
def create_salary(salary_in: SalaryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return finance_service.create_salary_service(db=db, salary_in=salary_in, current_user=current_user)


@router.post("/expenses/", response_model=ExpenseSchema)
def create_expense(expense_in: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_expense = finance_service.create_expense_service(
        db=db, expense_in=expense_in, _current_user=current_user)

    # AHORA: Todo gasto registrado a un camión descuenta automáticamente del fondo de caja chica
    if expense_in.truck_id:
        truck = db.query(Truck).filter(Truck.id == expense_in.truck_id).first()
        if truck:
            truck.current_balance = max(
                0.0, (truck.current_balance or 0.0) - expense_in.amount)
            db.add(truck)
            db.commit()

    return new_expense


@router.get("/expenses/travel/{travel_id}", response_model=List[ExpenseSchema])
def get_travel_expenses(travel_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    return db.query(Expense).options(joinedload(Expense.user)).filter(Expense.travel_id == travel_id).order_by(Expense.created_at.desc()).all()


@router.get("/liquidation/{travel_id}", response_model=LiquidationReport)
def get_trip_liquidation(travel_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    return finance_service.get_trip_liquidation_service(db=db, travel_id=travel_id)


@router.get("/advances/user/{user_id}", response_model=List[AdvanceSchema])
def get_user_advances(user_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    return db.query(Advance).filter(Advance.user_id == user_id).order_by(Advance.date_given.desc()).offset(skip).limit(limit).all()


@router.get("/salaries/user/{user_id}", response_model=List[SalarySchema])
def get_user_salaries(user_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    return db.query(Salary).filter(Salary.user_id == user_id).order_by(Salary.date_paid.desc()).offset(skip).limit(limit).all()


@router.get("/expenses/truck/{truck_id}", response_model=List[ExpenseSchema])
def get_truck_expenses(truck_id: int, db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    # SE QUITÓ EL .limit(50) - Ahora devuelve todo el historial
    return db.query(Expense).options(joinedload(Expense.user)).filter(Expense.truck_id == truck_id).order_by(Expense.created_at.desc()).all()
