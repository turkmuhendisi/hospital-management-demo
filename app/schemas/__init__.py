"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


# Base schemas
class HospitalBase(BaseModel):
    name: str
    location: Optional[str] = None
    city: Optional[str] = None
    type: Optional[str] = "public"
    status: Optional[str] = "active"


class HospitalResponse(HospitalBase):
    id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    name: str
    title: Optional[str] = None
    department: Optional[str] = None
    role: str
    email: Optional[str] = None


class UserResponse(UserBase):
    id: str
    hospital_id: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PatientBase(BaseModel):
    name: str
    gender: str
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class PatientResponse(PatientBase):
    id: str
    hospital_id: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DeviceBase(BaseModel):
    name: str
    type: str
    ip_address: Optional[str] = None
    status: Optional[str] = "active"
    device_metadata: Optional[dict] = None


class DeviceResponse(DeviceBase):
    id: str
    hospital_id: str
    created_at: datetime
    last_seen: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    level: str
    event_type: str
    message: str
    user_id: Optional[str] = None
    device_id: Optional[str] = None
    patient_id: Optional[str] = None
    hospital_id: str
    source_ip: Optional[str] = None
    details: Optional[dict] = None
    
    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    total_events: int
    active_users: int
    active_devices: int
    patient_count: int
    security_events: int
    events_per_hour: int
    system_health: float
    timestamp: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str

