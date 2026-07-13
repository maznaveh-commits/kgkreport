import logging
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

logger = logging.getLogger(__name__)

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(credentials.credentials)
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="کاربر معتبر نیست")
        return user
    except HTTPException:
        raise
    except Exception:
        logger.warning("Invalid token attempt")
        raise HTTPException(status_code=401, detail="توکن نامعتبر است")


def require_superadmin(current_user: User = Depends(get_current_user)):
    if not current_user.is_system_admin and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="دسترسی فقط برای ادمین سیستم")
    return current_user


def require_manager(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["superadmin", "company_manager", "manager"]:
        raise HTTPException(status_code=403, detail="دسترسی فقط برای مدیران")
    return current_user


def require_company_manager(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["superadmin", "company_manager"] and not current_user.is_system_admin:
        raise HTTPException(status_code=403, detail="دسترسی فقط برای مدیر شرکت")
    return current_user
