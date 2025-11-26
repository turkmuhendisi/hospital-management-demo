"""
Realistic data generators for dashboard simulation
"""

from .patient_generator import PatientGenerator
from .doctor_generator import DoctorGenerator
from .event_generator import EventGenerator
from .patterns import TimePatterns, WorkflowPatterns

__all__ = [
    "PatientGenerator",
    "DoctorGenerator", 
    "EventGenerator",
    "TimePatterns",
    "WorkflowPatterns"
]

