import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.api.deps import get_current_user
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.get("/")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


@router.patch("/")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.full_name:
        current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    logger.info("Profile updated: %s", current_user.username)
    return {"message": "پروفایل بروزرسانی شد", "full_name": current_user.full_name}


@router.patch("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="رمز عبور فعلی اشتباه است")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="رمز عبور جدید باید حداقل ۶ کاراکتر باشد")
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    logger.info("Password changed: %s", current_user.username)
    return {"message": "رمز عبور با موفقیت تغییر کرد"}
