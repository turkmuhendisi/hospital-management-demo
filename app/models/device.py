"""
Device (Modality) model
"""

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class DeviceType(str, enum.Enum):
    """Device types"""
    WORKSTATION = "workstation"
    CT_SCANNER = "ct_scanner"
    MRI_SCANNER = "mri_scanner"
    XRAY = "xray"
    ULTRASOUND = "ultrasound"
    PACS_SERVER = "pacs_server"
    NST_DEVICE = "nst_device"
    PATIENT_MONITOR = "patient_monitor"
    VENTILATOR = "ventilator"
    VITAL_MONITOR = "vital_monitor"
    OTHER = "other"


class DeviceStatus(str, enum.Enum):
    """Device status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    ERROR = "error"
    OFFLINE = "offline"


class Device(Base):
    """Device (Modality) model"""
    __tablename__ = "devices"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    type = Column(Enum(DeviceType), nullable=False, index=True)
    status = Column(Enum(DeviceStatus), default=DeviceStatus.ACTIVE)
    
    # Network info
    ip_address = Column(String(50), index=True)
    mac_address = Column(String(50))
    ae_title = Column(String(50))  # DICOM AE Title
    port = Column(Integer)
    
    # Hospital relationship
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False, index=True)
    hospital = relationship("Hospital", back_populates="devices")
    
    # Metadata
    manufacturer = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100))
    device_metadata = Column(JSON, nullable=True)  # Store additional metadata like clinic
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen = Column(DateTime)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="device")
    
    def __repr__(self):
        return f"<Device(id={self.id}, name={self.name}, type={self.type})>"

