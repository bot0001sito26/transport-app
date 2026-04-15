from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timezone
import httpx

from app.db.database import get_db
from app.core.config import settings
from app.models.users import User
from app.models.tracking import Location
from app.models.travels import Travel

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()

    # Capturamos el mensaje normal o el mensaje editado (Telegram envía actualizaciones de ubicación en vivo como edited_message)
    message = data.get("message") or data.get("edited_message")

    if not message:
        return {"status": "ok", "detail": "No message or edited_message found"}

    chat_id = str(message.get("chat", {}).get("id"))
    text = message.get("text", "")
    location = message.get("location")

    # 1. GESTIÓN DE COMANDOS (IDENTIFICACIÓN)
    if text and (text.startswith("/start") or text.startswith("/id")):
        bot_token = settings.TELEGRAM_BOT_TOKEN
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

        mensaje_respuesta = (
            f"Bienvenido al Sistema de Gestión de Transporte.\n\n"
            f"Tu ID de Telegram es: {chat_id}\n\n"
            f"Por favor, proporciona este número al administrador para vincular tu cuenta y habilitar el rastreo satelital."
        )

        payload = {"chat_id": chat_id, "text": mensaje_respuesta}

        async with httpx.AsyncClient() as client:
            try:
                await client.post(url, json=payload)
            except Exception as e:  # pylint: disable=broad-except
                print(f"Error enviando mensaje a Telegram: {e}")

        return {"status": "ok", "detail": "ID sent to user"}

    # 2. PROCESAMIENTO DE RASTREO GPS EN VIVO
    if location:
        # Buscamos al usuario por su ID de Telegram vinculado en la base de datos
        user = db.query(User).filter(User.telegram_chat_id == chat_id).first()

        if not user:
            # Si el chat_id no está registrado, ignoramos la ubicación para optimizar recursos
            return {"status": "ignored", "detail": "Chat ID no vinculado a ningun usuario"}

        # BÚSQUEDA DE VIAJE ACTIVO:
        # Buscamos un viaje donde el usuario sea el chofer o el oficial y el estado sea operativo
        active_travel = db.query(Travel).filter(
            or_(
                Travel.driver_id == user.id,
                Travel.official_id == user.id,
                Travel.extra_official_id == user.id
            ),
            Travel.status.in_(["en_curso", "retornando"])
        ).first()

        if active_travel:
            # Registramos la coordenada vinculándola al camión y al ID del viaje correspondiente
            new_loc = Location(
                truck_id=active_travel.truck_id,
                travel_id=active_travel.id,  # <--- Vinculación estructural
                latitude=location["latitude"],
                longitude=location["longitude"],
                speed=0.0,  # Telegram no siempre envía velocidad precisa en el objeto location
                device_time=datetime.now(timezone.utc),
                source="telegram"
            )

            try:
                db.add(new_loc)
                db.commit()

                # LOG ESTRUCTURADO PARA CONSOLA (Auditoría en tiempo real)
                print(
                    f"GPS TELEGRAM -> Camion: {active_travel.truck_id} | Viaje: {active_travel.id} | Usuario: {user.username} | Estado: {active_travel.status}")

            except Exception as e:  # pylint: disable=broad-except
                db.rollback()
                print(f"Error al guardar localizacion: {e}")
        else:
            # Log informativo: el usuario envía GPS pero no tiene un viaje que rastrear actualmente
            print(
                f"GPS RECIBIDO -> Usuario: {user.username} (Sin viaje activo en curso o retornando)")

    return {"status": "ok"}
