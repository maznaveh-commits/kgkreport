import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.core.database import get_db
from app.models.report import DailyReport, ReportItem, ManagerStaff
from app.models.user import User
from app.api.deps import require_company_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/company", tags=["company"])


@router.get("/managers")
def get_all_managers(db: Session = Depends(get_db), _=Depends(require_company_manager)):
    users = db.query(User).filter(User.role == "manager", User.is_active == True).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "username": u.username,
            "role": u.role,
            "department_id": u.department_id,
            "is_active": u.is_active,
            "is_system_admin": u.is_system_admin,
        }
        for u in users
    ]


@router.get("/unified-report")
def get_unified_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    manager_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_company_manager)
):
    managers_query = db.query(User).filter(User.role == "manager", User.is_active == True)
    if manager_id:
        managers_query = managers_query.filter(User.id == manager_id)
    managers = managers_query.all()
    manager_ids = [m.id for m in managers]
    manager_map = {str(m.id): m for m in managers}

    if not manager_ids:
        return []

    all_staff_relations = (
        db.query(ManagerStaff)
        .filter(ManagerStaff.manager_id.in_(manager_ids))
        .all()
    )

    staff_ids = [r.staff_id for r in all_staff_relations]
    staff_map = {}
    if staff_ids:
        staff_users = db.query(User).filter(User.id.in_(staff_ids)).all()
        staff_map = {str(s.id): s for s in staff_users}

    all_person_ids = set(manager_ids) | set(staff_ids)

    reports_query = (
        db.query(DailyReport)
        .options(joinedload(DailyReport.items))
        .filter(DailyReport.staff_id.in_(all_person_ids))
    )
    if from_date:
        reports_query = reports_query.filter(DailyReport.report_date >= from_date)
    if to_date:
        reports_query = reports_query.filter(DailyReport.report_date <= to_date)
    if status:
        reports_query = reports_query.filter(DailyReport.status == status)

    all_reports = reports_query.all()

    staff_to_manager = {}
    for rel in all_staff_relations:
        staff_to_manager[str(rel.staff_id)] = str(rel.manager_id)

    result = []
    for report in all_reports:
        person_id = str(report.staff_id)
        is_manager = person_id in manager_map
        person = manager_map.get(person_id) or staff_map.get(person_id)
        if not person:
            continue

        mgr_id = person_id if is_manager else staff_to_manager.get(person_id)
        mgr = manager_map.get(mgr_id) if mgr_id else None

        for item in report.items:
            result.append({
                "report_date": str(report.report_date),
                "person_name": person.full_name,
                "person_role": "manager" if is_manager else "staff",
                "manager_name": mgr.full_name if mgr else "",
                "report_status": report.status,
                "action_description": item.action_description,
                "duration_minutes": item.duration_minutes or 0,
                "completion_percent": item.completion_percent or 0,
                "item_status": item.item_status,
                "delay_reason": report.delay_reason,
            })

    result.sort(key=lambda x: (x["report_date"], x["manager_name"], x["person_role"] == "staff"), reverse=True)
    return result
