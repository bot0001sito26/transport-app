from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Transport API"

    # Seguridad (Estas deben estar en tu .env)
    SECRET_KEY: str = "CAMBIAME_POR_ALGO_MUY_SECRETO_123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días

    DATABASE_URL: str

    # --- AÑADE ESTA LÍNEA ---
    TELEGRAM_BOT_TOKEN: str = ""

    # Esto es lo que hace que lea el archivo .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # <-- CAMBIA 'forbid' por 'ignore' o simplemente añade la variable arriba
    )


settings = Settings()
