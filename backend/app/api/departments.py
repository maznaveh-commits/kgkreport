import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.models.department import Department
from app.api.deps import require_superadmin, get_current_user
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Department).order_by(Department.name).all()


@router.post("/", response_model=DepartmentOut)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    if db.query(Department).filter(Department.name == data.name).first():
        raise HTTPException(status_code=400, detail="این واحد قبلاً تعریف شده")
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    logger.info("Department created: %s", data.name)
    return dept


@router.patch("/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: UUID, data: DepartmentUpdate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="واحد یافت نشد")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    logger.info("Department updated: %s", dept.name)
    return dept


@router.delete("/{dept_id}")
def delete_department(dept_id: UUID, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="واحد یافت نشد")
    name = dept.name
    db.delete(dept)
    db.commit()
    logger.info("Department deleted: %s", name)
    return {"message": "واحد حذف شد"}
