from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from enum import Enum

class ReportStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"

class ItemStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class ReportItemCreate(BaseModel):
    task_id: Optional[UUID] = None
    action_description: str
    duration_minutes: Optional[int] = None
    completion_percent: Optional[int] = None
    item_status: ItemStatus = ItemStatus.in_progress

class ReportItemOut(BaseModel):
    id: UUID
    task_id: Optional[UUID]
    action_description: str
    duration_minutes: Optional[int]
    completion_percent: Optional[int]
    item_status: ItemStatus
    model_config = {"from_attributes": True}

class ReportCreate(BaseModel):
    manager_id: UUID
    report_date: date
    delay_reason: Optional[str] = None
    items: List[ReportItemCreate]

class ReportOut(BaseModel):
    id: UUID
    staff_id: UUID
    manager_id: UUID
    report_date: date
    submitted_date: Optional[date]
    status: ReportStatus
    delay_reason: Optional[str]
    created_at: datetime
    items: List[ReportItemOut] = []
    model_config = {"from_attributes": True}

class AssignedTaskCreate(BaseModel):
    staff_id: UUID
    project_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    priority: TaskPriority = TaskPriority.medium

class AssignedTaskOut(BaseModel):
    id: UUID
    manager_id: UUID
    staff_id: UUID
    project_id: Optional[UUID]
    title: str
    description: Optional[str]
    deadline: Optional[date]
    priority: TaskPriority
    created_at: datetime
    model_config = {"from_attributes": True}
