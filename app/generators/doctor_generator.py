"""
Doctor/Staff data generator with Turkish names and medical departments
"""

from faker import Faker
from datetime import datetime
import random
import string
from typing import Dict, List

# Create Faker instance with Turkish locale
fake_tr = Faker('tr_TR')


class DoctorGenerator:
    """Generate realistic doctor/staff data"""
    
    # Turkish medical titles
    TITLES = [
        "Dr.",
        "Uzm. Dr.",
        "Doç. Dr.",
        "Prof. Dr.",
        "Op. Dr.",
    ]
    
    # Medical departments (Turkish)
    DEPARTMENTS = {
        "Radyoloji": ["radiologist"],
        "Kardiyoloji": ["cardiologist"],
        "Nöroloji": ["neurologist"],
        "Ortopedi ve Travmatoloji": ["orthopedist"],
        "Genel Cerrahi": ["general_practitioner"],
        "Dahiliye": ["general_practitioner"],
        "Acil Tıp": ["general_practitioner"],
        "Anesteziyoloji": ["general_practitioner"],
    }
    
    # Staff roles
    STAFF_ROLES = {
        "Radyoloji Teknisyeni": "technician",
        "Hemşire": "nurse",
        "Sistem Yöneticisi": "admin",
    }
    
    # Common Turkish doctor names
    COMMON_NAMES_MALE = [
        "Ahmet", "Mehmet", "Mustafa", "Ali", "Hasan", "Hüseyin",
        "İbrahim", "Ömer", "Yusuf", "Emre", "Burak", "Can"
    ]
    
    COMMON_NAMES_FEMALE = [
        "Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin",
        "Emine", "Hatice", "Esra", "Deniz", "Büşra", "Ceren"
    ]
    
    COMMON_SURNAMES = [
        "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız",
        "Öztürk", "Aydın", "Arslan", "Doğan", "Kılıç", "Aslan",
        "Özdemir", "Çetin", "Koç", "Kurt", "Özkan", "Şimşek"
    ]
    
    @staticmethod
    def generate_doctor_id(hospital_code: str = "H01", dept_code: str = "RAD") -> str:
        """Generate doctor ID in hospital format"""
        # Format: H01-RAD-D-12345
        seq = ''.join(random.choices(string.digits, k=5))
        return f"{hospital_code}-{dept_code}-D-{seq}"
    
    @staticmethod
    def generate_staff_id(hospital_code: str = "H01", role_code: str = "TECH") -> str:
        """Generate staff ID"""
        seq = ''.join(random.choices(string.digits, k=5))
        return f"{hospital_code}-{role_code}-S-{seq}"
    
    @staticmethod
    def generate_email(name: str, hospital_id: str) -> str:
        """Generate hospital email address with guaranteed uniqueness"""
        # Extract hospital code
        hospital_code = hospital_id.split('-')[-1].lower()
        
        # Clean name (remove Turkish characters for email)
        name_parts = name.split()
        if len(name_parts) >= 2:
            first = name_parts[0]
            last = name_parts[-1]
            
            # Comprehensive Turkish character replacement (before lowercasing)
            replacements = {
                'ç': 'c', 'Ç': 'c',
                'ğ': 'g', 'Ğ': 'g',
                'ı': 'i', 'I': 'i',
                'İ': 'i', 'i': 'i',
                'ö': 'o', 'Ö': 'o',
                'ş': 's', 'Ş': 's',
                'ü': 'u', 'Ü': 'u'
            }
            
            for tr_char, en_char in replacements.items():
                first = first.replace(tr_char, en_char)
                last = last.replace(tr_char, en_char)
            
            # Now lowercase after replacement
            first = first.lower()
            last = last.lower()
            
            # Add UUID-based unique identifier for guaranteed uniqueness
            import uuid
            unique_id = str(uuid.uuid4().hex)[:8]
            
            return f"{first}.{last}.{unique_id}@{hospital_code}.saglik.gov.tr"
        
        return fake_tr.email()
    
    @staticmethod
    def generate_doctor(hospital_id: str = "hospital-1", department: str = None) -> Dict:
        """
        Generate a complete doctor record
        """
        # Select department
        if department is None:
            department = random.choice(list(DoctorGenerator.DEPARTMENTS.keys()))
        
        role = DoctorGenerator.DEPARTMENTS[department][0]
        
        # Gender and name
        gender = random.choice(["M", "F"])
        
        if gender == "M":
            first_name = random.choice(DoctorGenerator.COMMON_NAMES_MALE)
        else:
            first_name = random.choice(DoctorGenerator.COMMON_NAMES_FEMALE)
        
        last_name = random.choice(DoctorGenerator.COMMON_SURNAMES)
        full_name = f"{first_name} {last_name}"
        
        # Title (based on seniority)
        title = random.choices(
            DoctorGenerator.TITLES,
            weights=[30, 35, 15, 15, 5],  # Most are Dr. or Uzm. Dr.
            k=1
        )[0]
        
        # Generate IDs
        dept_code = department[:3].upper()
        doctor_id = DoctorGenerator.generate_doctor_id(
            hospital_id.split('-')[-1].upper(),
            dept_code
        )
        
        return {
            "id": doctor_id,
            "name": full_name,
            "title": title,
            "department": department,
            "role": role,
            "hospital_id": hospital_id,
            "email": DoctorGenerator.generate_email(full_name, hospital_id),
            "status": "active",
        }
    
    @staticmethod
    def generate_staff(hospital_id: str = "hospital-1", role: str = None) -> Dict:
        """
        Generate hospital staff (technician, nurse, admin)
        """
        if role is None:
            staff_type = random.choice(list(DoctorGenerator.STAFF_ROLES.keys()))
        else:
            staff_type = role
        
        role_code = DoctorGenerator.STAFF_ROLES[staff_type]
        
        # Gender and name
        gender = random.choice(["M", "F"])
        
        if gender == "M":
            first_name = random.choice(DoctorGenerator.COMMON_NAMES_MALE)
        else:
            first_name = random.choice(DoctorGenerator.COMMON_NAMES_FEMALE)
        
        last_name = random.choice(DoctorGenerator.COMMON_SURNAMES)
        full_name = f"{first_name} {last_name}"
        
        # Generate ID
        staff_id = DoctorGenerator.generate_staff_id(
            hospital_id.split('-')[-1].upper(),
            role_code[:4].upper()
        )
        
        return {
            "id": staff_id,
            "name": full_name,
            "title": "",
            "department": staff_type,
            "role": role_code,
            "hospital_id": hospital_id,
            "email": DoctorGenerator.generate_email(full_name, hospital_id),
            "status": "active",
        }
    
    @staticmethod
    def generate_hospital_staff(hospital_id: str, 
                                doctor_count: int = 20,
                                staff_count: int = 10) -> List[Dict]:
        """
        Generate a complete hospital staff
        """
        staff_list = []
        
        # Generate doctors (distribute across departments)
        departments = list(DoctorGenerator.DEPARTMENTS.keys())
        for i in range(doctor_count):
            dept = departments[i % len(departments)]
            staff_list.append(DoctorGenerator.generate_doctor(hospital_id, dept))
        
        # Generate staff
        for _ in range(staff_count):
            staff_list.append(DoctorGenerator.generate_staff(hospital_id))
        
        return staff_list

