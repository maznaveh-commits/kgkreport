import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.department import Department
from app.models.report import ManagerStaff
from app.schemas.user import UserCreate, UserOut
from app.api.deps import require_superadmin, get_current_user
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    is_system_admin: Optional[bool] = None
    new_password: Optional[str] = None


class UserOutFull(BaseModel):
    id: UUID
    full_name: str
    username: str
    role: str
    department_id: Optional[UUID]
    department_name: Optional[str]
    is_active: bool
    is_system_admin: bool
    model_config = {"from_attributes": True}


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserOutFull])
def get_users(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    users = db.query(User).options(joinedload(User.department)).all()
    result = []
    for u in users:
        result.append(UserOutFull(
            id=u.id, full_name=u.full_name, username=u.username,
            role=u.role, department_id=u.department_id,
            department_name=u.department.name if u.department else None,
            is_active=u.is_active,
            is_system_admin=u.is_system_admin or False
        ))
    return result


@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="نام کاربری قبلاً ثبت شده")
    user = User(
        full_name=data.full_name,
        username=data.username,
        password_hash=get_password_hash(data.password),
        role=data.role,
        department_id=data.department_id,
        is_system_admin=data.is_system_admin or False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User created: %s by admin", data.username)
    return user


@router.patch("/{user_id}")
def update_user(user_id: UUID, data: UserUpdate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if data.full_name:
        user.full_name = data.full_name
    if data.role:
        user.role = data.role
    if data.department_id is not None:
        user.department_id = data.department_id
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_system_admin is not None:
        user.is_system_admin = data.is_system_admin
    if data.new_password:
        user.password_hash = get_password_hash(data.new_password)
    db.commit()
    logger.info("User updated: %s", user.username)
    return {"message": "کاربر بروزرسانی شد"}


@router.delete("/{user_id}")
def delete_user(user_id: UUID, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    username = user.username
    db.delete(user)
    db.commit()
    logger.info("User deleted: %s", username)
    return {"message": "کاربر حذف شد"}


@router.post("/{manager_id}/staff/{staff_id}")
def assign_staff(manager_id: UUID, staff_id: UUID, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    manager = db.query(User).filter(User.id == manager_id).first()
    member = db.query(User).filter(User.id == staff_id).first()
    if not manager or not member:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    if manager.role == "company_manager" and member.role != "manager":
        raise HTTPException(status_code=400, detail="زیر مدیر شرکت فقط می‌تواند مدیر واحد زیر خود داشته باشد")

    if manager.role == "manager" and member.role != "staff":
        raise HTTPException(status_code=400, detail="زیر مدیر واحد فقط می‌تواند پرسنل زیر خود داشته باشد")

    if db.query(ManagerStaff).filter_by(manager_id=manager_id, staff_id=staff_id).first():
        raise HTTPException(status_code=400, detail="این رابطه قبلاً تعریف شده")

    rel = ManagerStaff(manager_id=manager_id, staff_id=staff_id)
    db.add(rel)
    db.commit()
    logger.info("Staff assigned: manager=%s, staff=%s", manager_id, staff_id)
    return {"message": "رابطه با موفقیت تعریف شد"}


@router.get("/relations")
def get_relations(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    relations = (
        db.query(ManagerStaff)
        .options(
            joinedload(ManagerStaff.manager),
            joinedload(ManagerStaff.staff),
        )
        .all()
    )
    result = []
    for r in relations:
        if r.manager and r.staff:
            result.append({
                "manager_id": r.manager_id,
                "staff_id": r.staff_id,
                "manager_name": r.manager.full_name,
                "manager_role": r.manager.role,
                "staff_name": r.staff.full_name,
                "staff_role": r.staff.role,
            })
    return result


@router.delete("/{manager_id}/staff/{staff_id}")
def remove_staff(manager_id: UUID, staff_id: UUID, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    rel = db.query(ManagerStaff).filter_by(manager_id=manager_id, staff_id=staff_id).first()
    if not rel:
        raise HTTPException(status_code=404, detail="رابطه یافت نشد")
    db.delete(rel)
    db.commit()
    return {"message": "رابطه حذف شد"}


@router.get("/my-managers", response_model=List[UserOut])
def get_my_managers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    relations = db.query(ManagerStaff).filter(ManagerStaff.staff_id == current_user.id).all()
    manager_ids = [r.manager_id for r in relations]
    return db.query(User).filter(User.id.in_(manager_ids)).all()
