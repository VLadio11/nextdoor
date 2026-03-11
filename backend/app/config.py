from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://nextdoor:nextdoor@localhost:5432/nextdoor"

    # Nextdoor API
    nextdoor_api_key: str = ""
    nextdoor_api_secret: str = ""

    # Simulation mode — use when official API approval is pending
    sim_mode: bool = True

    # SMTP Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Nextdoor Monitor <alerts@yourdomain.com>"
    smtp_use_tls: bool = True

    # Polling
    poll_interval_seconds: int = 300
    nextdoor_requests_per_minute: int = 10

    # App
    environment: str = "development"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


settings = Settings()
