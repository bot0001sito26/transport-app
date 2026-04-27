from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.owner_notes import OwnerNoteResponse, OwnerNoteCreate
from app.api.deps import get_current_user
from app.models.users import User
from app.services import owner_notes as notes_service

router = APIRouter()


@router.post("/", response_model=OwnerNoteResponse)
def create_note(
    note_in: OwnerNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return notes_service.create_note_service(db, note_in, current_user)


@router.get("/", response_model=List[OwnerNoteResponse])
def get_notes(
    truck_id: int = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return notes_service.get_notes_service(db, current_user, truck_id, limit, skip)


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return notes_service.delete_note_service(db, note_id, current_user)
