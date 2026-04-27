from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.timezone import ecuador_now
import enum


class GuideType(str, enum.Enum):
    carga = "carga"
    entrega = "entrega"


class Travel(Base):
    __tablename__ = "travels"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="cargado", index=True)

    loaded_at = Column(DateTime, default=ecuador_now, index=True)
    start_time = Column(DateTime, default=ecuador_now, nullable=True)
    delivered_at = Column(DateTime, default=ecuador_now, nullable=True)
    end_time = Column(DateTime, default=ecuador_now, nullable=True)

    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    driver_id = Column(Integer, ForeignKey(
        "users.id"), nullable=False, index=True)
    official_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    extra_official_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    material_type = Column(String, index=True)
    weight_kg = Column(Float)

    start_odometer = Column(Float, nullable=True)
    start_odometer_photo_url = Column(String, nullable=True)
    end_odometer = Column(Float, nullable=True)
    end_odometer_photo_url = Column(String, nullable=True)

    # NUEVOS CAMPOS FINANCIEROS (Por Viaje Completo)
    billing_status = Column(String, default="pendiente",
                            index=True)  # 'pendiente', 'pagado'
    amount_paid = Column(Float, default=0.0)
    invoice_url = Column(String, nullable=True)  # Factura general del viaje

    destinations = relationship(
        "TravelDestination", back_populates="travel", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_travels_truck_status_end', 'truck_id', 'status', 'end_time'),
    )


class TravelDestination(Base):
    __tablename__ = "travel_destinations"

    id = Column(Integer, primary_key=True, index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id", ondelete="CASCADE"), index=True)
    client_name = Column(String, index=True)

    status = Column(String, default="pendiente", index=True)

    # CAMPOS LOGÍSTICOS DEL CLIENTE
    # Lista de embarque (Se sube al cargar)
    packing_list_url = Column(String, nullable=True)
    # Foto de estibas (Se sube al descargar)
    stowage_photo_url = Column(String, nullable=True)

    travel = relationship("Travel", back_populates="destinations")
    guides = relationship(
        "TravelGuide", back_populates="destination", cascade="all, delete-orphan")


class TravelGuide(Base):
    __tablename__ = "travel_guides"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey(
        "travel_destinations.id", ondelete="CASCADE"), index=True)
    photo_url = Column(String, nullable=False)
    guide_type = Column(SQLEnum(GuideType), index=True, nullable=False)
    weight_kg = Column(Float, nullable=True)

    created_at = Column(DateTime, default=ecuador_now)
    destination = relationship("TravelDestination", back_populates="guides")
