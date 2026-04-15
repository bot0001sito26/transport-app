from fastapi import APIRouter, Depends, UploadFile, File, Form, Path, HTTPException, status
from typing import Dict
from datetime import datetime
import shutil
import os
from PIL import Image

from app.api.deps import get_current_user
from app.models.users import User

router = APIRouter()

UPLOAD_BASE_DIR = "uploads"

# Mapeo de la URL (category) hacia la RUTA REAL de la carpeta en el servidor
ALLOWED_CATEGORIES = {
    "guias_emision": "guias/remision",  # <-- Actualizado a tu nueva estructura
    "guias_entrega": "guias/sellada",   # <-- Actualizado a tu nueva estructura
    "combustible": "combustible",
    "peaje": "peajes",
    "comida": "alimentacion",
    "mecanica": "mecanica",
    "otros": "otros",
    "viaticos": "viaticos",
    "fondos": "fondos",
    "sueldos": "sueldos",
    "odometro_inicial": "odometro/inicial",
    "odometro_final": "odometro/final"
}

# Nombres más amigables para guardar el archivo (Lo que leerás en el explorador de Windows/Linux)
FILE_NAME_MAP = {
    "guias_emision": "guia_remision",
    "guias_entrega": "guia_sellada",
    "combustible": "combustible",
    "peaje": "peaje",
    "comida": "viatico_comida",
    "mecanica": "mecanica",
    "otros": "otros_gastos",
    "viaticos": "viatico_efectivo",
    "fondos": "abono_fondo",
    "sueldos": "sueldo",
    "odometro_inicial": "odometro_salida",
    "odometro_final": "odometro_llegada"
}


@router.post("/{category}", response_model=Dict[str, str])
def upload_image_by_category(
    category: str = Path(..., description="Categoria del archivo"),
    file: UploadFile = File(...),
    travel_id: str = Form(default="patio"),
    current_user: User = Depends(get_current_user)
):
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Categoria invalida. Opciones: {', '.join(ALLOWED_CATEGORIES.keys())}"
        )

    # Protección: Solo dueños pueden subir comprobantes de dinero (viáticos, fondos, sueldos)
    if category in ["viaticos", "fondos", "sueldos"] and current_user.role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes para procesar documentos financieros."
        )

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no permitido"
        )

    # Aquí lee la ruta de tu nueva estructura (ej. "guias/remision")
    sub_path = ALLOWED_CATEGORIES[category]
    full_dir_path = os.path.join(UPLOAD_BASE_DIR, sub_path)
    os.makedirs(full_dir_path, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Aseguramos que el prefijo tenga sentido
    prefix = f"viaje{travel_id}" if travel_id != "patio" else "patio"
    friendly_category_name = FILE_NAME_MAP.get(category, category)

    try:
        # LÓGICA DE OPTIMIZACIÓN DE IMÁGENES
        if file_ext in [".jpg", ".jpeg", ".png", ".webp"]:
            # Abrimos la imagen usando Pillow
            image = Image.open(file.file)

            # Si tiene canal alpha (transparencia de PNG) lo quitamos para poder guardarlo como JPG
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Redimensionar (máximo 1024x1024, mantiene la proporción automáticamente)
            image.thumbnail((1024, 1024))

            # Ejemplo de nombre final: viaje12_guia_remision_20260410_013237.jpg
            unique_filename = f"{prefix}_{friendly_category_name}_{timestamp}.jpg"
            file_path = os.path.join(full_dir_path, unique_filename)

            # Guardamos comprimiendo al 70% de calidad (excelente para documentos)
            image.save(file_path, format="JPEG", optimize=True, quality=70)

        else:
            # Si es PDF, lo guardamos tal cual de forma binaria
            unique_filename = f"{prefix}_{friendly_category_name}_{timestamp}{file_ext}"
            file_path = os.path.join(full_dir_path, unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fisico al procesar y guardar el archivo"
        ) from exc

    return {"url": f"/static/{sub_path}/{unique_filename}"}
