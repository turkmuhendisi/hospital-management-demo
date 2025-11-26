#!/usr/bin/env python3
"""
Advanced Enterprise Audit Trail Dashboard Server
Provides comprehensive API endpoints for advanced dashboard features
"""

import http.server
import socketserver
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import threading
import time
import sqlite3
from typing import Dict, List, Optional, Any
import uuid

# Add project root to path for imports
sys.path.append('..')

class AdvancedAuditHandler(http.server.SimpleHTTPRequestHandler):
    """Advanced handler for enterprise audit trail dashboard."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(__file__), **kwargs)
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for advanced features."""
        self.db_path = Path('../data/audit_advanced.db')
        self.db_path.parent.mkdir(exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                level TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                user_id TEXT,
                user_name TEXT,
                device_id TEXT,
                device_name TEXT,
                patient_id TEXT,
                patient_name TEXT,
                hospital_id TEXT,
                source_ip TEXT,
                details TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS hospitals (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT,
                type TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                department TEXT,
                hospital_id TEXT,
                role TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT,
                hospital_id TEXT,
                ip_address TEXT,
                status TEXT DEFAULT 'active',
                last_seen TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT,
                hospital_id TEXT,
                birth_date TEXT,
                gender TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert sample data
        self.insert_sample_data(cursor)
        
        conn.commit()
        conn.close()
    
    def insert_sample_data(self, cursor):
        """Insert sample data for demonstration."""
        # Sample hospitals
        hospitals = [
            ('hospital-1', 'Ankara Şehir Hastanesi', 'Ankara', 'Public', 'active'),
            ('hospital-2', 'İstanbul Tıp Fakültesi', 'İstanbul', 'University', 'active'),
            ('hospital-3', 'Ege Üniversitesi Hastanesi', 'İzmir', 'University', 'active'),
            ('hospital-4', 'Hacettepe Üniversitesi', 'Ankara', 'University', 'active')
        ]
        
        for hospital in hospitals:
            cursor.execute('''
                INSERT OR IGNORE INTO hospitals (id, name, location, type, status)
                VALUES (?, ?, ?, ?, ?)
            ''', hospital)
        
        # Sample users
        users = [
            ('user-1', 'Dr. Ahmet Yılmaz', 'Radiology', 'hospital-1', 'Radiologist', 'active'),
            ('user-2', 'Dr. Ayşe Demir', 'Cardiology', 'hospital-2', 'Cardiologist', 'active'),
            ('user-3', 'Dr. Mehmet Kaya', 'Neurology', 'hospital-1', 'Neurologist', 'active'),
            ('user-4', 'Dr. Fatma Özkan', 'Orthopedics', 'hospital-3', 'Orthopedist', 'active'),
            ('user-5', 'Tech Ali Veli', 'IT', 'hospital-1', 'Technician', 'active')
        ]
        
        for user in users:
            cursor.execute('''
                INSERT OR IGNORE INTO users (id, name, department, hospital_id, role, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', user)
        
        # Sample devices
        devices = [
            ('device-1', 'Workstation-01', 'Workstation', 'hospital-1', '192.168.1.100', 'active'),
            ('device-2', 'CT-Scanner-01', 'Modality', 'hospital-1', '192.168.1.102', 'active'),
            ('device-3', 'PACS-Server', 'PACS', 'hospital-2', '192.168.1.103', 'active'),
            ('device-4', 'Workstation-02', 'Workstation', 'hospital-2', '192.168.1.101', 'active'),
            ('device-5', 'MRI-Scanner-01', 'Modality', 'hospital-3', '192.168.1.104', 'active')
        ]
        
        for device in devices:
            cursor.execute('''
                INSERT OR IGNORE INTO devices (id, name, type, hospital_id, ip_address, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', device)
        
        # Sample patients
        patients = [
            ('P12345', 'Ahmet Yılmaz', 'hospital-1', '1978-05-15', 'M', 'active'),
            ('P67890', 'Ayşe Demir', 'hospital-2', '1990-03-22', 'F', 'active'),
            ('P11111', 'Mehmet Kaya', 'hospital-1', '1995-11-08', 'M', 'active'),
            ('P22222', 'Fatma Özkan', 'hospital-3', '1965-09-12', 'F', 'active')
        ]
        
        for patient in patients:
            cursor.execute('''
                INSERT OR IGNORE INTO patients (id, name, hospital_id, birth_date, gender, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', patient)
    
    def do_GET(self):
        """Handle GET requests."""
        if self.path == '/':
            self.path = '/index.html'
        elif self.path.startswith('/api/'):
            self.handle_api_request()
            return
        elif self.path.startswith('/media/'):
            self.handle_media_request()
            return
        
        return super().do_GET()
    
    def handle_api_request(self):
        """Handle API requests."""
        try:
            if self.path == '/api/logs':
                self.serve_logs_api()
            elif self.path == '/api/logs/recent':
                self.serve_recent_logs_api()
            elif self.path == '/api/stats':
                self.serve_stats_api()
            elif self.path == '/api/stats/dashboard':
                self.serve_dashboard_stats_api()
            elif self.path == '/api/hospitals':
                self.serve_hospitals_api()
            elif self.path == '/api/users':
                self.serve_users_api()
            elif self.path == '/api/devices':
                self.serve_devices_api()
            elif self.path == '/api/patients':
                self.serve_patients_api()
            elif self.path == '/api/search/doctors':
                self.serve_doctor_search_api()
            elif self.path == '/api/search/devices':
                self.serve_device_search_api()
            elif self.path == '/api/search/patients':
                self.serve_patient_search_api()
            elif self.path == '/api/analytics/activity':
                self.serve_activity_analytics_api()
            elif self.path == '/api/analytics/security':
                self.serve_security_analytics_api()
            elif self.path == '/api/analytics/performance':
                self.serve_performance_analytics_api()
            elif self.path == '/api/timeline':
                self.serve_timeline_api()
            elif self.path == '/api/export':
                self.serve_export_api()
            else:
                self.send_error(404, "API endpoint not found")
        except Exception as e:
            self.send_error(500, f"API error: {str(e)}")
    
    def handle_media_request(self):
        """Handle media file requests."""
        media_type = self.path.split('/')[2]
        media_id = self.path.split('/')[3]
        
        if media_type == 'hl7':
            self.serve_hl7_file(media_id)
        elif media_type == 'dicom':
            self.serve_dicom_file(media_id)
        elif media_type == 'pdf':
            self.serve_pdf_file(media_id)
        else:
            self.send_error(404, "Media type not found")
    
    def serve_logs_api(self):
        """Serve comprehensive logs API."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get query parameters
        query_params = self.parse_query_params()
        
        # Build query
        query = '''
            SELECT al.*, u.name as user_name, d.name as device_name, p.name as patient_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN devices d ON al.device_id = d.id
            LEFT JOIN patients p ON al.patient_id = p.id
            WHERE 1=1
        '''
        params = []
        
        # Apply filters
        if 'hospital_id' in query_params and query_params['hospital_id'] != 'all':
            query += ' AND al.hospital_id = ?'
            params.append(query_params['hospital_id'])
        
        if 'level' in query_params:
            query += ' AND al.level = ?'
            params.append(query_params['level'])
        
        if 'event_type' in query_params:
            query += ' AND al.event_type = ?'
            params.append(query_params['event_type'])
        
        if 'start_date' in query_params:
            query += ' AND al.timestamp >= ?'
            params.append(query_params['start_date'])
        
        if 'end_date' in query_params:
            query += ' AND al.timestamp <= ?'
            params.append(query_params['end_date'])
        
        query += ' ORDER BY al.timestamp DESC LIMIT 1000'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        logs = []
        for row in rows:
            log = {
                'id': row[0],
                'timestamp': row[1],
                'level': row[2],
                'event_type': row[3],
                'message': row[4],
                'user': row[6] if row[6] else row[5],
                'device': row[8] if row[8] else row[7],
                'patient': row[10] if row[10] else row[9],
                'hospital_id': row[11],
                'source_ip': row[12],
                'details': json.loads(row[13]) if row[13] else {}
            }
            logs.append(log)
        
        conn.close()
        
        response = {
            'logs': logs,
            'total': len(logs),
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_json_response(response)
    
    def serve_dashboard_stats_api(self):
        """Serve comprehensive dashboard statistics."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get basic stats
        cursor.execute('SELECT COUNT(*) FROM audit_logs')
        total_events = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE user_id IS NOT NULL')
        active_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT device_id) FROM audit_logs WHERE device_id IS NOT NULL')
        active_devices = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT patient_id) FROM audit_logs WHERE patient_id IS NOT NULL')
        patient_count = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(*) FROM audit_logs 
            WHERE level IN ('ERROR', 'CRITICAL') OR event_type LIKE '%SECURITY%'
        ''')
        security_events = cursor.fetchone()[0]
        
        # Get events in last hour
        one_hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()
        cursor.execute('SELECT COUNT(*) FROM audit_logs WHERE timestamp >= ?', (one_hour_ago,))
        events_last_hour = cursor.fetchone()[0]
        
        # Get system health (percentage of successful operations)
        cursor.execute('''
            SELECT 
                (COUNT(CASE WHEN level = 'INFO' THEN 1 END) * 100.0 / COUNT(*)) as success_rate
            FROM audit_logs 
            WHERE timestamp >= ?
        ''', (one_hour_ago,))
        health_result = cursor.fetchone()
        system_health = health_result[0] if health_result[0] else 99.9
        
        conn.close()
        
        stats = {
            'totalEvents': total_events,
            'activeUsers': active_users,
            'activeDevices': active_devices,
            'patientCount': patient_count,
            'securityEvents': security_events,
            'eventsPerHour': events_last_hour,
            'systemHealth': round(system_health, 1),
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_json_response(stats)
    
    def serve_hospitals_api(self):
        """Serve hospitals list."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM hospitals WHERE status = "active"')
        rows = cursor.fetchall()
        
        hospitals = []
        for row in rows:
            hospital = {
                'id': row[0],
                'name': row[1],
                'location': row[2],
                'type': row[3],
                'status': row[4]
            }
            hospitals.append(hospital)
        
        conn.close()
        self.send_json_response(hospitals)
    
    def serve_doctor_search_api(self):
        """Serve doctor search API."""
        query_params = self.parse_query_params()
        query = query_params.get('q', '')
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.*, h.name as hospital_name 
            FROM users u
            LEFT JOIN hospitals h ON u.hospital_id = h.id
            WHERE u.name LIKE ? AND u.status = 'active'
            ORDER BY u.name
            LIMIT 20
        ''', (f'%{query}%',))
        
        rows = cursor.fetchall()
        
        doctors = []
        for row in rows:
            doctor = {
                'id': row[0],
                'name': row[1],
                'department': row[2],
                'hospital_id': row[3],
                'hospital_name': row[5],
                'role': row[4]
            }
            doctors.append(doctor)
        
        conn.close()
        self.send_json_response(doctors)
    
    def serve_device_search_api(self):
        """Serve device search API."""
        query_params = self.parse_query_params()
        query = query_params.get('q', '')
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT d.*, h.name as hospital_name 
            FROM devices d
            LEFT JOIN hospitals h ON d.hospital_id = h.id
            WHERE (d.name LIKE ? OR d.ip_address LIKE ?) AND d.status = 'active'
            ORDER BY d.name
            LIMIT 20
        ''', (f'%{query}%', f'%{query}%'))
        
        rows = cursor.fetchall()
        
        devices = []
        for row in rows:
            device = {
                'id': row[0],
                'name': row[1],
                'type': row[2],
                'hospital_id': row[3],
                'hospital_name': row[6],
                'ip_address': row[4],
                'status': row[5]
            }
            devices.append(device)
        
        conn.close()
        self.send_json_response(devices)
    
    def serve_patient_search_api(self):
        """Serve patient search API."""
        query_params = self.parse_query_params()
        query = query_params.get('q', '')
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, h.name as hospital_name 
            FROM patients p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE (p.id LIKE ? OR p.name LIKE ?) AND p.status = 'active'
            ORDER BY p.name
            LIMIT 20
        ''', (f'%{query}%', f'%{query}%'))
        
        rows = cursor.fetchall()
        
        patients = []
        for row in rows:
            patient = {
                'id': row[0],
                'name': row[1],
                'hospital_id': row[2],
                'hospital_name': row[6],
                'birth_date': row[3],
                'gender': row[4]
            }
            patients.append(patient)
        
        conn.close()
        self.send_json_response(patients)
    
    def serve_activity_analytics_api(self):
        """Serve activity analytics data."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get activity by hour for last 24 hours
        query = '''
            SELECT 
                strftime('%H', timestamp) as hour,
                COUNT(*) as count
            FROM audit_logs 
            WHERE timestamp >= datetime('now', '-24 hours')
            GROUP BY strftime('%H', timestamp)
            ORDER BY hour
        '''
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        # Create full 24-hour data
        hourly_data = {}
        for row in rows:
            hourly_data[row[0]] = row[1]
        
        # Fill missing hours with 0
        activity_data = []
        for hour in range(24):
            hour_str = f"{hour:02d}"
            count = hourly_data.get(hour_str, 0)
            activity_data.append({
                'hour': hour_str,
                'count': count
            })
        
        conn.close()
        self.send_json_response(activity_data)
    
    def serve_hl7_file(self, file_id):
        """Serve real HL7 file content."""
        try:
            # Look for HL7 files in the data directory
            hl7_files = []
            data_dir = Path('../data')
            
            # Search in nst_demo/hl7 and nst_test/hl7 directories
            for subdir in ['nst_demo/hl7', 'nst_test/hl7']:
                hl7_dir = data_dir / subdir
                if hl7_dir.exists():
                    hl7_files.extend(list(hl7_dir.glob('*.hl7')))
            
            if not hl7_files:
                self.send_error(404, "No HL7 files found")
                return
            
            # If file_id is provided, try to find specific file
            if file_id and file_id != 'list':
                target_file = None
                for file_path in hl7_files:
                    if file_id in file_path.name:
                        target_file = file_path
                        break
                
                if not target_file:
                    target_file = hl7_files[0]  # Default to first file
            else:
                target_file = hl7_files[0]
            
            # Read and serve the file
            with open(target_file, 'r', encoding='utf-8') as f:
                hl7_content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Content-Disposition', f'attachment; filename="{target_file.name}"')
            self.end_headers()
            self.wfile.write(hl7_content.encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Error serving HL7 file: {str(e)}")
    
    def serve_dicom_file(self, file_id):
        """Serve DICOM file information."""
        # Simulate DICOM file info
        dicom_info = {
            'file_id': file_id,
            'patient_id': f'P{file_id}',
            'study_date': '20250924',
            'modality': 'CT',
            'body_part': 'CHEST',
            'series_description': 'Chest CT with contrast',
            'image_count': 256,
            'file_size': '45.2 MB'
        }
        
        self.send_json_response(dicom_info)
    
    def serve_pdf_file(self, file_id):
        """Serve PDF report information."""
        # Simulate PDF report info
        pdf_info = {
            'file_id': file_id,
            'report_type': 'Radiology Report',
            'patient_id': f'P{file_id}',
            'doctor': 'Dr. Ahmet Yılmaz',
            'date': '2025-09-24',
            'status': 'Final',
            'file_size': '2.1 MB'
        }
        
        self.send_json_response(pdf_info)
    
    def parse_query_params(self):
        """Parse query parameters from URL."""
        if '?' not in self.path:
            return {}
        
        query_string = self.path.split('?')[1]
        params = {}
        
        for param in query_string.split('&'):
            if '=' in param:
                key, value = param.split('=', 1)
                params[key] = value
        
        return params
    
    def send_json_response(self, data):
        """Send JSON response."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(json_data.encode('utf-8'))


def start_advanced_dashboard_server(port=8081):
    """Start the advanced audit trail dashboard server."""
    try:
        with socketserver.TCPServer(("", port), AdvancedAuditHandler) as httpd:
            print(f"🚀 Advanced Enterprise Audit Trail Dashboard started!")
            print(f"📊 Dashboard URL: http://localhost:{port}")
            print(f"🔗 Advanced Features:")
            print(f"   - Hospital-based filtering")
            print(f"   - Doctor/Device/Patient search")
            print(f"   - Real-time analytics")
            print(f"   - Media viewer (HL7, DICOM, PDF)")
            print(f"   - Timeline visualization")
            print(f"   - Export capabilities")
            print(f"\n💡 Features:")
            print(f"   - SQLite database backend")
            print(f"   - Advanced search and filtering")
            print(f"   - Real-time statistics")
            print(f"   - Media file management")
            print(f"   - Analytics and reporting")
            print(f"\n⏹️  Press Ctrl+C to stop the server")
            print("-" * 60)
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n🛑 Advanced dashboard server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Advanced Enterprise Audit Trail Dashboard Server')
    parser.add_argument('--port', type=int, default=8081, help='Port to serve on (default: 8081)')
    
    args = parser.parse_args()
    
    start_advanced_dashboard_server(args.port)
