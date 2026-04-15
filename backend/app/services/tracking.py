from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
import httpx

from app.models.tracking import Location
from app.models.trucks import Truck
from app.models.travels import Travel
from app.models.users import User
from app.schemas.tracking import LocationCreate
from app.core.config import settings


def add_location_service(db: Session, location_in: LocationCreate, _current_user: User) -> Location:
    truck = db.query(Truck).filter(Truck.id == location_in.truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    db_location = Location(**location_in.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


def get_truck_route_service(db: Session, truck_id: int, limit: int, current_user: User):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camión no encontrado")

    if current_user.role == "owner" and truck.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="No tienes permiso para ver este camión")

    locations = db.query(Location)\
        .filter(Location.truck_id == truck_id)\
        .order_by(Location.device_time.desc())\
        .limit(limit)\
        .all()
    return locations


async def process_telegram_webhook_service(db: Session, data: dict):
    message = data.get("message") or data.get("edited_message")
    if not message:
        return {"status": "ok", "detail": "No message or edited_message found"}

    chat_id = str(message.get("chat", {}).get("id"))
    text = message.get("text", "")
    location = message.get("location")

    if text.startswith("/start") or text.startswith("/id"):
        bot_token = settings.TELEGRAM_BOT_TOKEN
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        mensaje_respuesta = (
            f" Bienvenido a Transport ERP.\n\n"
            f"Tu ID de Telegram es: {chat_id}\n\n"
            f"Por favor, entrégale este número al administrador para que vincule tu cuenta."
        )
        payload = {"chat_id": chat_id, "text": mensaje_respuesta}
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload)
        return {"status": "ok", "detail": "ID sent to user"}

    if location:
        user = db.query(User).filter(User.telegram_chat_id == chat_id).first()
        if not user:
            return {"status": "ignored", "detail": "Usuario no registrado en la BD"}

        # Buscamos si este Oficial o Chofer tiene un viaje activo
        active_travel = db.query(Travel).filter(
            (Travel.driver_id == user.id) | (Travel.official_id ==
                                             user.id) | (Travel.extra_official_id == user.id),
            Travel.status.in_(["en_curso", "retornando"])
        ).first()

        if active_travel:
            # NUEVO: Guardamos el travel_id
            new_loc = Location(
                truck_id=active_travel.truck_id,
                travel_id=active_travel.id,
                latitude=location["latitude"],
                longitude=location["longitude"],
                speed=0.0,
                device_time=datetime.now(timezone.utc),
                source="telegram"
            )
            db.add(new_loc)
            db.commit()
            print(
                f" Coordenada GPS guardada para el camión ID: {active_travel.truck_id}, Viaje: {active_travel.id}")

    return {"status": "ok"}
