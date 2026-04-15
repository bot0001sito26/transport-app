from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, index=True)  # 'admin', 'owner', 'driver', 'official'
    full_name = Column(String)
    dni = Column(String, unique=True, index=True)  # Cédula
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    # Integración de Telegram
    telegram_chat_id = Column(String, index=True, nullable=True)

    license_type = Column(String, nullable=True)

    # Rastreabilidad
    created_by_id = Column(Integer, ForeignKey(
        "users.id"), index=True, nullable=True)

    assigned_truck_id = Column(Integer, ForeignKey(
        "trucks.id"), index=True, nullable=True)

    assigned_truck = relationship(
        "Truck", back_populates="driver", foreign_keys=[assigned_truck_id])
