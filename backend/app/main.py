from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.models
from app.api.routers import api_router  # Importamos el hub central
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="Transport - Sistema de Gestión Logística",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*",
                   "http://localhost:3000",
                   "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Definimos toda tu estructura de carpetas para mantener el orden
UPLOAD_DIRS = [
    "uploads",
    "uploads/alimentacion",
    "uploads/combustible",
    "uploads/fondos",
    "uploads/gastos",
    "uploads/guias",
    "uploads/guias/remision",
    "uploads/guias/sellada",
    "uploads/mecanica",
    "uploads/odometro",
    "uploads/odometro/inicial",
    "uploads/odometro/final",
    "uploads/otros",
    "uploads/peajes",
    "uploads/sueldos",
    "uploads/viaticos"
]

# 2. Creamos todas las carpetas dinámicamente si no existen
for dir_path in UPLOAD_DIRS:
    os.makedirs(dir_path, exist_ok=True)

# 3. Montamos la carpeta principal para servir los estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
# Incluir todas las rutas de la API desde el hub
app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "API de Transport operativa"}
