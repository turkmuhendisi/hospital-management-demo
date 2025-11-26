"""
Audit Log model
"""

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class LogLevel(str, enum.Enum):
    """Log levels"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    DEBUG = "DEBUG"


class EventType(str, enum.Enum):
    """Event types"""
    # User events
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_FAILED_LOGIN = "USER_FAILED_LOGIN"
    
    # Patient events
    PATIENT_ADMISSION = "PATIENT_ADMISSION"
    PATIENT_REGISTRATION = "PATIENT_REGISTRATION"
    PATIENT_DISCHARGE = "PATIENT_DISCHARGE"
    PATIENT_ACCESS = "PATIENT_ACCESS"
    PATIENT_DATA_VIEWED = "PATIENT_DATA_VIEWED"
    PATIENT_DATA_MODIFIED = "PATIENT_DATA_MODIFIED"
    
    # Imaging events
    IMAGING_ORDERED = "IMAGING_ORDERED"
    IMAGING_STARTED = "IMAGING_STARTED"
    IMAGING_COMPLETED = "IMAGING_COMPLETED"
    IMAGE_TRANSFERRED = "IMAGE_TRANSFERRED"
    STUDY_VIEWED = "STUDY_VIEWED"
    
    # Report events
    REPORT_ASSIGNED = "REPORT_ASSIGNED"
    REPORT_IN_PROGRESS = "REPORT_IN_PROGRESS"
    REPORT_COMPLETED = "REPORT_COMPLETED"
    REPORT_APPROVED = "REPORT_APPROVED"
    REPORT_REJECTED = "REPORT_REJECTED"
    
    # Device events
    DEVICE_CONNECTED = "DEVICE_CONNECTED"
    DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED"
    DEVICE_OPERATION = "DEVICE_OPERATION"
    DEVICE_ERROR = "DEVICE_ERROR"
    DEVICE_MAINTENANCE = "DEVICE_MAINTENANCE"
    
    # Security events
    ACCESS_DENIED = "ACCESS_DENIED"
    SECURITY_ALERT = "SECURITY_ALERT"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    
    # System events
    SYSTEM_STARTUP = "SYSTEM_STARTUP"
    SYSTEM_SHUTDOWN = "SYSTEM_SHUTDOWN"
    BACKUP_COMPLETED = "BACKUP_COMPLETED"
    DATABASE_QUERY = "DATABASE_QUERY"
    FILE_UPLOAD = "FILE_UPLOAD"
    FILE_DOWNLOAD = "FILE_DOWNLOAD"
    PERFORMANCE_ALERT = "PERFORMANCE_ALERT"
    NETWORK_ERROR = "NETWORK_ERROR"


class AuditLog(Base):
    """Audit log model"""
    __tablename__ = "audit_logs"
    
    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    level = Column(Enum(LogLevel), nullable=False, index=True)
    event_type = Column(Enum(EventType), nullable=False, index=True)
    message = Column(Text, nullable=False)
    
    # Relationships
    user_id = Column(String(50), ForeignKey("users.id"), index=True)
    user = relationship("User", back_populates="audit_logs")
    
    device_id = Column(String(50), ForeignKey("devices.id"), index=True)
    device = relationship("Device", back_populates="audit_logs")
    
    patient_id = Column(String(50), ForeignKey("patients.id"), index=True)
    patient = relationship("Patient", back_populates="audit_logs")
    
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False, index=True)
    hospital = relationship("Hospital", back_populates="audit_logs")
    
    # Network info
    source_ip = Column(String(50), index=True)
    user_agent = Column(String(500))
    
    # Additional details (JSON)
    details = Column(JSON)
    
    # Media references
    hl7_message_path = Column(String(500))
    dicom_path = Column(String(500))
    pdf_path = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, event_type={self.event_type}, timestamp={self.timestamp})>"

