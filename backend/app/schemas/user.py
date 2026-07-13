from pydantic import BaseModel
from enum import Enum
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserRole(str, Enum):
    superadmin = "superadmin"
    company_manager = "company_manager"
    manager = "manager"
    staff = "staff"

class UserCreate(BaseModel):
    full_name: str
    username: str
    password: str
    role: UserRole
    department_id: Optional[UUID] = None
    is_system_admin: bool = False

class UserOut(BaseModel):
    id: UUID
    full_name: str
    username: str
    role: UserRole
    is_active: bool
    is_system_admin: bool
    department_id: Optional[UUID] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    username: str
    password: str
