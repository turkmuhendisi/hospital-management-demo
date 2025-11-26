"""
User (Doctor/Staff) model
"""

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class UserRole(str, enum.Enum):
    """User roles"""
    RADIOLOGIST = "radiologist"
    CARDIOLOGIST = "cardiologist"
    NEUROLOGIST = "neurologist"
    ORTHOPEDIST = "orthopedist"
    GENERAL_PRACTITIONER = "general_practitioner"
    TECHNICIAN = "technician"
    NURSE = "nurse"
    ADMIN = "admin"
    SYSTEM = "system"


class UserStatus(str, enum.Enum):
    """User status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"


class User(Base):
    """User (Doctor/Staff) model"""
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    title = Column(String(50))  # Dr., Prof., etc.
    department = Column(String(100), index=True)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    
    # Authentication
    email = Column(String(200), unique=True, index=True)
    hashed_password = Column(String(200))
    is_active = Column(Boolean, default=True)
    
    # Hospital relationship
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False, index=True)
    hospital = relationship("Hospital", back_populates="users")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, role={self.role})>"

