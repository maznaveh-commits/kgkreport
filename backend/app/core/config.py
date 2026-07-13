import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://kgkadmin:KgkReport%402024@localhost:5432/kgkreport"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    COMPANY_NAME: str = "کاجیکا"
    APP_TITLE: str = "سیستم گزارش کار روزانه کاجیکا"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:80"

    class Config:
        env_file = "/home/reportadmin/kgk-report/backend/.env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
