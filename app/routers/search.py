"""
Search routes for doctors, devices, patients
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import UserResponse, DeviceResponse, PatientResponse
from ..models import User, Device, Patient

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/doctors", response_model=List[UserResponse])
async def search_doctors(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Search doctors by name or department
    """
    doctors = db.query(User).filter(
        (User.name.ilike(f"%{q}%")) |
        (User.department.ilike(f"%{q}%"))
    ).filter(
        User.status == "active"
    ).limit(20).all()
    
    return doctors


@router.get("/devices", response_model=List[DeviceResponse])
async def search_devices(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Search devices by name or IP address
    """
    devices = db.query(Device).filter(
        (Device.name.ilike(f"%{q}%")) |
        (Device.ip_address.ilike(f"%{q}%"))
    ).filter(
        Device.status == "active"
    ).limit(20).all()
    
    return devices


@router.get("/patients", response_model=List[PatientResponse])
async def search_patients(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Search patients by ID or name
    """
    patients = db.query(Patient).filter(
        (Patient.id.ilike(f"%{q}%")) |
        (Patient.name.ilike(f"%{q}%"))
    ).filter(
        Patient.status == "active"
    ).limit(20).all()
    
    return patients

