import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api import auth, users, reports, tasks, notifications, company, profile, departments
from app.core.config import settings
from app.core.database import SessionLocal

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_TITLE, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(reports.router)
app.include_router(tasks.router)
app.include_router(notifications.router)
app.include_router(company.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {"status": "ok", "message": settings.APP_TITLE}


@app.get("/health")
def health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error("Health check failed: %s", e)
        return {"status": "unhealthy", "database": "disconnected"}


@app.get("/config")
def get_config():
    return {
        "company_name": settings.COMPANY_NAME,
        "app_title": settings.APP_TITLE,
    }
