"""
Hospital model
"""

from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class HospitalType(str, enum.Enum):
    """Hospital types"""
    PUBLIC = "public"
    UNIVERSITY = "university"
    PRIVATE = "private"
    RESEARCH = "research"


class HospitalStatus(str, enum.Enum):
    """Hospital status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class Hospital(Base):
    """Hospital model"""
    __tablename__ = "hospitals"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    location = Column(String(100))
    city = Column(String(50), index=True)
    type = Column(Enum(HospitalType), default=HospitalType.PUBLIC)
    status = Column(Enum(HospitalStatus), default=HospitalStatus.ACTIVE)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="hospital")
    devices = relationship("Device", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")
    audit_logs = relationship("AuditLog", back_populates="hospital")
    
    def __repr__(self):
        return f"<Hospital(id={self.id}, name={self.name})>"

