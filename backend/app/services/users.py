from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.users import User
from app.schemas.users import UserCreate
from app.core.security import get_password_hash


def create_user_service(db: Session, user_in: UserCreate, current_user: User) -> User:
    # 1. Validaciones de Jerarquía
    if current_user.role == "admin":
        if user_in.role != "owner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un Administrador solo puede crear usuarios con el rol 'owner'"
            )
    elif current_user.role == "owner":
        # Solo permitimos 'driver' y 'official'
        if user_in.role not in ["driver", "official"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rol '{user_in.role}' no permitido. Un Dueño solo puede crear 'driver' o 'official'."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios"
        )

    # 2. Verificar duplicados (Username y DNI)
    user_check = db.query(User).filter(
        (User.username == user_in.username) | (User.dni == user_in.dni)
    ).first()

    if user_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o el DNI ya están registrados en el sistema"
        )

    # --- MAGIA DEL RELEVO: Bajar al tripulante anterior ---
    if user_in.assigned_truck_id:
        old_crew = db.query(User).filter(
            User.assigned_truck_id == user_in.assigned_truck_id,
            User.role == user_in.role
        ).first()

        if old_crew:
            old_crew.assigned_truck_id = None
            db.add(old_crew)
            db.flush()  # Guardamos temporalmente el cambio
    # -------------------------------------------------------

    # 3. Creación del registro
    db_user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        dni=user_in.dni,
        role=user_in.role,
        phone=user_in.phone,
        created_by_id=current_user.id,
        assigned_truck_id=user_in.assigned_truck_id,
        telegram_chat_id=user_in.telegram_chat_id,
        license_type=user_in.license_type
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users_service(db: Session, current_user: User, skip: int = 0, limit: int = 100):
    query = db.query(User)

    if current_user.role == "admin":
        return query.filter(User.role == "owner").offset(skip).limit(limit).all()
    elif current_user.role == "owner":
        return query.filter(User.created_by_id == current_user.id).offset(skip).limit(limit).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")


def toggle_user_active_service(db: Session, user_id: int, is_active: bool, current_user: User) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.created_by_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="No tienes permiso sobre este usuario")

    user.is_active = is_active

    # Si lo desactivamos, lo bajamos del camión por seguridad
    if not is_active:
        user.assigned_truck_id = None

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def reset_password_service(db: Session, user_id: int, new_password: str, current_user: User) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or (user.created_by_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(
            status_code=403, detail="No autorizado para cambiar esta contraseña")

    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def link_telegram_service(db: Session, user_id: int, telegram_id: str, current_user: User) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    can_edit = (
        current_user.role == "admin" or
        current_user.id == user_id or
        (current_user.role == "owner" and user.created_by_id == current_user.id)
    )

    if not can_edit:
        raise HTTPException(
            status_code=403, detail="No tienes permiso para vincular este ID")

    user.telegram_chat_id = telegram_id
    db.commit()
    db.refresh(user)
    return user


def assign_truck_service(db: Session, user_id: int, truck_id: int | None, current_user: User) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.created_by_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="No tienes permiso sobre este usuario")

    if truck_id is not None:
        old_crew = db.query(User).filter(
            User.assigned_truck_id == truck_id,
            User.role == user.role
        ).first()

        if old_crew and old_crew.id != user.id:
            old_crew.assigned_truck_id = None
            db.add(old_crew)
            db.flush()

    user.assigned_truck_id = truck_id
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
