from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Advance(Base):
    __tablename__ = "advances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id"), nullable=True, index=True)
    amount = Column(Float)
    description = Column(String)
    photo_url = Column(String)
    # Guardamos hora local de Ecuador directamente
    date_given = Column(DateTime, default=datetime.now, index=True)


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
    # Guardamos hora local de Ecuador directamente
    created_at = Column(DateTime, default=datetime.now, index=True)

    user = relationship("User")
    truck = relationship("Truck")


class Salary(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float)
    description = Column(String)
    photo_url = Column(String)
    date_paid = Column(DateTime, default=datetime.now, index=True)


class TruckFund(Base):
    __tablename__ = "truck_funds"
    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    photo_url = Column(String)
    created_at = Column(DateTime, default=datetime.now)

    truck = relationship("Truck")
    user = relationship("User")
