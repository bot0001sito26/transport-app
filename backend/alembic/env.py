import app.models.users
import app.models.trucks
import app.models.tracking
import app.models.owner_notes
import app.models.finances
import app.models.travels
from app.db.database import Base
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# --- 1. CONFIGURACIÓN DE RUTAS ---
# Esto DEBE ir antes de importar cualquier cosa de 'app'
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# --- 2. IMPORTACIÓN DE METADATA Y MODELOS ---


# Importamos los módulos completos.
# Esto registra las tablas en Base.metadata sin disparar la alerta de "Unused import".

# --- 3. CONFIGURACIÓN DE ALEMBIC ---
# El comentario "# type: ignore" apaga las falsas alarmas de tu analizador de tipos
config = context.config  # type: ignore

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Asignación de la metadata estandarizada
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(  # type: ignore
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():  # type: ignore
        context.run_migrations()  # type: ignore


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(  # type: ignore
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():  # type: ignore
            context.run_migrations()  # type: ignore


if context.is_offline_mode():  # type: ignore
    run_migrations_offline()
else:
    run_migrations_online()
