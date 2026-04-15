from sqlalchemy.orm import Session  # pylint: disable=unused-import
from app.db.database import SessionLocal, engine, Base
import app.models  # pylint: disable=unused-import
from app.models.users import User
from app.core.security import get_password_hash


def seed_database():
    print("Conectando a la base de datos...")

    # 1. Crear todas las tablas en la base de datos (vital para la primera vez en Neon)
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Iniciando carga del Administrador...")

        # --- 1. Crear Administrador Principal ---
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrador Principal",
                dni="0000000000",
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("Administrador creado con éxito. Usuario: admin | Clave: admin123")
        else:
            print("El administrador ya existe en la base de datos.")

        print("--- Proceso de Seed finalizado con éxito ---")

    except Exception as e:  # pylint: disable=broad-except
        print(f"Error durante el seed: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
