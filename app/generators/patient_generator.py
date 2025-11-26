"""
Patient data generator with Turkish names and realistic medical data
"""

from faker import Faker
from datetime import datetime, timedelta
import random
import string
from typing import Dict, Optional

# Create Faker instance with Turkish locale
fake_tr = Faker('tr_TR')
fake_en = Faker('en_US')  # For some fields


class PatientGenerator:
    """Generate realistic patient data"""
    
    # Turkish cities for patient addresses
    CITIES = [
        "Ankara", "İstanbul", "İzmir", "Antalya", "Bursa",
        "Adana", "Konya", "Gaziantep", "Şanlıurfa", "Kocaeli",
        "Mersin", "Diyarbakır", "Hatay", "Manisa", "Kayseri"
    ]
    
    @staticmethod
    def generate_tc_no() -> str:
        """
        Generate realistic Turkish TC Kimlik No (11 digits)
        Note: This is for simulation only, not real TC no algorithm
        """
        # First digit can't be 0
        first = str(random.randint(1, 9))
        # Next 9 digits
        middle = ''.join([str(random.randint(0, 9)) for _ in range(9)])
        # Last digit (checksum - simplified for simulation)
        last = str(random.randint(0, 9))
        
        return first + middle + last
    
    @staticmethod
    def generate_patient_id(hospital_code: str = "H01") -> str:
        """Generate patient ID in hospital format"""
        # Format: H01-P-20250101-001234
        date_part = datetime.now().strftime("%Y%m%d")
        seq_part = ''.join(random.choices(string.digits, k=6))
        return f"{hospital_code}-P-{date_part}-{seq_part}"
    
    @staticmethod
    def generate_patient(hospital_id: str = "hospital-1") -> Dict:
        """
        Generate a complete patient record with Turkish data
        """
        # Gender
        gender = random.choice(["M", "F"])
        
        # Name (Turkish) - Remove doctor titles from patient names
        if gender == "M":
            name = fake_tr.name_male()
        else:
            name = fake_tr.name_female()
        
        # Clean up titles that shouldn't be in patient names
        for title in ["Dr. ", "Prof. ", "Prof.Dr. ", "Doç. ", "Doç.Dr. ", "Okt. ", "Uzm.Dr. "]:
            if name.startswith(title):
                name = name[len(title):]
        
        # Birth date (realistic age distribution)
        # Most patients: 20-80 years old
        age_weights = [
            (0, 5, 2),      # Pediatric: 2%
            (5, 18, 5),     # Adolescent: 5%
            (18, 30, 15),   # Young adult: 15%
            (30, 50, 30),   # Adult: 30%
            (50, 70, 35),   # Middle age: 35%
            (70, 95, 13),   # Elderly: 13%
        ]
        
        age_range = random.choices(age_weights, weights=[w[2] for w in age_weights], k=1)[0]
        age = random.randint(age_range[0], age_range[1])
        birth_date = datetime.now() - timedelta(days=age*365 + random.randint(0, 365))
        
        # Address (Turkish)
        city = random.choice(PatientGenerator.CITIES)
        address = f"{fake_tr.street_address()}, {city}"
        
        # Contact
        phone = fake_tr.phone_number()
        
        # Patient ID
        patient_id = PatientGenerator.generate_patient_id(hospital_id.split('-')[-1].upper())
        
        return {
            "id": patient_id,
            "tc_no": PatientGenerator.generate_tc_no(),
            "name": name,
            "gender": gender,
            "birth_date": birth_date.date(),
            "phone": phone,
            "email": fake_tr.email() if random.random() > 0.3 else None,  # 70% have email
            "address": address,
            "hospital_id": hospital_id,
            "status": "active",
        }
    
    @staticmethod
    def generate_batch(count: int, hospital_id: str = "hospital-1") -> list:
        """Generate multiple patients"""
        return [PatientGenerator.generate_patient(hospital_id) for _ in range(count)]

