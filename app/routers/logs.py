"""
Audit logs routes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timedelta
from ..database import get_db
from ..schemas import AuditLogResponse, DashboardStats, HospitalResponse, UserResponse, DeviceResponse, PatientResponse
from ..models import AuditLog, Hospital, User, Device, Patient

router = APIRouter(prefix="/api", tags=["logs"])


@router.get("/logs", response_model=List[AuditLogResponse])
async def get_logs(
    hospital_id: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(1000, le=5000),
    db: Session = Depends(get_db)
):
    """
    Get audit logs with filters
    """
    query = db.query(AuditLog)
    
    # Apply filters
    if hospital_id and hospital_id != "all":
        query = query.filter(AuditLog.hospital_id == hospital_id)
    
    if level:
        query = query.filter(AuditLog.level == level)
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= datetime.fromisoformat(start_date))
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= datetime.fromisoformat(end_date))
    
    # Order by timestamp desc and limit
    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    
    return logs


@router.get("/stats/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard statistics
    """
    # Base query
    query = db.query(AuditLog)
    
    if hospital_id and hospital_id != "all":
        query = query.filter(AuditLog.hospital_id == hospital_id)
    
    # Total events
    total_events = query.count()
    
    # Active users (distinct)
    active_users = db.query(User).filter(User.status == "active").count()
    
    # Active devices
    active_devices = db.query(Device).filter(Device.status == "active").count()
    
    # Patients
    patient_count = db.query(Patient).filter(Patient.status == "active").count()
    
    # Security events
    security_events = query.filter(
        (AuditLog.level.in_(["ERROR", "CRITICAL"])) |
        (AuditLog.event_type.like("%SECURITY%"))
    ).count()
    
    # Events in last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    events_last_hour = query.filter(AuditLog.timestamp >= one_hour_ago).count()
    
    # System health (percentage of INFO level events)
    info_events = query.filter(AuditLog.level == "INFO").count()
    system_health = (info_events / total_events * 100) if total_events > 0 else 99.9
    
    return DashboardStats(
        total_events=total_events,
        active_users=active_users,
        active_devices=active_devices,
        patient_count=patient_count,
        security_events=security_events,
        events_per_hour=events_last_hour,
        system_health=round(system_health, 1),
        timestamp=datetime.utcnow()
    )


@router.get("/hospitals", response_model=List[HospitalResponse])
async def get_hospitals(db: Session = Depends(get_db)):
    """Get all hospitals"""
    hospitals = db.query(Hospital).filter(Hospital.status == "active").all()
    return hospitals


@router.get("/users", response_model=List[UserResponse])
async def get_users(
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all users"""
    query = db.query(User).filter(User.status == "active")
    
    if hospital_id and hospital_id != "all":
        query = query.filter(User.hospital_id == hospital_id)
    
    users = query.all()
    return users


@router.get("/devices", response_model=List[DeviceResponse])
async def get_devices(
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all devices"""
    query = db.query(Device).filter(Device.status == "active")
    
    if hospital_id and hospital_id != "all":
        query = query.filter(Device.hospital_id == hospital_id)
    
    devices = query.all()
    return devices


@router.get("/patients", response_model=List[PatientResponse])
async def get_patients(
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all patients"""
    query = db.query(Patient).filter(Patient.status == "active")
    
    if hospital_id and hospital_id != "all":
        query = query.filter(Patient.hospital_id == hospital_id)
    
    patients = query.all()
    return patients

