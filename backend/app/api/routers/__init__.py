from fastapi import APIRouter
# Iremos agregando los demás aquí
from app.api.routers import auth, users, trucks, travels, upload, finances, tracking, telegram, reports, owner_notes

api_router = APIRouter()

# Unimos los módulos con sus respectivos prefijos y etiquetas
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])
api_router.include_router(trucks.router, prefix="/trucks", tags=["Camiones"])
api_router.include_router(travels.router, prefix="/travels", tags=["Viajes"])
api_router.include_router(upload.router, prefix="/upload",
                          tags=["Subida de Archivos"])
api_router.include_router(
    finances.router, prefix="/finances", tags=["Finanzas"])
api_router.include_router(
    tracking.router, prefix="/tracking", tags=["GPS y Rastreo"])
api_router.include_router(
    telegram.router, prefix="/telegram", tags=["Telegram Webhook"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reportes"])
api_router.include_router(
    owner_notes.router, prefix="/notes", tags=["Owner Notes"])
