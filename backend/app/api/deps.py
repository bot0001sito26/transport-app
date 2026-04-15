from typing import Generator  # pylint: disable=unused-import
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, get_db  # pylint: disable=unused-import
from app.core.config import settings
from app.models.users import User
from app.schemas.token import TokenData

# Define dónde el frontend debe enviar el token
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenData(username=payload.get(
            "sub"), role=payload.get("role"))
    except (jwt.JWTError, ValidationError):
        raise HTTPException(  # pylint: disable=raise-missing-from
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se pudo validar las credenciales",
        )

    user = db.query(User).filter(User.username == token_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
