from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
import app.models
from app.api.routers import api_router  # Importamos el hub central
from fastapi.staticfiles import StaticFiles
import os  # pylint: disable=unused-import

# Crear tablas
Base.metadata.create_all(bind=engine)

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

app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Incluir todas las rutas de la API desde el hub
app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "API de Transport operativa"}
