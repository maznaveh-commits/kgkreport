import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.ratelimit import login_limiter
from app.models.user import User
from app.schemas.user import Token, LoginRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    login_limiter.check(request)
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        logger.warning("Failed login attempt for username: %s", data.username)
        raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است")
    if not user.is_active:
        logger.warning("Login attempt for inactive user: %s", data.username)
        raise HTTPException(status_code=403, detail="حساب کاربری غیرفعال است")
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "is_system_admin": user.is_system_admin
    })
    logger.info("User logged in: %s", data.username)
    return {"access_token": token, "token_type": "bearer", "user": user}
