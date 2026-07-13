import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.report import AssignedTask
from app.schemas.report import AssignedTaskCreate, AssignedTaskOut
from app.api.deps import get_current_user, require_manager
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=AssignedTaskOut)
def create_task(data: AssignedTaskCreate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    task = AssignedTask(manager_id=current_user.id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    logger.info("Task created: %s by %s", task.title, current_user.username)
    return task


@router.get("/my-assigned", response_model=List[AssignedTaskOut])
def get_my_assigned_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AssignedTask).filter(AssignedTask.staff_id == current_user.id).all()
