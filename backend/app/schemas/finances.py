from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List
from typing import Optional

# --- FONDO DE RUTA (CAJA CHICA) ---


class TruckFundCreate(BaseModel):
    truck_id: int
    amount: float
    photo_url: str

# --- ANTICIPOS / VIÁTICOS ---


class AdvanceBase(BaseModel):
    user_id: int
    travel_id: Optional[int] = None
    amount: float
    description: str
    photo_url: str


class AdvanceCreate(AdvanceBase):
    pass


class Advance(AdvanceBase):
    id: int
    date_given: datetime
    model_config = ConfigDict(from_attributes=True)

# --- SUELDOS / QUINCENAS ---


class SalaryBase(BaseModel):
    user_id: int
    amount: float
    description: str
    photo_url: str


class SalaryCreate(SalaryBase):
    pass


class Salary(SalaryBase):
    id: int
    date_paid: datetime
    model_config = ConfigDict(from_attributes=True)

# --- GASTOS DE LA UNIDAD / RUTA ---


class ExpenseBase(BaseModel):
    truck_id: int
    travel_id: Optional[int] = None
    user_id: int
    category: str
    amount: float
    description: Optional[str] = None
    gallons: Optional[float] = None
    odometer_reading: Optional[float] = None
    photo_url: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- REPORTES ---


class Liquidation(BaseModel):
    travel_id: int
    total_advances: float
    total_expenses: float
    balance: float
    odometer_km: float
    gps_km: float
    km_difference: float


class LiquidationReport(BaseModel):
    travel_id: int
    status: str
    material: str
    destination: str
    total_advances: float
    total_expenses: float
    balance: float
    odometer_km: float
    gps_km: float
    km_difference: float


class TruckMonthlySummary(BaseModel):
    truck_id: int
    license_plate: str
    total_travels: int
    total_km: float
    total_advances: float
    total_expenses: float
    balance: float


class MonthlySummaryReport(BaseModel):
    month: int
    year: int
    owner_id: int
    trucks_detail: List[dict]
    grand_total_km: float
    total_trips: int = 0
    grand_total_advances: float
    grand_total_expenses: float
    fuel_expenses: float = 0.0
    grand_total_balance: float
