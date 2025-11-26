// Enterprise Audit Trail Dashboard JavaScript

class EnterpriseAuditDashboard {
    constructor() {
        this.isRealTime = true;
        this.selectedHospital = 'all';
        this.currentContentTab = 'dashboard';
        this.currentMediaTab = 'logs';
        this.logs = [];
        this.filteredLogs = [];
        this.selectedLogs = new Set();
        this.searchResults = {
            doctors: [],
            devices: [],
            patients: []
        };
        
        this.stats = {
            totalEvents: 0,
            activeUsers: 0,
            securityEvents: 0,
            systemHealth: 99.9,
            eventsPerMinute: 0,
            peakActivity: '14:30',
            avgResponse: '2.3s'
        };
        
        this.charts = {};
        this.initializeEventListeners();
        
        // Wait for Chart.js to load before initializing charts
        this.waitForChartJS().then(() => {
            this.initializeCharts();
            this.loadSampleData();
        }).catch(() => {
            console.warn('Chart.js failed to load, initializing without charts');
            this.loadSampleData();
        });
        
        // Start real-time updates immediately
        setTimeout(() => {
            this.startRealTimeUpdates();
        }, 1000);
    }

    waitForChartJS() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max wait
            
            const checkChart = () => {
                if (typeof Chart !== 'undefined' && Chart.Chart) {
                    console.log('Chart.js loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('Chart.js failed to load after 10 seconds');
                    reject(new Error('Chart.js failed to load'));
                } else {
                    attempts++;
                    setTimeout(checkChart, 100);
                }
            };
            
            checkChart();
        });
    }

    initializeEventListeners() {
        // Hospital selector
        document.getElementById('hospital-select').addEventListener('change', (e) => {
            this.selectedHospital = e.target.value;
            this.filterLogsByHospital();
        });

        // Navigation controls
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshData());
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());

        // Content tabs
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchContentTab(e.target.dataset.content);
            });
        });

        // Media tabs
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMediaTab(e.target.dataset.media);
            });
        });

        // Real-time toggle
        document.getElementById('real-time-toggle').addEventListener('click', () => {
            this.toggleRealTime();
        });

        // Search functionality
        this.initializeSearch();

        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // Timeline controls
        document.querySelectorAll('.timeline-controls .btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTimelineZoom(e.target.dataset.zoom);
            });
        });

        // Export selected
        document.getElementById('export-selected').addEventListener('click', () => {
            this.exportSelectedLogs();
        });

        // Modal controls
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.detail-close').addEventListener('click', () => {
            this.closeDetailPanel();
        });
    }

    initializeSearch() {
        // Doctor search
        const doctorSearch = document.getElementById('doctor-search');
        doctorSearch.addEventListener('input', (e) => {
            this.searchDoctors(e.target.value);
        });

        // Device search
        const deviceSearch = document.getElementById('device-search');
        deviceSearch.addEventListener('input', (e) => {
            this.searchDevices(e.target.value);
        });

        // Patient search
        const patientSearch = document.getElementById('patient-search');
        patientSearch.addEventListener('input', (e) => {
            this.searchPatients(e.target.value);
        });

        // Date range
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        
        startDate.addEventListener('change', () => this.applyDateFilter());
        endDate.addEventListener('change', () => this.applyDateFilter());
    }

    initializeCharts() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            return;
        }
        
        // Activity overview chart
        const activityCtx = document.getElementById('activity-overview-chart');
        if (!activityCtx) {
            console.warn('Activity chart canvas not found');
            return;
        }
        
        this.charts.activityOverview = new Chart(activityCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [{
                    label: 'Events',
                    data: this.generateRandomData(24),
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Event types chart
        const eventTypesCtx = document.getElementById('event-types-chart');
        if (!eventTypesCtx) {
            console.warn('Event types chart canvas not found');
            return;
        }
        
        this.charts.eventTypes = new Chart(eventTypesCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['User Activity', 'Device Operations', 'Patient Access', 'Security Events', 'System Events'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#1e40af',
                        '#059669',
                        '#d97706',
                        '#dc2626',
                        '#64748b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Activity chart in sidebar
        const sidebarActivityCtx = document.getElementById('activity-chart');
        if (!sidebarActivityCtx) {
            console.warn('Sidebar activity chart canvas not found');
            return;
        }
        
        this.charts.activity = new Chart(sidebarActivityCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    data: [5, 10, 25, 30, 20, 15],
                    backgroundColor: '#1e40af',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    loadSampleData() {
        // Load sample audit logs
        this.logs = [
            {
                id: '1',
                timestamp: new Date().toISOString(),
                level: 'INFO',
                eventType: 'USER_LOGIN',
                message: 'Dr. Ahmet Yılmaz logged in successfully',
                user: 'Dr. Ahmet Yılmaz',
                device: 'Workstation-01',
                patient: null,
                hospital: 'hospital-1',
                ip: '192.168.1.100'
            },
            {
                id: '2',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                level: 'WARNING',
                eventType: 'PATIENT_ACCESS',
                message: 'Patient data accessed by Dr. Ayşe Demir',
                user: 'Dr. Ayşe Demir',
                device: 'Workstation-02',
                patient: 'P12345',
                hospital: 'hospital-2',
                ip: '192.168.1.101'
            },
            {
                id: '3',
                timestamp: new Date(Date.now() - 600000).toISOString(),
                level: 'INFO',
                eventType: 'DEVICE_OPERATION',
                message: 'DICOM images received from CT-Scanner-01',
                user: 'Tech Mehmet Kaya',
                device: 'CT-Scanner-01',
                patient: 'P67890',
                hospital: 'hospital-1',
                ip: '192.168.1.102'
            },
            {
                id: '4',
                timestamp: new Date(Date.now() - 900000).toISOString(),
                level: 'ERROR',
                eventType: 'ACCESS_DENIED',
                message: 'Unauthorized access attempt blocked',
                user: 'Unknown',
                device: 'Unknown',
                patient: null,
                hospital: 'hospital-3',
                ip: '192.168.1.200'
            },
            {
                id: '5',
                timestamp: new Date(Date.now() - 1200000).toISOString(),
                level: 'CRITICAL',
                eventType: 'SECURITY_ALERT',
                message: 'Multiple failed login attempts detected',
                user: 'Unknown',
                device: 'Unknown',
                patient: null,
                hospital: 'hospital-1',
                ip: '192.168.1.250'
            }
        ];

        this.filteredLogs = [...this.logs];
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
        this.updateCharts();
        this.updateMediaTabCounts();
        
        // Show initial data immediately
        console.log('Sample data loaded:', this.logs.length, 'logs');
    }

    searchDoctors(query) {
        if (!query.trim()) {
            document.getElementById('doctor-results').innerHTML = '';
            return;
        }

        // Simulate doctor search
        const doctors = [
            { id: '1', name: 'Dr. Ahmet Yılmaz', department: 'Radiology', hospital: 'hospital-1' },
            { id: '2', name: 'Dr. Ayşe Demir', department: 'Cardiology', hospital: 'hospital-2' },
            { id: '3', name: 'Dr. Mehmet Kaya', department: 'Neurology', hospital: 'hospital-1' },
            { id: '4', name: 'Dr. Fatma Özkan', department: 'Orthopedics', hospital: 'hospital-3' }
        ];

        const results = doctors.filter(doctor => 
            doctor.name.toLowerCase().includes(query.toLowerCase())
        );

        this.renderSearchResults('doctor-results', results, 'doctor');
    }

    searchDevices(query) {
        if (!query.trim()) {
            document.getElementById('device-results').innerHTML = '';
            return;
        }

        const devices = [
            { id: '1', name: 'Workstation-01', type: 'Workstation', ip: '192.168.1.100', hospital: 'hospital-1' },
            { id: '2', name: 'CT-Scanner-01', type: 'Modality', ip: '192.168.1.102', hospital: 'hospital-1' },
            { id: '3', name: 'PACS-Server', type: 'PACS', ip: '192.168.1.103', hospital: 'hospital-2' },
            { id: '4', name: 'Workstation-02', type: 'Workstation', ip: '192.168.1.101', hospital: 'hospital-2' }
        ];

        const results = devices.filter(device => 
            device.name.toLowerCase().includes(query.toLowerCase()) ||
            device.ip.includes(query)
        );

        this.renderSearchResults('device-results', results, 'device');
    }

    searchPatients(query) {
        if (!query.trim()) {
            document.getElementById('patient-results').innerHTML = '';
            return;
        }

        const patients = [
            { id: 'P12345', name: 'Ahmet Yılmaz', age: 45, hospital: 'hospital-1' },
            { id: 'P67890', name: 'Ayşe Demir', age: 32, hospital: 'hospital-2' },
            { id: 'P11111', name: 'Mehmet Kaya', age: 28, hospital: 'hospital-1' },
            { id: 'P22222', name: 'Fatma Özkan', age: 55, hospital: 'hospital-3' }
        ];

        const results = patients.filter(patient => 
            patient.name.toLowerCase().includes(query.toLowerCase()) ||
            patient.id.toLowerCase().includes(query.toLowerCase())
        );

        this.renderSearchResults('patient-results', results, 'patient');
    }

    renderSearchResults(containerId, results, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div style="font-weight: 500;">${result.name || result.id}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    ${result.department || result.type || result.age ? `${result.department || result.type || `Age: ${result.age}`} • ` : ''}
                    ${result.hospital || result.ip}
                </div>
            `;
            item.addEventListener('click', () => {
                this.selectSearchResult(type, result);
            });
            container.appendChild(item);
        });
    }

    selectSearchResult(type, result) {
        // Clear search inputs
        document.getElementById(`${type}-search`).value = '';
        document.getElementById(`${type}-results`).innerHTML = '';

        // Apply filter based on selection
        if (type === 'doctor') {
            this.filterLogsByUser(result.name);
        } else if (type === 'device') {
            this.filterLogsByDevice(result.name);
        } else if (type === 'patient') {
            this.filterLogsByPatient(result.id);
        }
    }

    filterLogsByHospital() {
        if (this.selectedHospital === 'all') {
            this.filteredLogs = [...this.logs];
        } else {
            this.filteredLogs = this.logs.filter(log => log.hospital === this.selectedHospital);
        }
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    filterLogsByUser(userName) {
        this.filteredLogs = this.logs.filter(log => log.user === userName);
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    filterLogsByDevice(deviceName) {
        this.filteredLogs = this.logs.filter(log => log.device === deviceName);
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    filterLogsByPatient(patientId) {
        this.filteredLogs = this.logs.filter(log => log.patient === patientId);
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    applyFilter(filter) {
        // Update filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Apply filter
        if (filter === 'all') {
            this.filteredLogs = [...this.logs];
        } else if (filter === 'critical') {
            this.filteredLogs = this.logs.filter(log => log.level === 'CRITICAL');
        } else if (filter === 'security') {
            this.filteredLogs = this.logs.filter(log => 
                log.eventType.includes('SECURITY') || log.eventType.includes('ACCESS_DENIED')
            );
        } else if (filter === 'patient-access') {
            this.filteredLogs = this.logs.filter(log => log.eventType.includes('PATIENT'));
        } else if (filter === 'device-operations') {
            this.filteredLogs = this.logs.filter(log => log.eventType.includes('DEVICE'));
        }

        this.updateStats();
        this.renderRecentActivity();
    }

    applyDateFilter() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);

        this.filteredLogs = this.logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
        });

        this.updateStats();
        this.renderRecentActivity();
    }

    switchContentTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-content="${tabName}"]`).classList.add('active');

        // Update content panels
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');

        this.currentContentTab = tabName;

        // Load content specific data
        if (tabName === 'analytics') {
            this.loadAnalyticsData();
        } else if (tabName === 'timeline') {
            this.loadTimelineData();
        }
    }

    switchMediaTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-media="${tabName}"]`).classList.add('active');

        this.currentMediaTab = tabName;

        // Load media specific data
        this.loadMediaData(tabName);
    }

    toggleRealTime() {
        const button = document.getElementById('real-time-toggle');
        
        if (this.isRealTime) {
            // Currently running, stop it
            this.isRealTime = false;
            this.stopRealTimeUpdates();
            button.classList.remove('active');
            button.innerHTML = '<i class="fas fa-pause"></i> Paused';
            console.log('Real-time updates paused');
        } else {
            // Currently stopped, start it
            this.isRealTime = true;
            this.startRealTimeUpdates();
            console.log('Real-time updates resumed');
        }
    }

    startRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
        
        console.log('Starting real-time updates...');
        this.isRealTime = true;
        
        // Update the button to show active state
        const button = document.getElementById('real-time-toggle');
        if (button) {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-play"></i> Real-time';
        }
        
        this.realTimeInterval = setInterval(() => {
            if (this.isRealTime) {
                this.simulateNewLog();
                this.updateStats();
                this.renderRecentActivity();
                this.renderLogEntries();
                this.updateMediaTabCounts();
                // Only update charts if they're initialized
                if (this.charts.activityOverview && this.charts.eventTypes) {
                    this.updateCharts();
                }
                console.log('Real-time update:', new Date().toLocaleTimeString(), '- Logs:', this.logs.length);
            }
        }, 2000); // New log every 2 seconds
    }

    stopRealTimeUpdates() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
        }
    }

    simulateNewLog() {
        const eventTypes = [
            { type: 'USER_LOGIN', level: 'INFO', message: 'User logged in successfully' },
            { type: 'PATIENT_ACCESS', level: 'WARNING', message: 'Patient data accessed' },
            { type: 'DEVICE_OPERATION', level: 'INFO', message: 'DICOM images received' },
            { type: 'STUDY_VIEW', level: 'INFO', message: 'Study viewed by radiologist' },
            { type: 'ACCESS_DENIED', level: 'ERROR', message: 'Unauthorized access attempt' },
            { type: 'SECURITY_ALERT', level: 'CRITICAL', message: 'Security threat detected' },
            { type: 'BACKUP_COMPLETED', level: 'INFO', message: 'System backup completed successfully' },
            { type: 'DEVICE_CONNECTED', level: 'INFO', message: 'New device connected to network' },
            { type: 'REPORT_GENERATED', level: 'INFO', message: 'Medical report generated' },
            { type: 'DATABASE_QUERY', level: 'INFO', message: 'Database query executed' },
            { type: 'FILE_UPLOAD', level: 'INFO', message: 'Medical image uploaded' },
            { type: 'USER_LOGOUT', level: 'INFO', message: 'User logged out' },
            { type: 'SYSTEM_MAINTENANCE', level: 'WARNING', message: 'System maintenance scheduled' },
            { type: 'PERFORMANCE_ALERT', level: 'WARNING', message: 'High CPU usage detected' },
            { type: 'NETWORK_ERROR', level: 'ERROR', message: 'Network connection lost' }
        ];

        const users = [
            'Dr. Ahmet Yılmaz', 'Dr. Ayşe Demir', 'Dr. Mehmet Kaya', 'Dr. Fatma Özkan',
            'Dr. Zeynep Arslan', 'Dr. Can Öztürk', 'Dr. Elif Kılıç', 'Dr. Burak Şahin',
            'Tech Ali Veli', 'Tech Ayşe Yılmaz', 'Admin System', 'Unknown'
        ];
        
        const devices = [
            'Workstation-01', 'CT-Scanner-01', 'PACS-Server', 'Workstation-02',
            'MRI-Scanner-01', 'Ultrasound-01', 'X-Ray-01', 'Workstation-03',
            'PACS-Client', 'Mobile-Device', 'Unknown'
        ];
        
        const patients = [
            'P12345', 'P67890', 'P11111', 'P22222', 'P33333', 'P44444',
            'P55555', 'P66666', null, null, null, null
        ];
        
        const hospitals = ['hospital-1', 'hospital-2', 'hospital-3', 'hospital-4'];
        const ips = ['192.168.1.', '10.0.0.', '172.16.0.'];

        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const device = devices[Math.floor(Math.random() * devices.length)];
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
        const ipPrefix = ips[Math.floor(Math.random() * ips.length)];

        const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            level: event.level,
            eventType: event.type,
            message: `${event.message}`,
            user: user,
            device: device,
            patient: patient,
            hospital: hospital,
            ip: `${ipPrefix}${Math.floor(Math.random() * 254) + 1}`
        };

        this.logs.unshift(newLog);
        
        // Keep only last 500 logs for better performance
        if (this.logs.length > 500) {
            this.logs = this.logs.slice(0, 500);
        }

        // Update filtered logs if no specific filter is applied
        if (this.selectedHospital === 'all') {
            this.filteredLogs.unshift(newLog);
        } else if (newLog.hospital === this.selectedHospital) {
            this.filteredLogs.unshift(newLog);
        }

        // Keep filtered logs manageable too
        if (this.filteredLogs.length > 200) {
            this.filteredLogs = this.filteredLogs.slice(0, 200);
        }
    }

    updateStats() {
        this.stats.totalEvents = this.filteredLogs.length;
        this.stats.activeUsers = new Set(this.filteredLogs.map(log => log.user)).size;
        this.stats.securityEvents = this.filteredLogs.filter(log => 
            log.level === 'ERROR' || log.level === 'CRITICAL' || 
            log.eventType.includes('SECURITY')
        ).length;

        // Update UI
        document.getElementById('total-events').textContent = this.stats.totalEvents;
        document.getElementById('active-users').textContent = this.stats.activeUsers;
        document.getElementById('security-events').textContent = this.stats.securityEvents;
        document.getElementById('nav-user-count').textContent = this.stats.activeUsers;
        document.getElementById('nav-device-count').textContent = new Set(this.filteredLogs.map(log => log.device)).size;
        document.getElementById('nav-patient-count').textContent = new Set(this.filteredLogs.map(log => log.patient).filter(Boolean)).size;
        document.getElementById('nav-alert-count').textContent = this.stats.securityEvents;
        document.getElementById('status-event-count').textContent = this.stats.totalEvents;
        document.getElementById('status-event-rate').textContent = `${this.stats.eventsPerMinute}/min`;
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }

    renderRecentActivity() {
        const container = document.getElementById('recent-activity-list');
        if (!container) return;
        
        container.innerHTML = '';

        const recentLogs = this.filteredLogs.slice(0, 10);
        
        if (recentLogs.length === 0) {
            container.innerHTML = '<div class="loading">No recent activity</div>';
            return;
        }
        
        recentLogs.forEach(log => {
            const template = document.getElementById('activity-item-template');
            const clone = template.content.cloneNode(true);
            const item = clone.querySelector('.activity-item');

            item.querySelector('.activity-message').textContent = log.message;
            item.querySelector('.activity-time').textContent = this.formatTime(log.timestamp);
            item.querySelector('.activity-user').textContent = log.user || 'Unknown';
            item.querySelector('.activity-device').textContent = log.device || 'Unknown';

            // Set activity icon color based on level
            const icon = item.querySelector('.activity-icon i');
            icon.className = `fas fa-circle activity-${log.level.toLowerCase()}`;

            container.appendChild(item);
        });
    }

    renderLogEntries() {
        const container = document.getElementById('log-entries-container');
        if (!container) return;
        
        container.innerHTML = '';

        if (this.filteredLogs.length === 0) {
            container.innerHTML = '<div class="loading">No logs available</div>';
            return;
        }
        
        this.filteredLogs.forEach(log => {
            const template = document.getElementById('log-entry-template');
            const clone = template.content.cloneNode(true);
            const entry = clone.querySelector('.log-entry');

            // Set data attributes for filtering
            entry.setAttribute('data-level', log.level);
            entry.setAttribute('data-type', log.eventType);

            // Fill in the data
            entry.querySelector('.log-timestamp').textContent = this.formatTime(log.timestamp);
            
            const levelElement = entry.querySelector('.log-level');
            levelElement.className = `log-level ${log.level}`;
            levelElement.querySelector('.level-text').textContent = log.level;
            levelElement.querySelector('.level-icon').className = `level-icon ${log.level}`;

            entry.querySelector('.log-message').textContent = log.message;

            // Context information
            const userContext = entry.querySelector('.context-item.user-context');
            const deviceContext = entry.querySelector('.context-item.device-context');
            const patientContext = entry.querySelector('.context-item.patient-context');

            if (log.user) {
                userContext.style.display = 'flex';
                userContext.querySelector('.context-value').textContent = log.user;
            } else {
                userContext.style.display = 'none';
            }

            if (log.device) {
                deviceContext.style.display = 'flex';
                deviceContext.querySelector('.context-value').textContent = log.device;
            } else {
                deviceContext.style.display = 'none';
            }

            if (log.patient) {
                patientContext.style.display = 'flex';
                patientContext.querySelector('.context-value').textContent = log.patient;
            } else {
                patientContext.style.display = 'none';
            }

            // Add to container
            container.appendChild(entry);
        });
    }

    updateCharts() {
        // Check if charts are initialized
        if (!this.charts.activityOverview || !this.charts.eventTypes) {
            console.warn('Charts not initialized, skipping update');
            return;
        }
        
        // Update activity overview chart
        const now = new Date();
        const labels = [];
        const data = [];

        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
            
            const hourStart = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours());
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            
            const eventsInHour = this.filteredLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                return logTime >= hourStart && logTime < hourEnd;
            }).length;
            
            data.push(eventsInHour);
        }

        this.charts.activityOverview.data.labels = labels;
        this.charts.activityOverview.data.datasets[0].data = data;
        this.charts.activityOverview.update();

        // Update event types chart
        const eventTypeCounts = {};
        this.filteredLogs.forEach(log => {
            eventTypeCounts[log.eventType] = (eventTypeCounts[log.eventType] || 0) + 1;
        });

        const eventTypes = Object.keys(eventTypeCounts);
        const eventData = Object.values(eventTypeCounts);

        this.charts.eventTypes.data.labels = eventTypes;
        this.charts.eventTypes.data.datasets[0].data = eventData;
        this.charts.eventTypes.update();
    }

    loadAnalyticsData() {
        // Load analytics-specific charts and data
        console.log('Loading analytics data...');
    }

    loadTimelineData() {
        // Load timeline visualization
        console.log('Loading timeline data...');
    }

    async loadMediaData(mediaType) {
        const modal = document.getElementById('media-modal');
        const modalTitle = document.getElementById('modal-title');
        const mediaViewer = document.getElementById('media-viewer');

        modalTitle.textContent = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
        
        // Show loading
        mediaViewer.innerHTML = '<div class="loading">Loading files...</div>';
        modal.classList.add('active');
        
        try {
            switch (mediaType) {
                case 'hl7':
                    await this.loadHL7Files(mediaViewer);
                    break;
                case 'dicom':
                    await this.loadDICOMFiles(mediaViewer);
                    break;
                case 'reports':
                    await this.loadPDFReports(mediaViewer);
                    break;
                case 'alerts':
                    await this.loadSecurityAlerts(mediaViewer);
                    break;
                default:
                    mediaViewer.innerHTML = '<p>Content not available</p>';
            }
        } catch (error) {
            console.error('Error loading media:', error);
            mediaViewer.innerHTML = '<p>Error loading content</p>';
        }
    }

    async loadHL7Files(container) {
        const files = this.getSimulatedHL7Files();
        this.renderHL7List(container, files);
    }

    async loadDICOMFiles(container) {
        const files = this.getSimulatedDICOMFiles();
        this.renderDICOMList(container, files);
    }

    async loadPDFReports(container) {
        const files = this.getSimulatedPDFFiles();
        this.renderPDFList(container, files);
    }

    async loadSecurityAlerts(container) {
        const alerts = this.logs.filter(log => 
            log.level === 'ERROR' || log.level === 'CRITICAL' || 
            log.eventType.includes('SECURITY') || log.eventType.includes('ACCESS_DENIED')
        );
        this.renderAlertsList(container, alerts);
    }

    getSimulatedHL7Files() {
        return [
            { id: '1', name: 'NST_NST_20250909_142829_ORU.hl7', size: '1.0 KB', date: '2025-09-09 14:28:29', device: 'NST-Device-01' },
            { id: '2', name: 'NST_NST_20250909_171459_ORU.hl7', size: '1.0 KB', date: '2025-09-09 17:14:59', device: 'NST-Device-01' },
            { id: '3', name: 'NST_NST_20250910_123044_ORU.hl7', size: '1.0 KB', date: '2025-09-10 12:30:44', device: 'NST-Device-02' },
            { id: '4', name: 'NST_NST_20250916_110005_ORU.hl7', size: '1.0 KB', date: '2025-09-16 11:00:05', device: 'NST-Device-01' },
            { id: '5', name: 'NST_NST_20250924_114016_ORU.hl7', size: '1.0 KB', date: '2025-09-24 11:40:16', device: 'NST-Device-02' }
        ];
    }

    getSimulatedDICOMFiles() {
        return [
            { id: '1', name: 'NST_NST_20250909_142829_PDF.dcm', size: '65.3 KB', date: '2025-09-09 14:28:29', device: 'NST-Device-01' },
            { id: '2', name: 'NST_NST_20250909_171459_PDF.dcm', size: '64.7 KB', date: '2025-09-09 17:14:59', device: 'NST-Device-01' },
            { id: '3', name: 'NST_NST_20250910_123044_PDF.dcm', size: '49.6 KB', date: '2025-09-10 12:30:44', device: 'NST-Device-02' },
            { id: '4', name: 'NST_NST_20250916_110005_PDF.dcm', size: '49.5 KB', date: '2025-09-16 11:00:05', device: 'NST-Device-01' },
            { id: '5', name: 'NST_NST_20250924_114016_PDF.dcm', size: '49.5 KB', date: '2025-09-24 11:40:16', device: 'NST-Device-02' }
        ];
    }

    getSimulatedPDFFiles() {
        return [
            { id: '1', name: 'NST_NST_20250909_142829.pdf', size: '64.1 KB', date: '2025-09-09 14:28:29', device: 'NST-Device-01' },
            { id: '2', name: 'NST_NST_20250909_171459.pdf', size: '63.5 KB', date: '2025-09-09 17:14:59', device: 'NST-Device-01' },
            { id: '3', name: 'NST_NST_20250910_123044.pdf', size: '48.4 KB', date: '2025-09-10 12:30:44', device: 'NST-Device-02' },
            { id: '4', name: 'NST_NST_20250916_110005.pdf', size: '48.2 KB', date: '2025-09-16 11:00:05', device: 'NST-Device-01' },
            { id: '5', name: 'NST_NST_20250924_114016.pdf', size: '48.2 KB', date: '2025-09-24 11:40:16', device: 'NST-Device-02' }
        ];
    }

    renderHL7List(container, files) {
        container.innerHTML = `
            <div class="media-list">
                <h4><i class="fas fa-exchange-alt"></i> HL7 Messages (${files.length})</h4>
                <div class="file-list">
                    ${files.map(file => `
                        <div class="file-item" data-device="${file.device}">
                            <div class="file-icon"><i class="fas fa-file-code"></i></div>
                            <div class="file-info">
                                <div class="file-name">${file.name}</div>
                                <div class="file-meta">
                                    <span><i class="fas fa-hdd"></i> ${file.size}</span>
                                    <span><i class="fas fa-calendar"></i> ${file.date}</span>
                                    <span><i class="fas fa-desktop"></i> ${file.device}</span>
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="btn-action" onclick="viewFile('${file.id}', 'hl7')" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-action" onclick="downloadFile('${file.id}', 'hl7')" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="device-filter">
                    <label>Filter by Device:</label>
                    <select onchange="filterFilesByDevice(this.value, 'hl7')">
                        <option value="all">All Devices</option>
                        <option value="NST-Device-01">NST-Device-01</option>
                        <option value="NST-Device-02">NST-Device-02</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderDICOMList(container, files) {
        container.innerHTML = `
            <div class="media-list">
                <h4><i class="fas fa-image"></i> DICOM Images (${files.length})</h4>
                <div class="file-list">
                    ${files.map(file => `
                        <div class="file-item" data-device="${file.device}">
                            <div class="file-icon"><i class="fas fa-file-medical"></i></div>
                            <div class="file-info">
                                <div class="file-name">${file.name}</div>
                                <div class="file-meta">
                                    <span><i class="fas fa-hdd"></i> ${file.size}</span>
                                    <span><i class="fas fa-calendar"></i> ${file.date}</span>
                                    <span><i class="fas fa-desktop"></i> ${file.device}</span>
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="btn-action" onclick="viewFile('${file.id}', 'dicom')" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-action" onclick="downloadFile('${file.id}', 'dicom')" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="device-filter">
                    <label>Filter by Device:</label>
                    <select onchange="filterFilesByDevice(this.value, 'dicom')">
                        <option value="all">All Devices</option>
                        <option value="NST-Device-01">NST-Device-01</option>
                        <option value="NST-Device-02">NST-Device-02</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderPDFList(container, files) {
        container.innerHTML = `
            <div class="media-list">
                <h4><i class="fas fa-file-pdf"></i> PDF Reports (${files.length})</h4>
                <div class="file-list">
                    ${files.map(file => `
                        <div class="file-item" data-device="${file.device}">
                            <div class="file-icon"><i class="fas fa-file-pdf"></i></div>
                            <div class="file-info">
                                <div class="file-name">${file.name}</div>
                                <div class="file-meta">
                                    <span><i class="fas fa-hdd"></i> ${file.size}</span>
                                    <span><i class="fas fa-calendar"></i> ${file.date}</span>
                                    <span><i class="fas fa-desktop"></i> ${file.device}</span>
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="btn-action" onclick="viewFile('${file.id}', 'pdf')" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-action" onclick="downloadFile('${file.id}', 'pdf')" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="device-filter">
                    <label>Filter by Device:</label>
                    <select onchange="filterFilesByDevice(this.value, 'pdf')">
                        <option value="all">All Devices</option>
                        <option value="NST-Device-01">NST-Device-01</option>
                        <option value="NST-Device-02">NST-Device-02</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderAlertsList(container, alerts) {
        container.innerHTML = `
            <div class="media-list">
                <h4><i class="fas fa-bell"></i> Security Alerts (${alerts.length})</h4>
                <div class="alert-list">
                    ${alerts.map(alert => `
                        <div class="alert-item ${alert.level.toLowerCase()}">
                            <div class="alert-icon">
                                <i class="fas fa-${alert.level === 'CRITICAL' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                            </div>
                            <div class="alert-info">
                                <div class="alert-message">${alert.message}</div>
                                <div class="alert-meta">
                                    <span><i class="fas fa-user"></i> ${alert.user || 'Unknown'}</span>
                                    <span><i class="fas fa-desktop"></i> ${alert.device || 'Unknown'}</span>
                                    <span><i class="fas fa-clock"></i> ${this.formatTime(alert.timestamp)}</span>
                                </div>
                            </div>
                            <div class="alert-level ${alert.level.toLowerCase()}">${alert.level}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateMediaTabCounts() {
        // Update HL7 count
        const hl7Tab = document.querySelector('[data-media="hl7"] .tab-count');
        if (hl7Tab) hl7Tab.textContent = this.getSimulatedHL7Files().length;
        
        // Update DICOM count
        const dicomTab = document.querySelector('[data-media="dicom"] .tab-count');
        if (dicomTab) dicomTab.textContent = this.getSimulatedDICOMFiles().length;
        
        // Update PDF count
        const pdfTab = document.querySelector('[data-media="reports"] .tab-count');
        if (pdfTab) pdfTab.textContent = this.getSimulatedPDFFiles().length;
        
        // Update Alerts count
        const alertsTab = document.querySelector('[data-media="alerts"] .tab-count');
        if (alertsTab) {
            const alertCount = this.logs.filter(log => 
                log.level === 'ERROR' || log.level === 'CRITICAL' || 
                log.eventType.includes('SECURITY') || log.eventType.includes('ACCESS_DENIED')
            ).length;
            alertsTab.textContent = alertCount;
        }
    }

    refreshData() {
        this.loadSampleData();
        this.updateCharts();
    }

    openSettings() {
        console.log('Opening settings...');
    }

    exportData() {
        const data = {
            logs: this.filteredLogs,
            stats: this.stats,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `audit-trail-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    exportSelectedLogs() {
        if (this.selectedLogs.size === 0) {
            alert('Please select logs to export');
            return;
        }

        const selectedLogsData = this.filteredLogs.filter(log => 
            this.selectedLogs.has(log.id)
        );

        const dataStr = JSON.stringify(selectedLogsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `selected-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    closeModal() {
        document.getElementById('media-modal').classList.remove('active');
    }

    closeDetailPanel() {
        document.getElementById('detail-panel').classList.remove('active');
    }

    changeTimelineZoom(zoom) {
        // Update timeline zoom buttons
        document.querySelectorAll('.timeline-controls .btn-small').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-zoom="${zoom}"]`).classList.add('active');

        console.log(`Timeline zoom changed to: ${zoom}`);
    }

    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
        }
        
        return labels;
    }

    generateRandomData(count) {
        return Array.from({ length: count }, () => Math.floor(Math.random() * 50) + 10);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnterpriseAuditDashboard();
});

// Add CSS for activity level colors and media viewer
const style = document.createElement('style');
style.textContent = `
    .activity-info { color: var(--success); }
    .activity-warning { color: var(--warning); }
    .activity-error { color: var(--error); }
    .activity-critical { color: var(--critical); }
    
    .media-list { padding: 1rem; }
    .file-list { margin: 1rem 0; }
    .file-item { 
        display: flex; 
        align-items: center; 
        padding: 0.75rem; 
        border: 1px solid var(--border-light); 
        border-radius: 0.5rem; 
        margin-bottom: 0.5rem; 
        background: var(--bg-primary);
    }
    .file-icon { 
        width: 40px; 
        height: 40px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: var(--bg-tertiary); 
        border-radius: 0.5rem; 
        margin-right: 1rem; 
    }
    .file-info { flex: 1; }
    .file-name { font-weight: 600; margin-bottom: 0.25rem; }
    .file-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-secondary); }
    .file-actions { display: flex; gap: 0.5rem; }
    .device-filter { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light); }
    .device-filter label { font-weight: 600; margin-right: 0.5rem; }
    .device-filter select { padding: 0.25rem; border: 1px solid var(--border-medium); border-radius: 0.25rem; }
    .alert-list { margin: 1rem 0; }
    .alert-item { 
        display: flex; 
        align-items: center; 
        padding: 1rem; 
        border-radius: 0.5rem; 
        margin-bottom: 0.5rem; 
        background: var(--bg-primary);
    }
    .alert-item.error { border-left: 4px solid var(--error); }
    .alert-item.critical { border-left: 4px solid var(--critical); background: #fef2f2; }
    .alert-icon { margin-right: 1rem; }
    .alert-info { flex: 1; }
    .alert-message { font-weight: 600; margin-bottom: 0.25rem; }
    .alert-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-secondary); }
    .alert-level { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .alert-level.error { background: var(--error); color: white; }
    .alert-level.critical { background: var(--critical); color: white; }
`;
document.head.appendChild(style);

// Global functions for media viewer
window.viewFile = function(id, type) {
    console.log(`Viewing ${type} file:`, id);
    // In real implementation, this would open the file in a viewer
    alert(`Viewing ${type} file: ${id}`);
};

window.downloadFile = function(id, type) {
    console.log(`Downloading ${type} file:`, id);
    // In real implementation, this would download the file
    alert(`Downloading ${type} file: ${id}`);
};

window.filterFilesByDevice = function(device, type) {
    console.log(`Filtering ${type} files by device:`, device);
    const fileItems = document.querySelectorAll(`.file-item[data-device]`);
    fileItems.forEach(item => {
        if (device === 'all' || item.getAttribute('data-device') === device) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};
