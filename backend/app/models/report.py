from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Integer, ForeignKey, Enum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class ReportStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"


class ItemStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ManagerStaff(Base):
    __tablename__ = "manager_staff"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    manager = relationship("User", foreign_keys=[manager_id], lazy="select")
    staff = relationship("User", foreign_keys=[staff_id], lazy="select")


class AssignedTask(Base):
    __tablename__ = "assigned_tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    deadline = Column(Date)
    priority = Column(Enum(TaskPriority), default=TaskPriority.medium)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DailyReport(Base):
    __tablename__ = "daily_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    report_date = Column(Date, nullable=False)
    submitted_date = Column(Date)
    status = Column(Enum(ReportStatus), default=ReportStatus.draft)
    delay_reason = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    items = relationship("ReportItem", back_populates="report", cascade="all, delete-orphan")


class ReportItem(Base):
    __tablename__ = "report_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("daily_reports.id", ondelete="CASCADE"))
    task_id = Column(UUID(as_uuid=True), ForeignKey("assigned_tasks.id"))
    action_description = Column(Text, nullable=False)
    duration_minutes = Column(Integer)
    completion_percent = Column(Integer)
    item_status = Column(Enum(ItemStatus), default=ItemStatus.in_progress)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    report = relationship("DailyReport", back_populates="items")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    report_id = Column(UUID(as_uuid=True), ForeignKey("daily_reports.id", ondelete="CASCADE"))
    type = Column(String(50))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
