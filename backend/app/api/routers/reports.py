from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.schemas.finances import LiquidationReport, MonthlySummaryReport
from app.api.deps import get_current_user
from app.models.users import User
from app.services import reports as reports_service

router = APIRouter()


@router.get("/liquidation/{travel_id}", response_model=LiquidationReport)
def get_travel_liquidation(
    travel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cruza los datos financieros con la auditoría satelital de GPS."""
    return reports_service.generate_liquidation_service(db=db, travel_id=travel_id, current_user=current_user)


@router.get("/monthly-summary", response_model=MonthlySummaryReport)
def get_monthly_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Genera un resumen gerencial mensual para el dueño."""
    return reports_service.generate_monthly_summary_service(
        db=db, current_user=current_user, month=month, year=year
    )
