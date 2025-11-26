"""
Data seeder for initial data and background generation
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from typing import List

from .models import Hospital, User, Device, Patient, AuditLog
from .generators import (
    PatientGenerator, 
    DoctorGenerator, 
    EventGenerator,
    TimePatterns,
    WorkflowPatterns
)
from .config import settings
from .utils.logging import get_logger
from .database import SessionLocal

logger = get_logger(__name__)


# Turkish hospitals - Single hospital configuration
HOSPITALS = [
    {
        "id": "hospital-1",
        "name": "Ankara Şehir Hastanesi",
        "location": "Bilkent",
        "city": "Ankara",
        "type": "public",
        "status": "active"
    },
]


# Device types with clinic assignments - (name, type, ip_prefix, clinic)
DEVICE_TYPES = [
    # Radyoloji Bölümü Cihazları
    ("PACS İş İstasyonu", "WORKSTATION", "192.168.1.", "Radyoloji Bölümü"),
    ("BT Tarayıcı", "CT_SCANNER", "192.168.2.", "Radyoloji Bölümü"),
    ("MR Cihazı", "MRI_SCANNER", "192.168.2.", "Radyoloji Bölümü"),
    ("Dijital Röntgen", "XRAY", "192.168.3.", "Radyoloji Bölümü"),
    ("Ultrason Cihazı", "ULTRASOUND", "192.168.3.", "Radyoloji Bölümü"),
    ("PACS Sunucusu", "PACS_SERVER", "192.168.1.", "Radyoloji Bölümü"),
    
    # Kardiyoloji Polikliniği
    ("EKG Cihazı", "PATIENT_MONITOR", "192.168.5.", "Kardiyoloji Polikliniği"),
    ("Hasta Monitörü", "VITAL_MONITOR", "192.168.5.", "Kardiyoloji Polikliniği"),
    
    # Kadın Doğum
    ("NST Cihazı", "NST_DEVICE", "192.168.4.", "Kadın Doğum"),
    ("Fetal Monitör", "PATIENT_MONITOR", "192.168.5.", "Kadın Doğum"),
    
    # Yoğun Bakım
    ("Yoğun Bakım Monitörü", "PATIENT_MONITOR", "192.168.5.", "Yoğun Bakım Ünitesi"),
    ("Ventilatör Cihazı", "VENTILATOR", "192.168.5.", "Yoğun Bakım Ünitesi"),
    ("Vital Signs Monitör", "VITAL_MONITOR", "192.168.5.", "Yoğun Bakım Ünitesi"),
    
    # Acil Servis
    ("Acil Hasta Monitörü", "PATIENT_MONITOR", "192.168.5.", "Acil Servis"),
    ("Acil Röntgen", "XRAY", "192.168.3.", "Acil Servis"),
    
    # Dahiliye
    ("Dahiliye İş İstasyonu", "WORKSTATION", "192.168.1.", "Dahiliye Polikliniği"),
    
    # Nöroloji
    ("Nöroloji İş İstasyonu", "WORKSTATION", "192.168.1.", "Nöroloji Polikliniği"),
]


def seed_hospitals(db: Session):
    """Seed hospitals"""
    logger.info("Seeding hospitals...")
    
    for hospital_data in HOSPITALS:
        existing = db.query(Hospital).filter(Hospital.id == hospital_data["id"]).first()
        if not existing:
            hospital = Hospital(**hospital_data)
            db.add(hospital)
    
    db.commit()
    logger.info(f"Seeded {len(HOSPITALS)} hospitals")


def seed_users(db: Session):
    """Seed users (doctors and staff)"""
    logger.info("Seeding users...")
    
    total_users = 0
    for hospital_data in HOSPITALS:
        hospital_id = hospital_data["id"]
        
        # Generate doctors and staff
        staff_list = DoctorGenerator.generate_hospital_staff(
            hospital_id=hospital_id,
            doctor_count=15,  # 15 doctors per hospital
            staff_count=10     # 10 staff per hospital
        )
        
        for staff_data in staff_list:
            existing = db.query(User).filter(User.id == staff_data["id"]).first()
            if not existing:
                user = User(**staff_data)
                db.add(user)
                total_users += 1
    
    db.commit()
    logger.info(f"Seeded {total_users} users")


def seed_devices(db: Session):
    """Seed devices with clinic assignments"""
    logger.info("Seeding devices...")
    
    total_devices = 0
    for hospital_data in HOSPITALS:
        hospital_id = hospital_data["id"]
        hospital_code = hospital_id.split('-')[1]
        
        for idx, (name, device_type, ip_prefix, clinic) in enumerate(DEVICE_TYPES):
            device_id = f"device-{hospital_code}-{device_type.lower()}-{idx+1}"
            
            existing = db.query(Device).filter(Device.id == device_id).first()
            if not existing:
                device = Device(
                    id=device_id,
                    name=f"{name}-{idx+1:02d}",
                    type=device_type,
                    hospital_id=hospital_id,
                    ip_address=f"{ip_prefix}{random.randint(100, 199)}",
                    status="active",
                    last_seen=datetime.utcnow(),
                    device_metadata={"clinic": clinic}  # Store clinic in device_metadata
                )
                db.add(device)
                total_devices += 1
    
    db.commit()
    logger.info(f"Seeded {total_devices} devices with clinic assignments")


def seed_patients(db: Session):
    """Seed patients"""
    logger.info("Seeding patients...")
    
    total_patients = 0
    for hospital_data in HOSPITALS:
        hospital_id = hospital_data["id"]
        
        # Generate 50 patients per hospital
        patients = PatientGenerator.generate_batch(50, hospital_id)
        
        for patient_data in patients:
            existing = db.query(Patient).filter(Patient.id == patient_data["id"]).first()
            if not existing:
                patient = Patient(**patient_data)
                db.add(patient)
                total_patients += 1
    
    db.commit()
    logger.info(f"Seeded {total_patients} patients")


def seed_historical_logs(db: Session, days: int = 7):
    """Seed historical audit logs"""
    logger.info(f"Generating {days} days of historical logs...")
    
    # Get all entities
    hospitals = db.query(Hospital).all()
    users = db.query(User).all()
    devices = db.query(Device).all()
    patients = db.query(Patient).all()
    
    if not all([hospitals, users, devices, patients]):
        logger.warning("Missing entities for log generation")
        return
    
    # Convert to dicts for generator (include clinic from device_metadata)
    hospital_dicts = [{"id": h.id, "name": h.name} for h in hospitals]
    user_dicts = [{"id": u.id, "name": u.name} for u in users]
    device_dicts = [
        {
            "id": d.id, 
            "name": d.name, 
            "type": d.type,
            "clinic": d.device_metadata.get("clinic") if d.device_metadata else None
        } 
        for d in devices
    ]
    patient_dicts = [{"id": p.id, "name": p.name} for p in patients]
    
    total_logs = 0
    
    # Generate logs for each day
    for day in range(days):
        date_offset = timedelta(days=days - day - 1)
        base_date = datetime.utcnow() - date_offset
        
        # Generate 50-200 events per day (distributed by peak hours)
        events_per_day = random.randint(50, 200)
        
        for _ in range(events_per_day):
            # Generate random event
            event_data = EventGenerator.generate_random_event(
                users=user_dicts,
                patients=patient_dicts,
                devices=device_dicts,
                hospitals=hospital_dicts
            )
            
            # Adjust timestamp to historical date
            event_data["timestamp"] = TimePatterns.get_realistic_timestamp(base_date)
            
            # Create audit log
            log = AuditLog(**event_data)
            db.add(log)
            total_logs += 1
            
            # Commit in batches
            if total_logs % 100 == 0:
                db.commit()
                logger.info(f"Generated {total_logs} historical logs...")
    
    db.commit()
    logger.info(f"Seeded {total_logs} historical audit logs")


def seed_initial_data(db: Session):
    """Seed all initial data"""
    logger.info("Starting initial data seeding...")
    
    seed_hospitals(db)
    seed_users(db)
    seed_devices(db)
    seed_patients(db)
    seed_historical_logs(db, days=settings.HISTORICAL_DATA_DAYS if settings.HISTORICAL_DATA_DAYS < 30 else 7)
    
    logger.info("Initial data seeding completed")


# Background scheduler
scheduler = BackgroundScheduler()


def generate_realtime_event():
    """Generate a single real-time event (called by scheduler)"""
    db = SessionLocal()
    try:
        # Get entities
        hospitals = db.query(Hospital).all()
        users = db.query(User).all()
        devices = db.query(Device).all()
        patients = db.query(Patient).all()
        
        if not all([hospitals, users, devices, patients]):
            return
        
        # Convert to dicts
        hospital_dicts = [{"id": h.id, "name": h.name} for h in hospitals]
        user_dicts = [{"id": u.id, "name": u.name} for u in users]
        device_dicts = [{"id": d.id, "name": d.name, "type": d.type} for d in devices]
        patient_dicts = [{"id": p.id, "name": p.name} for p in patients]
        
        # Check if should generate based on time patterns
        if TimePatterns.should_generate_now() or random.random() > 0.5:
            # Generate event
            event_data = EventGenerator.generate_random_event(
                users=user_dicts,
                patients=patient_dicts,
                devices=device_dicts,
                hospitals=hospital_dicts
            )
            
            # Save to database
            log = AuditLog(**event_data)
            db.add(log)
            db.commit()
            
            logger.debug(f"Generated real-time event: {event_data['event_type']}")
            
            # TODO: Broadcast via WebSocket
            # await broadcast_new_log(event_data)
    
    except Exception as e:
        logger.error(f"Error generating real-time event: {e}")
    finally:
        db.close()


def start_background_generator():
    """Start background event generator"""
    logger.info("Starting background event generator...")
    
    # Add job to generate events every N seconds
    scheduler.add_job(
        generate_realtime_event,
        'interval',
        seconds=settings.DATA_GENERATION_INTERVAL,
        id='generate_events',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info(f"Background generator started (interval: {settings.DATA_GENERATION_INTERVAL}s)")

