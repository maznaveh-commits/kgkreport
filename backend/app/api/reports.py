import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.core.database import get_db
from app.models.report import DailyReport, ReportItem, AssignedTask, ManagerStaff, Notification
from app.models.user import User
from app.schemas.report import ReportCreate, ReportOut, AssignedTaskCreate, AssignedTaskOut
from app.api.deps import get_current_user, require_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


def get_report_with_items(db, report_id):
    return (
        db.query(DailyReport)
        .options(joinedload(DailyReport.items))
        .filter(DailyReport.id == report_id)
        .first()
    )


@router.post("/", response_model=ReportOut)
def create_report(data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(DailyReport).filter_by(
        staff_id=current_user.id,
        manager_id=data.manager_id,
        report_date=data.report_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="گزارش این تاریخ قبلاً ثبت شده")
    report = DailyReport(
        staff_id=current_user.id,
        manager_id=data.manager_id,
        report_date=data.report_date,
        submitted_date=date.today(),
        status="draft",
        delay_reason=data.delay_reason
    )
    db.add(report)
    db.flush()
    for item in data.items:
        db.add(ReportItem(report_id=report.id, **item.model_dump()))
    db.commit()
    return get_report_with_items(db, report.id)


@router.put("/{report_id}", response_model=ReportOut)
def update_report(report_id: UUID, data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(DailyReport).filter(DailyReport.id == report_id, DailyReport.staff_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="گزارش یافت نشد")
    if report.status == "approved":
        raise HTTPException(status_code=403, detail="گزارش تایید شده قابل ویرایش نیست")
    report.delay_reason = data.delay_reason

    existing_items = {str(item.id): item for item in report.items}
    submitted_item_ids = {item.id for item in data.items if item.id is not None}

    for item_id in existing_items:
        if UUID(item_id) not in submitted_item_ids:
            db.delete(existing_items[item_id])

    for item_data in data.items:
        if item_data.id and str(item_data.id) in existing_items:
            item = existing_items[str(item_data.id)]
            for field, value in item_data.model_dump(exclude={"id"}).items():
                setattr(item, field, value)
        else:
            db.add(ReportItem(report_id=report.id, **item_data.model_dump(exclude={"id"})))

    db.commit()
    return get_report_with_items(db, report.id)


@router.patch("/{report_id}/submit")
def submit_report(report_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(DailyReport).filter(
        DailyReport.id == report_id,
        DailyReport.staff_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="گزارش یافت نشد")
    if report.status == "approved":
        raise HTTPException(status_code=403, detail="گزارش تایید شده است")
    report.status = "submitted"
    notif = Notification(
        user_id=report.manager_id,
        report_id=report.id,
        type="report_submitted",
        message=f"گزارش {current_user.full_name} برای تایید ارسال شد"
    )
    db.add(notif)
    db.commit()
    logger.info("Report submitted: %s by %s", report_id, current_user.username)
    return {"message": "گزارش ارسال شد"}


@router.patch("/{report_id}/revert")
def revert_to_draft(report_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(DailyReport).filter(
        DailyReport.id == report_id,
        DailyReport.staff_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="گزارش یافت نشد")
    if report.status == "approved":
        raise HTTPException(status_code=403, detail="گزارش تایید شده قابل بازگشت نیست")
    report.status = "draft"
    db.commit()
    return {"message": "گزارش به پیش‌نویس برگشت"}


@router.get("/my", response_model=List[ReportOut])
def get_my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(DailyReport)
        .options(selectinload(DailyReport.items))
        .filter(DailyReport.staff_id == current_user.id)
        .order_by(DailyReport.report_date.desc())
        .all()
    )


@router.get("/pending-items")
def get_pending_items(manager_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = (
        db.query(DailyReport)
        .options(selectinload(DailyReport.items))
        .filter(
            DailyReport.staff_id == current_user.id,
            DailyReport.manager_id == manager_id
        )
        .all()
    )
    pending = []
    seen = set()
    for r in reports:
        for item in r.items:
            if (item.completion_percent is None or item.completion_percent < 100) and item.action_description not in seen:
                seen.add(item.action_description)
                pending.append({
                    "id": str(item.id),
                    "action_description": item.action_description,
                    "completion_percent": item.completion_percent or 0,
                    "duration_minutes": item.duration_minutes or 0,
                    "task_id": str(item.task_id) if item.task_id else None,
                    "report_date": str(r.report_date),
                })
    return pending


@router.get("/team/staff-list")
def get_staff_with_status(
    report_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    check_date = report_date or date.today()
    relations = (
        db.query(ManagerStaff)
        .options(joinedload(ManagerStaff.staff))
        .filter(ManagerStaff.manager_id == current_user.id)
        .all()
    )
    staff_ids = [rel.staff_id for rel in relations]
    if not staff_ids:
        return []

    reports = (
        db.query(DailyReport)
        .filter(
            DailyReport.staff_id.in_(staff_ids),
            DailyReport.manager_id == current_user.id,
            DailyReport.report_date == check_date
        )
        .all()
    )
    report_map = {str(r.staff_id): r for r in reports}

    result = []
    for rel in relations:
        staff = rel.staff
        if not staff:
            continue
        report = report_map.get(str(staff.id))
        result.append({
            "id": str(staff.id),
            "full_name": staff.full_name,
            "username": staff.username,
            "report_status": report.status if report else None,
            "report_id": str(report.id) if report else None,
            "report_date": str(check_date),
        })
    return result


@router.get("/team/staff/{staff_id}", response_model=List[ReportOut])
def get_staff_reports(
    staff_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    rel = db.query(ManagerStaff).filter_by(manager_id=current_user.id, staff_id=staff_id).first()
    if not rel:
        raise HTTPException(status_code=403, detail="این پرسنل زیر نظر شما نیست")
    return (
        db.query(DailyReport)
        .options(selectinload(DailyReport.items))
        .filter(
            DailyReport.staff_id == staff_id,
            DailyReport.manager_id == current_user.id
        )
        .order_by(DailyReport.report_date.desc())
        .all()
    )


@router.patch("/{report_id}/approve")
def approve_report(report_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="گزارش یافت نشد")
    if report.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="این گزارش متعلق به واحد شما نیست")
    if report.status != "submitted":
        raise HTTPException(status_code=400, detail="فقط گزارش‌های ارسال‌شده قابل تایید هستند")
    report.status = "approved"
    notif = Notification(
        user_id=report.staff_id,
        report_id=report.id,
        type="report_approved",
        message=f"گزارش شما توسط مدیر تایید شد"
    )
    db.add(notif)
    db.commit()
    logger.info("Report approved: %s by %s", report_id, current_user.username)
    return {"message": "گزارش تایید شد"}


@router.get("/team", response_model=List[ReportOut])
def get_team_reports(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    staff_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    staff_relations = db.query(ManagerStaff).filter(ManagerStaff.manager_id == current_user.id).all()
    staff_ids = [r.staff_id for r in staff_relations]
    query = (
        db.query(DailyReport)
        .options(selectinload(DailyReport.items))
        .filter(
            DailyReport.manager_id == current_user.id,
            DailyReport.staff_id.in_(staff_ids)
        )
    )
    if from_date:
        query = query.filter(DailyReport.report_date >= from_date)
    if to_date:
        query = query.filter(DailyReport.report_date <= to_date)
    if staff_id:
        query = query.filter(DailyReport.staff_id == staff_id)
    if status:
        query = query.filter(DailyReport.status == status)
    return query.order_by(DailyReport.report_date.desc()).all()
