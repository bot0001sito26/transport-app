from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.owner_notes import OwnerNote
from app.schemas.owner_notes import OwnerNoteCreate
from app.models.users import User


def create_note_service(db: Session, note_in: OwnerNoteCreate, current_user: User):
    if current_user.role != "owner":
        raise HTTPException(
            status_code=403, detail="Solo gerencia puede crear bitácoras")

    new_note = OwnerNote(**note_in.model_dump(), owner_id=current_user.id)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


def get_notes_service(db: Session, current_user: User, truck_id: int = None, limit: int = 50, skip: int = 0):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    query = db.query(OwnerNote).filter(OwnerNote.owner_id == current_user.id)

    # Si mandamos un ID de camión, filtramos. Si no, devolvemos todas.
    if truck_id:
        query = query.filter(OwnerNote.truck_id == truck_id)

    return query.order_by(OwnerNote.date_recorded.desc()).offset(skip).limit(limit).all()


def delete_note_service(db: Session, note_id: int, current_user: User):
    note = db.query(OwnerNote).filter(OwnerNote.id == note_id).first()
    if not note or note.owner_id != current_user.id:
        raise HTTPException(
            status_code=404, detail="Nota no encontrada o sin permisos")

    db.delete(note)
    db.commit()
    return {"message": "Nota eliminada con éxito"}
