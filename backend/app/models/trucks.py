from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.database import Base
from sqlalchemy.orm import relationship


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String, unique=True, index=True)
    brand = Column(String)
    model = Column(String)
    capacity_tons = Column(Float)

    current_balance = Column(Float, default=0.0)
    status = Column(String, default="disponible", index=True)
    current_travel_id = Column(Integer, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), index=True)

    driver = relationship(
        "User",
        primaryjoin="and_(Truck.id==User.assigned_truck_id, User.role=='driver')",
        uselist=False,
        overlaps="assigned_truck"
    )

    official = relationship(
        "User",
        primaryjoin="and_(Truck.id==User.assigned_truck_id, User.role=='official')",
        uselist=False,
        overlaps="assigned_truck,driver"
    )

    extra_official = relationship(
        "User",
        primaryjoin="and_(Truck.id==User.assigned_truck_id, User.role=='extra_official')",
        uselist=False,
        overlaps="assigned_truck,driver,official"
    )
