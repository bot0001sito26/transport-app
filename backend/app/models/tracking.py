from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from app.db.database import Base
from app.core.timezone import ecuador_now


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), index=True)
    travel_id = Column(Integer, ForeignKey(
        "travels.id"), index=True, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)

    device_time = Column(DateTime, default=ecuador_now,
                         nullable=False, index=True)
    source = Column(String)
    created_at = Column(DateTime, default=ecuador_now)

    __table_args__ = (
        Index('ix_locations_travel_time', 'travel_id', 'device_time'),
        Index('ix_locations_truck_time', 'truck_id', 'device_time'),
    )
