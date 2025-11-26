"""
Event generator for realistic audit logs with workflow sequences
"""

from datetime import datetime, timedelta
import random
import uuid
from typing import Dict, List, Optional
from .patterns import TimePatterns, WorkflowPatterns, ErrorPatterns


class EventGenerator:
    """Generate realistic audit log events"""
    
    # Hospital structure
    FLOORS = ["Zemin Kat", "1. Kat", "2. Kat", "3. Kat", "4. Kat", "Bodrum Kat"]
    
    CLINICS = [
        "Kardiyoloji Polikliniği", "Nöroloji Polikliniği", "Radyoloji Bölümü",
        "Acil Servis", "Göğüs Hastalıkları", "Dahiliye Polikliniği",
        "Genel Cerrahi", "Ortopedi ve Travmatoloji", "Kadın Doğum",
        "Pediatri Polikliniği", "Göz Hastalıkları", "Kulak Burun Boğaz"
    ]
    
    UNITS = [
        "Yoğun Bakım Ünitesi", "Koroner Yoğun Bakım", "Ameliyathane",
        "Görüntüleme Merkezi", "Laboratuvar", "Enjeksiyon Odası",
        "Muayene Odası", "Triage", "Hasta Kabul", "Arşiv Birimi"
    ]
    
    LOCATIONS = {
        "Zemin Kat": ["Acil Servis", "Radyoloji Bölümü", "Hasta Kabul", "Laboratuvar"],
        "1. Kat": ["Kardiyoloji Polikliniği", "Dahiliye Polikliniği", "Muayene Odası"],
        "2. Kat": ["Yoğun Bakım Ünitesi", "Koroner Yoğun Bakım", "Ameliyathane"],
        "3. Kat": ["Görüntüleme Merkezi", "Nöroloji Polikliniği", "Göğüs Hastalıkları"],
        "4. Kat": ["Genel Cerrahi", "Ortopedi ve Travmatoloji", "Kadın Doğum"],
    }
    
    # Event type to log level mapping
    EVENT_LEVELS = {
        "USER_LOGIN": "INFO",
        "USER_LOGOUT": "INFO",
        "USER_FAILED_LOGIN": "WARNING",
        "PATIENT_ADMISSION": "INFO",
        "PATIENT_REGISTRATION": "INFO",
        "PATIENT_DISCHARGE": "INFO",
        "PATIENT_ACCESS": "WARNING",
        "PATIENT_DATA_VIEWED": "INFO",
        "PATIENT_DATA_MODIFIED": "WARNING",
        "IMAGING_ORDERED": "INFO",
        "IMAGING_STARTED": "INFO",
        "IMAGING_COMPLETED": "INFO",
        "IMAGE_TRANSFERRED": "INFO",
        "STUDY_VIEWED": "INFO",
        "REPORT_ASSIGNED": "INFO",
        "REPORT_IN_PROGRESS": "INFO",
        "REPORT_COMPLETED": "INFO",
        "REPORT_APPROVED": "INFO",
        "REPORT_REJECTED": "WARNING",
        "DEVICE_CONNECTED": "INFO",
        "DEVICE_DISCONNECTED": "WARNING",
        "DEVICE_OPERATION": "INFO",
        "DEVICE_ERROR": "ERROR",
        "DEVICE_MAINTENANCE": "WARNING",
        "ACCESS_DENIED": "ERROR",
        "SECURITY_ALERT": "CRITICAL",
        "UNAUTHORIZED_ACCESS": "CRITICAL",
        "SUSPICIOUS_ACTIVITY": "WARNING",
        "SYSTEM_STARTUP": "INFO",
        "SYSTEM_SHUTDOWN": "INFO",
        "BACKUP_COMPLETED": "INFO",
        "DATABASE_QUERY": "INFO",
        "FILE_UPLOAD": "INFO",
        "FILE_DOWNLOAD": "INFO",
        "PERFORMANCE_ALERT": "WARNING",
        "NETWORK_ERROR": "ERROR",
    }
    
    # Event message templates (Turkish) - clean and concise
    MESSAGE_TEMPLATES = {
        "USER_LOGIN": "{user} sisteme giriş yaptı",
        "USER_LOGOUT": "{user} sistemden çıkış yaptı",
        "USER_FAILED_LOGIN": "{user} için başarısız giriş denemesi",
        "PATIENT_ADMISSION": "{patient} hasta kabulü yapıldı",
        "PATIENT_REGISTRATION": "{patient} hasta kaydı oluşturuldu",
        "PATIENT_DISCHARGE": "{patient} taburcu edildi",
        "PATIENT_ACCESS": "{user} tarafından {patient} hasta bilgilerine erişildi",
        "PATIENT_DATA_VIEWED": "{user} tarafından {patient} verileri görüntülendi",
        "PATIENT_DATA_MODIFIED": "{user} tarafından {patient} verileri güncellendi",
        "IMAGING_ORDERED": "{patient} için {modality} tetkik istemi oluşturuldu ({body_part})",
        "IMAGING_STARTED": "{device} cihazında {patient} için görüntüleme başlatıldı",
        "IMAGING_COMPLETED": "{device} cihazında {patient} görüntüleme tamamlandı - {images} görüntü",
        "IMAGE_TRANSFERRED": "{patient} görüntüleri PACS sistemine transfer edildi",
        "STUDY_VIEWED": "{user} tarafından {patient} çalışması görüntülendi",
        "REPORT_ASSIGNED": "{patient} raporu {user} raportörüne atandı",
        "REPORT_IN_PROGRESS": "{user} tarafından {patient} raporu yazılıyor",
        "REPORT_COMPLETED": "{user} tarafından {patient} raporu tamamlandı",
        "REPORT_APPROVED": "{patient} raporu onaylandı",
        "REPORT_REJECTED": "{patient} raporu reddedildi - {reason}",
        "DEVICE_CONNECTED": "{device} cihazı ağa bağlandı",
        "DEVICE_DISCONNECTED": "{device} cihazı bağlantısı kesildi",
        "DEVICE_OPERATION": "{device} cihazında işlem gerçekleştirildi",
        "DEVICE_ERROR": "{device} cihazında hata: {error}",
        "DEVICE_MAINTENANCE": "{device} cihazı bakıma alındı",
        "ACCESS_DENIED": "{user} için erişim reddedildi",
        "SECURITY_ALERT": "Güvenlik uyarısı: {alert_type}",
        "UNAUTHORIZED_ACCESS": "Yetkisiz erişim denemesi tespit edildi - {ip}",
        "SUSPICIOUS_ACTIVITY": "Şüpheli aktivite: {activity}",
        "SYSTEM_STARTUP": "Sistem başlatıldı",
        "SYSTEM_SHUTDOWN": "Sistem kapatıldı",
        "BACKUP_COMPLETED": "Sistem yedeği tamamlandı",
        "DATABASE_QUERY": "Veritabanı sorgusu çalıştırıldı",
        "FILE_UPLOAD": "{user} tarafından dosya yüklendi: {filename}",
        "FILE_DOWNLOAD": "{user} tarafından dosya indirildi: {filename}",
        "PERFORMANCE_ALERT": "Performans uyarısı: {metric} - {value}",
        "NETWORK_ERROR": "Ağ hatası: {error}",
    }
    
    @staticmethod
    def generate_location_info(device_clinic: str = None) -> Dict:
        """Generate realistic location information based on device clinic"""
        
        # If device has assigned clinic, use it
        if device_clinic:
            clinic = device_clinic
            
            # Determine floor and unit based on clinic
            if "Radyoloji" in clinic or "Görüntüleme" in clinic:
                floor = "Zemin Kat"
                unit = random.choice(["Radyoloji Bölümü", "Görüntüleme Merkezi"])
            elif "Kardiyoloji" in clinic:
                floor = "1. Kat"
                unit = "Kardiyoloji Polikliniği"
            elif "Nöroloji" in clinic:
                floor = "3. Kat"
                unit = "Nöroloji Polikliniği"
            elif "Dahiliye" in clinic:
                floor = "1. Kat"
                unit = "Dahiliye Polikliniği"
            elif "Yoğun Bakım" in clinic:
                floor = "2. Kat"
                unit = clinic
            elif "Acil" in clinic:
                floor = "Zemin Kat"
                unit = "Acil Servis"
            elif "Kadın Doğum" in clinic or "Kadın" in clinic:
                floor = "4. Kat"
                unit = "Kadın Doğum"
            else:
                floor = random.choice(EventGenerator.FLOORS)
                unit = clinic
        else:
            # Random location
            floor = random.choice(EventGenerator.FLOORS)
            
            if floor in EventGenerator.LOCATIONS:
                available_units = EventGenerator.LOCATIONS[floor]
                unit = random.choice(available_units)
            else:
                unit = random.choice(EventGenerator.UNITS)
            
            # Get appropriate clinic based on unit
            if "Radyoloji" in unit or "Görüntüleme" in unit:
                clinic = "Radyoloji Bölümü"
            elif "Yoğun Bakım" in unit or "Koroner" in unit:
                clinic = "Yoğun Bakım Ünitesi"
            elif "Acil" in unit:
                clinic = "Acil Servis"
            elif "Ameliyathane" in unit:
                clinic = "Genel Cerrahi"
            else:
                clinic = random.choice(EventGenerator.CLINICS)
        
        # Generate room and terminal info
        room_number = f"{random.randint(100, 599)}"
        bed_number = random.choice([None, f"Yatak-{random.randint(1, 4)}"])
        workstation = f"WS-{floor[:1]}{random.randint(10, 99)}"
        
        return {
            "floor": floor,
            "clinic": clinic,
            "unit": unit,
            "room_number": room_number,
            "bed_number": bed_number,
            "workstation": workstation,
            "location": f"{floor} - {unit}"
        }
    
    @staticmethod
    def generate_ip_address(internal: bool = True) -> str:
        """Generate realistic IP address"""
        if internal:
            # Internal network
            prefixes = ["192.168.1.", "10.0.0.", "172.16.0."]
            prefix = random.choice(prefixes)
            return f"{prefix}{random.randint(1, 254)}"
        else:
            # External (for security events)
            return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
    
    @staticmethod
    def generate_accession_number() -> str:
        """Generate DICOM Accession Number (0008,0050)"""
        # Format: YYYYMMDDHHMMSS + Random 4 digits
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"{timestamp}{random.randint(1000, 9999)}"
    
    @staticmethod
    def generate_study_instance_uid() -> str:
        """Generate DICOM Study Instance UID (0020,000D)"""
        # Format: 1.2.826.0.1.XXXXXXXXXX.XX.XXXXXXXXXXXXX
        root = "1.2.840.113619"  # GE Healthcare OID (example)
        return f"{root}.2.{random.randint(100000, 999999)}.{random.randint(100, 999)}.{random.randint(1000000000000, 9999999999999)}"
    
    @staticmethod
    def generate_series_instance_uid() -> str:
        """Generate DICOM Series Instance UID (0020,000E)"""
        root = "1.2.840.113619"
        return f"{root}.2.{random.randint(100000, 999999)}.{random.randint(100, 999)}.{random.randint(1000000000000, 9999999999999)}"
    
    @staticmethod
    def generate_hl7_message_id() -> str:
        """Generate HL7 Message Control ID"""
        # Format: HL7YYYYMMDDHHMMSSXXXX
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"HL7{timestamp}{random.randint(1000, 9999)}"
    
    @staticmethod
    def generate_vital_signs() -> Dict:
        """Generate patient vital signs for monitoring"""
        return {
            "heart_rate": random.randint(60, 100),  # HR
            "blood_pressure_systolic": random.randint(110, 140),  # SBP
            "blood_pressure_diastolic": random.randint(65, 90),  # DBP
            "spo2": random.randint(94, 100),  # SpO2
            "respiratory_rate": random.randint(12, 20),  # RR/RESP
            "temperature": round(random.uniform(36.2, 37.5), 1),  # Temp
        }
    
    @staticmethod
    def generate_event(
        event_type: str,
        user_name: str = None,
        user_id: str = None,
        patient_name: str = None,
        patient_id: str = None,
        device_name: str = None,
        device_id: str = None,
        device_clinic: str = None,
        hospital_id: str = "hospital-1",
        timestamp: datetime = None,
        **kwargs
    ) -> Dict:
        """
        Generate a single audit log event
        """
        if timestamp is None:
            timestamp = TimePatterns.get_realistic_timestamp()
        
        # Generate location information based on device clinic
        location_info = EventGenerator.generate_location_info(device_clinic=device_clinic)
        
        # Get level
        level = EventGenerator.EVENT_LEVELS.get(event_type, "INFO")
        
        # Build message from template
        template = EventGenerator.MESSAGE_TEMPLATES.get(event_type, "Event: {event_type}")
        
        message_params = {
            "user": user_name or "Unknown",
            "patient": patient_name or patient_id or "Unknown",
            "device": device_name or "Unknown",
            "event_type": event_type,
            "floor": location_info["floor"],
            "clinic": location_info["clinic"],
            "unit": location_info["unit"],
            "location": location_info["location"],
            **kwargs
        }
        
        message = template.format(**message_params)
        
        # Generate DICOM/HL7 metadata for imaging events
        metadata = {}
        hl7_path = None
        dicom_path = None
        pdf_path = None
        
        if event_type in ["IMAGING_ORDERED", "IMAGING_STARTED", "IMAGING_COMPLETED", "IMAGE_TRANSFERRED"]:
            accession_number = EventGenerator.generate_accession_number()
            study_uid = EventGenerator.generate_study_instance_uid()
            series_uid = EventGenerator.generate_series_instance_uid()
            
            metadata.update({
                "accession_number": accession_number,
                "study_instance_uid": study_uid,
                "series_instance_uid": series_uid,
                "patient_id": patient_id,
                "modality": kwargs.get("modality", "CT"),
                "study_date": timestamp.strftime("%Y%m%d"),
                "study_time": timestamp.strftime("%H%M%S"),
                "referring_physician": user_name or "Unknown",
                "body_part_examined": kwargs.get("body_part", "CHEST"),
            })
            
            if event_type in ["IMAGING_COMPLETED", "IMAGE_TRANSFERRED"]:
                dicom_path = f"data/dicom/{accession_number}.dcm"
                metadata["series_count"] = random.randint(1, 5)
                metadata["instance_count"] = kwargs.get("images", random.randint(50, 300))
        
        if event_type in ["REPORT_COMPLETED", "REPORT_APPROVED"]:
            hl7_message_id = EventGenerator.generate_hl7_message_id()
            accession_number = EventGenerator.generate_accession_number()
            
            metadata.update({
                "hl7_message_id": hl7_message_id,
                "hl7_message_type": "ORU^R01",  # Observation Result
                "accession_number": accession_number,
                "sending_application": "RIS",
                "sending_facility": kwargs.get("hospital_id", "hospital-1"),
                "receiving_application": "PACS",
                "report_status": "F" if event_type == "REPORT_APPROVED" else "P",  # Final / Preliminary
            })
            
            pdf_path = f"data/reports/{accession_number}.pdf"
            hl7_path = f"data/hl7/{hl7_message_id}.hl7"
        
        # Add device monitoring data for device events
        if event_type in ["DEVICE_OPERATION", "DEVICE_CONNECTED", "IMAGING_STARTED", "IMAGING_COMPLETED"]:
            if device_id and any(mon_type in device_id.upper() for mon_type in ["MONITOR", "VENTILATOR", "VITAL"]):
                metadata["vital_signs"] = EventGenerator.generate_vital_signs()
            elif device_name and any(mon_type in device_name for mon_type in ["Monitor", "Ventilatör", "Vital"]):
                metadata["vital_signs"] = EventGenerator.generate_vital_signs()
        
        # Generate details with location information
        details = {
            "event_type": event_type,
            "timestamp": timestamp.isoformat(),
            "location": location_info,
            **metadata,
            **kwargs
        }
        
        return {
            "id": str(uuid.uuid4()),
            "timestamp": timestamp,
            "level": level,
            "event_type": event_type,
            "message": message,
            "user_id": user_id,
            "device_id": device_id,
            "patient_id": patient_id,
            "hospital_id": hospital_id,
            "source_ip": EventGenerator.generate_ip_address(),
            "details": details,
            "hl7_message_path": hl7_path,
            "dicom_path": dicom_path,
            "pdf_path": pdf_path,
        }
    
    @staticmethod
    def generate_workflow_sequence(
        patient_id: str,
        patient_name: str,
        user_id: str,
        user_name: str,
        device_id: str,
        device_name: str,
        hospital_id: str,
        modality: str = "CT_SCANNER",
        start_time: datetime = None
    ) -> List[Dict]:
        """
        Generate a complete patient workflow sequence
        This creates a realistic chain of events
        """
        if start_time is None:
            start_time = TimePatterns.get_realistic_timestamp()
        
        events = []
        current_time = start_time
        
        # Get workflow steps
        workflow = WorkflowPatterns.get_workflow_sequence()
        
        # Get realistic values
        body_part = WorkflowPatterns.get_random_body_part()
        diagnosis = WorkflowPatterns.get_random_diagnosis()
        imaging_duration = WorkflowPatterns.get_imaging_duration(modality)
        
        for event_type, duration_minutes in workflow:
            # Add some randomness to timing
            actual_duration = duration_minutes + random.randint(-2, 5)
            if actual_duration < 1:
                actual_duration = 1
            
            current_time += timedelta(minutes=actual_duration)
            
            # Build event-specific parameters
            event_params = {
                "event_type": event_type,
                "user_name": user_name,
                "user_id": user_id,
                "patient_name": patient_name,
                "patient_id": patient_id,
                "device_name": device_name,
                "device_id": device_id,
                "hospital_id": hospital_id,
                "timestamp": current_time,
            }
            
            # Add event-specific details
            if event_type in ["IMAGING_ORDERED", "IMAGING_STARTED", "IMAGING_COMPLETED"]:
                event_params.update({
                    "modality": modality.replace("_", " "),
                    "body_part": body_part,
                    "images": random.randint(50, 300),
                })
            
            if event_type in ["REPORT_COMPLETED", "REPORT_APPROVED"]:
                event_params.update({
                    "diagnosis": diagnosis,
                    "findings": f"{diagnosis} findings detected" if diagnosis != "Normal" else "No significant findings",
                })
            
            if event_type == "REPORT_REJECTED":
                event_params["reason"] = random.choice([
                    "Incomplete information",
                    "Quality issues",
                    "Additional views needed"
                ])
            
            events.append(EventGenerator.generate_event(**event_params))
        
        return events
    
    @staticmethod
    def generate_random_event(
        users: List[Dict],
        patients: List[Dict],
        devices: List[Dict],
        hospitals: List[Dict]
    ) -> Dict:
        """
        Generate a single random event from available entities
        """
        # Select random entities
        user = random.choice(users)
        patient = random.choice(patients) if random.random() > 0.3 else None
        device = random.choice(devices) if random.random() > 0.5 else None
        hospital = random.choice(hospitals)
        
        # Extract device clinic if available
        device_clinic = device.get("clinic") if device else None
        
        # Check if should generate error or security event
        if ErrorPatterns.should_generate_security_event():
            event_type = ErrorPatterns.get_random_security_event()
            
            return EventGenerator.generate_event(
                event_type=event_type,
                user_name=user.get("name"),
                user_id=user.get("id"),
                device_clinic=device_clinic,
                hospital_id=hospital.get("id"),
                ip=EventGenerator.generate_ip_address(internal=False),
                alert_type=random.choice(["Multiple failed logins", "Unusual access pattern", "Unauthorized resource access"]),
                activity=random.choice(["Multiple rapid queries", "After-hours access", "Sensitive data access"])
            )
        
        elif ErrorPatterns.should_generate_error():
            event_type = ErrorPatterns.get_random_error_type()
            
            return EventGenerator.generate_event(
                event_type=event_type,
                user_name=user.get("name"),
                user_id=user.get("id"),
                device_name=device.get("name") if device else None,
                device_id=device.get("id") if device else None,
                device_clinic=device_clinic,
                hospital_id=hospital.get("id"),
                error=random.choice(["Connection timeout", "Service unavailable", "Resource not found"]),
                metric=random.choice(["CPU Usage", "Memory Usage", "Disk I/O"]),
                value=random.choice(["95%", "87%", "92%"])
            )
        
        # Normal event
        event_types = [
            "USER_LOGIN", "USER_LOGOUT", "STUDY_VIEWED", "PATIENT_ACCESS",
            "PATIENT_DATA_VIEWED", "DEVICE_OPERATION", "DATABASE_QUERY",
            "FILE_UPLOAD", "FILE_DOWNLOAD"
        ]
        
        event_type = random.choice(event_types)
        
        return EventGenerator.generate_event(
            event_type=event_type,
            user_name=user.get("name"),
            user_id=user.get("id"),
            patient_name=patient.get("name") if patient else None,
            patient_id=patient.get("id") if patient else None,
            device_name=device.get("name") if device else None,
            device_id=device.get("id") if device else None,
            device_clinic=device_clinic,
            hospital_id=hospital.get("id"),
            filename=f"report_{uuid.uuid4().hex[:8]}.pdf" if event_type in ["FILE_UPLOAD", "FILE_DOWNLOAD"] else None
        )

