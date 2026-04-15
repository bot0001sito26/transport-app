from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.db.database import Base
import datetime


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id"), index=True, nullable=True)

    # Coordenadas exactas
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Velocidad en km/h
    speed = Column(Float, default=0.0)

    # La hora exacta en la que el satélite tomó la posición
    device_time = Column(DateTime, nullable=False, index=True)

    # Para saber quién reportó esta coordenada: 'web_start', 'web_delivery', 'telegram', etc.
    source = Column(String)

    # La hora en la que nuestro servidor guardó el dato
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
