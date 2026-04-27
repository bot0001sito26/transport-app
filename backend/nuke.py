from app.db.database import engine
from sqlalchemy import text


def kill_alembic_ghost():
    try:
        with engine.connect() as conn:
            # Borramos la tabla que confunde a Alembic
            conn.execute(text("DROP TABLE IF EXISTS alembic_version;"))
            conn.commit()
            print("Tabla alembic_version destruida con éxito.")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    kill_alembic_ghost()
