from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.timezone import ecuador_now


class Advance(Base):
    __tablename__ = "advances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id"), nullable=True, index=True)
    amount = Column(Float)
    description = Column(String)
    photo_url = Column(String)
    date_given = Column(DateTime, default=ecuador_now, index=True)

    __table_args__ = (
        Index('ix_advances_user_date', 'user_id', 'date_given'),
    )


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    category = Column(String, index=True)
    amount = Column(Float)
    description = Column(String, nullable=True)
    gallons = Column(Float, nullable=True)
    odometer_reading = Column(Float, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=ecuador_now, index=True)

    user = relationship("User")
    truck = relationship("Truck")

    __table_args__ = (
        Index('ix_expenses_truck_date', 'truck_id', 'created_at'),
        Index('ix_expenses_travel_date', 'travel_id', 'created_at'),
    )


class Salary(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float)
    description = Column(String)
    photo_url = Column(String)
    date_paid = Column(DateTime, default=ecuador_now, index=True)

    __table_args__ = (
        Index('ix_salaries_user_date', 'user_id', 'date_paid'),
    )


class TruckFund(Base):
    __tablename__ = "truck_funds"
    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    photo_url = Column(String)
    created_at = Column(DateTime, default=ecuador_now, index=True)

    truck = relationship("Truck")
    user = relationship("User")

    __table_args__ = (
        Index('ix_truck_funds_truck_date', 'truck_id', 'created_at'),
    )
