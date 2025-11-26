"""
Patient model
"""

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class Gender(str, enum.Enum):
    """Gender"""
    MALE = "M"
    FEMALE = "F"
    OTHER = "O"
    UNKNOWN = "U"


class PatientStatus(str, enum.Enum):
    """Patient status"""
    ACTIVE = "active"
    DISCHARGED = "discharged"
    DECEASED = "deceased"
    TRANSFERRED = "transferred"


class Patient(Base):
    """Patient model"""
    __tablename__ = "patients"
    
    id = Column(String(50), primary_key=True, index=True)  # Patient ID
    tc_no = Column(String(11), unique=True)  # Turkish ID number
    name = Column(String(200), nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    birth_date = Column(Date)
    status = Column(Enum(PatientStatus), default=PatientStatus.ACTIVE)
    
    # Contact info
    phone = Column(String(20))
    email = Column(String(200))
    address = Column(String(500))
    
    # Hospital relationship
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False, index=True)
    hospital = relationship("Hospital", back_populates="patients")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient(id={self.id}, name={self.name})>"

