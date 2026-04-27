import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

# Directorio base para subidas
BASE_UPLOAD_DIR = "uploads"


def save_file(file: UploadFile, subfolder: str) -> str:
    folder_path = os.path.join(BASE_UPLOAD_DIR, subfolder)

    # Respaldo de seguridad por si envían una carpeta que no estaba en el main.py
    os.makedirs(folder_path, exist_ok=True)

    # Extraemos la extensión original o ponemos png por defecto
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'

    # Generamos un nombre único (UUID) para evitar que archivos con el mismo nombre se chanquen
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(folder_path, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:  # pylint: disable=broad-except
        raise HTTPException(
            status_code=500, detail="Error interno al guardar el archivo") from e

    # Devolvemos la ruta relativa para que el frontend la pueda renderizar sumándole la URL de la API
    return f"/{BASE_UPLOAD_DIR}/{subfolder}/{unique_filename}"


@router.post("/")
def upload_generic_file(file: UploadFile = File(...)):
    """Endpoint genérico si no se especifica carpeta (se va a 'otros')"""
    url = save_file(file, "otros")
    return {"url": url}


@router.post("/{folder:path}")
def upload_folder_file(folder: str, file: UploadFile = File(...)):
    """
    Endpoint dinámico que respeta la estructura. 
    Ej: POST /upload/sueldos -> se va a uploads/sueldos
    Ej: POST /upload/guias/sellada -> se va a uploads/guias/sellada
    """
    # Seguridad básica para evitar que suban niveles (Directory Traversal)
    safe_folder = folder.replace("..", "").strip("/")
    if not safe_folder:
        safe_folder = "otros"

    url = save_file(file, safe_folder)
    return {"url": url}
