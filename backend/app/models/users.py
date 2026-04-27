from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Index
from app.db.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, index=True)
    full_name = Column(String)
    dni = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    # Lo mantenemos solo por si usas Telegram para enviar mensajes/alertas
    telegram_chat_id = Column(String, index=True, nullable=True)
    license_type = Column(String, nullable=True)

    created_by_id = Column(Integer, ForeignKey(
        "users.id"), index=True, nullable=True)

    # --- CORRECCIÓN DE LA DEPENDENCIA CIRCULAR ---
    # use_alter=True permite a SQLAlchemy crear las tablas primero
    # y conectar esta llave foránea después.
    assigned_truck_id = Column(
        Integer,
        ForeignKey("trucks.id", use_alter=True, name="fk_user_assigned_truck"),
        index=True,
        nullable=True
    )

    assigned_truck = relationship(
        "Truck", back_populates="driver", foreign_keys=[assigned_truck_id])

    __table_args__ = (
        Index('ix_users_truck_role', 'assigned_truck_id', 'role'),
    )
