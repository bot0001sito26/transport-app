from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime
import enum


class GuideType(str, enum.Enum):
    carga = "carga"
    entrega = "entrega"


class Travel(Base):
    __tablename__ = "travels"

    id = Column(Integer, primary_key=True, index=True)
    # Estados: 'cargado', 'en_curso', 'retornando', 'finalizado', 'cancelado'
    status = Column(String, default="cargado", index=True)

    # CORRECCIÓN: Usamos datetime.now para hora local
    loaded_at = Column(DateTime, default=datetime.datetime.now, index=True)
    start_time = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    # Asignaciones
    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    driver_id = Column(Integer, ForeignKey(
        "users.id"), nullable=False, index=True)
    official_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    extra_official_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Datos Generales de Carga
    material_type = Column(String, index=True)
    weight_kg = Column(Float)

    # Odómetros
    start_odometer = Column(Float, nullable=True)
    start_odometer_photo_url = Column(String, nullable=True)
    end_odometer = Column(Float, nullable=True)
    end_odometer_photo_url = Column(String, nullable=True)

    # Relación principal: 1 Viaje tiene Muchos Destinos
    destinations = relationship(
        "TravelDestination", back_populates="travel", cascade="all, delete-orphan")


class TravelDestination(Base):
    __tablename__ = "travel_destinations"

    id = Column(Integer, primary_key=True, index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id", ondelete="CASCADE"), index=True)
    client_name = Column(String, index=True)
    # 'pendiente', 'entregado'
    status = Column(String, default="pendiente", index=True)

    # Relaciones
    travel = relationship("Travel", back_populates="destinations")
    guides = relationship(
        "TravelGuide", back_populates="destination", cascade="all, delete-orphan")


class TravelGuide(Base):
    __tablename__ = "travel_guides"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey(
        "travel_destinations.id", ondelete="CASCADE"), index=True)
    photo_url = Column(String, nullable=False)
    guide_type = Column(SQLEnum(GuideType), index=True,
                        nullable=False)  # 'carga' o 'entrega'
    weight_kg = Column(Float, nullable=True)

    # CORRECCIÓN: Usamos datetime.now para hora local
    created_at = Column(DateTime, default=datetime.datetime.now)

    # Relaciones
    destination = relationship("TravelDestination", back_populates="guides")
