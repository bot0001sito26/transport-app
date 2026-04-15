from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.users import User
from app.schemas.users import User as UserSchema, UserCreate
from app.api.deps import get_current_user
from app.services import users as user_service

router = APIRouter()


@router.post("/", response_model=UserSchema)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_user)
):
    """Crea un usuario siguiendo la jerarquía y realiza relevos automáticos."""
    return user_service.create_user_service(db=db, user_in=user_in, current_user=current_user)


@router.get("/", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Lista usuarios según permisos."""
    return user_service.get_users_service(db=db, current_user=current_user, skip=skip, limit=limit)


@router.get("/me", response_model=UserSchema)
def read_user_me(current_user: User = Depends(get_current_user)):
    """Retorna la información del usuario de la sesión activa."""
    return current_user


@router.patch("/{user_id}/status", response_model=UserSchema)
def toggle_user_active(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permite activar/desactivar un usuario. Si se desactiva, se baja del camión."""
    return user_service.toggle_user_active_service(db=db, user_id=user_id, is_active=is_active, current_user=current_user)


@router.patch("/{user_id}/password", response_model=UserSchema)
def reset_password(
    user_id: int,
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset de contraseña."""
    return user_service.reset_password_service(db=db, user_id=user_id, new_password=new_password, current_user=current_user)


@router.patch("/{user_id}/link-telegram", response_model=UserSchema)
def link_telegram(
    user_id: int,
    telegram_id: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vincula un ID de Telegram."""
    return user_service.link_telegram_service(db=db, user_id=user_id, telegram_id=telegram_id, current_user=current_user)


@router.patch("/{user_id}/assign-truck", response_model=UserSchema)
def assign_truck(
    user_id: int,
    truck_id: Optional[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reasigna a un empleado existente a un camión (o lo baja enviando null). Hace relevo automático."""
    return user_service.assign_truck_service(db=db, user_id=user_id, truck_id=truck_id, current_user=current_user)
