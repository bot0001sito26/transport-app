from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.timezone import ecuador_now


class OwnerNote(Base):
    __tablename__ = "owner_notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)

    # Añadimos index=True por si en el futuro decides filtrar "Muéstrame solo las notas de Mecánica"
    category = Column(String, default="General", index=True)

    # ¡CRÍTICO! Añadimos índice porque siempre ordenamos por fecha (ORDER BY date_recorded DESC)
    date_recorded = Column(DateTime(timezone=True),
                           default=ecuador_now, index=True)

    # ¡CRÍTICO! Añadimos índice porque SIEMPRE filtramos por el dueño
    owner_id = Column(Integer, ForeignKey("users.id"),
                      nullable=False, index=True)

    # ¡CRÍTICO! Añadimos índice porque en tu frontend pusimos un filtro por camión
    truck_id = Column(Integer, ForeignKey(
        "trucks.id"), nullable=True, index=True)

    owner = relationship("User", foreign_keys=[owner_id])
    truck = relationship("Truck", foreign_keys=[truck_id])

    __table_args__ = (
        Index('ix_owner_notes_owner_date', 'owner_id', 'date_recorded'),
    )
