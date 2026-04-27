from sqlalchemy.orm import Session  # pylint: disable=unused-import
from app.db.database import SessionLocal
from app.models.users import User
from app.models.trucks import Truck
from app.core.security import get_password_hash


def seed_database():
    db = SessionLocal()
    try:
        print("Iniciando carga de datos iniciales...")

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
            print("Administrador creado.")

        # --- 2. Crear Dueño (Owner) ---
        owner = db.query(User).filter(User.username == "jeremy").first()
        if not owner:
            owner = User(
                username="jeremy",
                hashed_password=get_password_hash("jeremy123"),
                full_name="Jeremy Stalin Loor Jara",
                dni="0987654321",
                role="owner",
                is_active=True,
                created_by_id=admin.id
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
            print("Dueño (Owner) creado.")

        # --- 3. Crear Camión ---
        truck = db.query(Truck).filter(Truck.plate == "PAE-4460").first()
        if not truck:
            truck = Truck(
                plate="PAE-4460",
                brand="Hino",
                model="Dutro 2026",
                capacity_tons=6,
                owner_id=owner.id
            )
            db.add(truck)
            db.commit()
            print("Camión PAE-4460 creado.")

        print("--- Proceso de Seed finalizado con éxito ---")

    except Exception as e:  # pylint: disable=broad-except
        print(f"Error durante el seed: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
