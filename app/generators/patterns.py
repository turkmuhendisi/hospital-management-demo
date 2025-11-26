"""
Realistic behavior patterns for data generation
"""

from datetime import datetime, time
import random
from typing import Dict, List


class TimePatterns:
    """Time-based patterns for realistic activity simulation"""
    
    # Peak hours distribution (hour -> weight percentage)
    PEAK_HOURS = {
        0: 1,   1: 1,   2: 1,   3: 1,   4: 2,   5: 3,
        6: 5,   7: 8,   8: 15,  9: 20, 10: 25, 11: 22,
        12: 10, 13: 8, 14: 15, 15: 25, 16: 30, 17: 15,
        18: 10, 19: 8, 20: 5, 21: 3, 22: 2, 23: 1
    }
    
    # Weekday distribution (0=Monday, 6=Sunday)
    WEEKDAY_WEIGHTS = {
        0: 20,  # Monday
        1: 22,  # Tuesday
        2: 20,  # Wednesday
        3: 18,  # Thursday
        4: 15,  # Friday
        5: 3,   # Saturday
        6: 2    # Sunday
    }
    
    @staticmethod
    def should_generate_now() -> bool:
        """
        Determine if we should generate an event based on current time
        Returns True more often during peak hours
        """
        now = datetime.now()
        hour_weight = TimePatterns.PEAK_HOURS.get(now.hour, 10)
        weekday_weight = TimePatterns.WEEKDAY_WEIGHTS.get(now.weekday(), 10)
        
        # Combine weights
        combined_weight = (hour_weight + weekday_weight) / 2
        
        # Random check against weight
        return random.randint(1, 100) <= combined_weight
    
    @staticmethod
    def get_realistic_timestamp(base_time: datetime = None) -> datetime:
        """
        Generate a realistic timestamp based on patterns
        """
        if base_time is None:
            base_time = datetime.now()
        
        # Adjust to peak hours with higher probability
        hour_weights = list(TimePatterns.PEAK_HOURS.values())
        hours = list(range(24))
        selected_hour = random.choices(hours, weights=hour_weights, k=1)[0]
        
        return base_time.replace(
            hour=selected_hour,
            minute=random.randint(0, 59),
            second=random.randint(0, 59)
        )


class WorkflowPatterns:
    """Medical workflow patterns and sequences"""
    
    # Common workflow sequences with timing (in minutes)
    PATIENT_JOURNEY = [
        ("PATIENT_ADMISSION", 2),
        ("PATIENT_REGISTRATION", 5),
        ("IMAGING_ORDERED", 10),
        ("IMAGING_STARTED", 3),
        ("IMAGING_COMPLETED", 20),  # Average imaging time
        ("IMAGE_TRANSFERRED", 2),
        ("REPORT_ASSIGNED", 5),
        ("REPORT_IN_PROGRESS", 20),
        ("REPORT_COMPLETED", 1),
        ("REPORT_APPROVED", 5),
    ]
    
    # Modality specific imaging durations (min, max in minutes)
    IMAGING_DURATIONS = {
        "XRAY": (5, 10),
        "ULTRASOUND": (15, 30),
        "CT_SCANNER": (20, 45),
        "MRI_SCANNER": (30, 60),
        "NST_DEVICE": (20, 40),
    }
    
    # Body part distribution for imaging
    BODY_PARTS = {
        "Chest": 30,
        "Abdomen": 20,
        "Extremity": 25,
        "Head/Brain": 15,
        "Spine": 10,
    }
    
    # Diagnosis distribution (normal vs findings)
    DIAGNOSIS_DISTRIBUTION = {
        "Normal": 60,
        "Fracture": 15,
        "Infection": 10,
        "Tumor/Mass": 5,
        "Degenerative": 5,
        "Other": 5,
    }
    
    @staticmethod
    def get_workflow_sequence(patient_type: str = "outpatient") -> List[tuple]:
        """
        Get workflow sequence based on patient type
        """
        if patient_type == "emergency":
            # Emergency patients skip some steps
            return [
                ("PATIENT_ADMISSION", 1),
                ("IMAGING_ORDERED", 2),
                ("IMAGING_STARTED", 1),
                ("IMAGING_COMPLETED", 15),
                ("IMAGE_TRANSFERRED", 1),
                ("REPORT_ASSIGNED", 2),
                ("REPORT_IN_PROGRESS", 10),
                ("REPORT_COMPLETED", 1),
                ("REPORT_APPROVED", 2),
            ]
        else:
            return WorkflowPatterns.PATIENT_JOURNEY
    
    @staticmethod
    def get_imaging_duration(modality: str) -> int:
        """Get realistic imaging duration in minutes"""
        if modality in WorkflowPatterns.IMAGING_DURATIONS:
            min_dur, max_dur = WorkflowPatterns.IMAGING_DURATIONS[modality]
            return random.randint(min_dur, max_dur)
        return random.randint(10, 30)
    
    @staticmethod
    def get_random_body_part() -> str:
        """Get random body part based on distribution"""
        parts = list(WorkflowPatterns.BODY_PARTS.keys())
        weights = list(WorkflowPatterns.BODY_PARTS.values())
        return random.choices(parts, weights=weights, k=1)[0]
    
    @staticmethod
    def get_random_diagnosis() -> str:
        """Get random diagnosis based on distribution"""
        diagnoses = list(WorkflowPatterns.DIAGNOSIS_DISTRIBUTION.keys())
        weights = list(WorkflowPatterns.DIAGNOSIS_DISTRIBUTION.values())
        return random.choices(diagnoses, weights=weights, k=1)[0]


class ErrorPatterns:
    """Realistic error and security event patterns"""
    
    # Error rate: 2-5% of events
    ERROR_RATE = 0.03
    
    # Security event rate: 0.5-1% of events
    SECURITY_EVENT_RATE = 0.005
    
    # Common error types
    ERROR_TYPES = [
        "NETWORK_ERROR",
        "DEVICE_ERROR",
        "ACCESS_DENIED",
        "PERFORMANCE_ALERT",
    ]
    
    # Security event types
    SECURITY_EVENTS = [
        "SECURITY_ALERT",
        "UNAUTHORIZED_ACCESS",
        "SUSPICIOUS_ACTIVITY",
        "USER_FAILED_LOGIN",
    ]
    
    @staticmethod
    def should_generate_error() -> bool:
        """Determine if we should generate an error"""
        return random.random() < ErrorPatterns.ERROR_RATE
    
    @staticmethod
    def should_generate_security_event() -> bool:
        """Determine if we should generate a security event"""
        return random.random() < ErrorPatterns.SECURITY_EVENT_RATE
    
    @staticmethod
    def get_random_error_type() -> str:
        """Get random error type"""
        return random.choice(ErrorPatterns.ERROR_TYPES)
    
    @staticmethod
    def get_random_security_event() -> str:
        """Get random security event"""
        return random.choice(ErrorPatterns.SECURITY_EVENTS)

