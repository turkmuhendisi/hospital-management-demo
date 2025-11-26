// Enterprise Audit Trail Dashboard JavaScript - Version 2.0
// Production-ready with WebSocket support and new backend API

class EnterpriseAuditDashboard {
    constructor() {
        // Configuration - Use current URL protocol and host (Railway uses HTTPS without port)
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const currentHost = window.location.host; // includes port if any
        this.apiBaseUrl = `${protocol}//${currentHost}/api`;
        this.socketUrl = `${wsProtocol}//${currentHost}`;
        
        // State
        this.isRealTime = true;
        this.selectedHospital = 'all';
        this.selectedClinic = 'all';
        this.currentContentTab = 'dashboard';
        this.currentMediaTab = 'logs';
        this.logs = [];
        this.filteredLogs = [];
        this.selectedLogs = new Set();
        
        // Stats
        this.stats = {
            totalEvents: 0,
            activeUsers: 0,
            activeDevices: 0,
            patientCount: 0,
            securityEvents: 0,
            eventsPerHour: 0,
            systemHealth: 99.9,
        };
        
        // Entities cache
        this.hospitals = [];
        this.users = [];
        this.devices = [];
        this.patients = [];
        
        // Charts
        this.charts = {};
        
        // Monitoring charts for real-time vital signs
        this.monitoringCharts = {};
        this.monitoringData = {}; // Real-time data storage
        this.monitoringInterval = null;
        
        // Socket.IO client
        this.socket = null;
        
        // Initialize
        this.initializeEventListeners();
        this.initializeWebSocket();
        
        // Wait for Chart.js then load data
        this.waitForChartJS().then(() => {
            this.initializeCharts();
            this.loadInitialData();
        }).catch(() => {
            console.warn('Chart.js failed to load');
            this.loadInitialData();
        });
    }

    // ===== INITIALIZATION =====

    waitForChartJS() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const checkChart = () => {
                if (typeof Chart !== 'undefined' && Chart.Chart) {
                    console.log('Chart.js loaded');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Chart.js failed to load'));
                } else {
                    attempts++;
                    setTimeout(checkChart, 100);
                }
            };
            
            checkChart();
        });
    }

    initializeWebSocket() {
        console.log('Initializing WebSocket connection...');
        
        try {
            this.socket = io(this.socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10
            });
            
            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected');
                this.updateConnectionStatus(true);
                
                // Subscribe to logs
                this.socket.emit('subscribe_logs', {});
            });
            
            this.socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
                this.updateConnectionStatus(false);
            });
            
            this.socket.on('new_log', (logData) => {
                console.log('📨 New log received:', logData);
                this.handleNewLog(logData);
            });
            
            this.socket.on('connection_established', (data) => {
                console.log('Connection established:', data);
            });
            
        } catch (error) {
            console.error('WebSocket initialization error:', error);
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-status');
        const text = document.getElementById('connection-text');
        
        if (indicator && text) {
            if (connected) {
                indicator.className = 'status-indicator connected';
                text.textContent = 'Connected';
            } else {
                indicator.className = 'status-indicator';
                text.textContent = 'Disconnected';
            }
        }
    }

    handleNewLog(logData) {
        // Add to logs array
        this.logs.unshift(logData);
        
        // Keep only last 500
        if (this.logs.length > 500) {
            this.logs = this.logs.slice(0, 500);
        }
        
        // Update filtered logs if matches current filter
        if (this.selectedHospital === 'all' || logData.hospital_id === this.selectedHospital) {
            this.filteredLogs.unshift(logData);
            
            if (this.filteredLogs.length > 200) {
                this.filteredLogs = this.filteredLogs.slice(0, 200);
            }
        }
        
        // Update UI
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
        
        if (this.charts.activityOverview) {
            this.updateCharts();
        }
    }

    initializeEventListeners() {
        // Hospital selector (removed - single hospital only)
        // All data is for Ankara Şehir Hastanesi

        // Navigation controls
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.refreshData());
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportData());
        
        // Monitoring card click event delegation
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.monitoring-card');
            if (card) {
                const deviceId = card.id.replace('monitoring-card-', '');
                if (deviceId) {
                    this.toggleMonitoringCard(deviceId);
                }
            }
        });
        
        // Clinic filter
        document.getElementById('clinic-filter')?.addEventListener('change', (e) => {
            this.selectedClinic = e.target.value;
            this.renderMonitoringDevices();
        });

        // Content tabs
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchContentTab(e.target.closest('.content-tab').dataset.content);
            });
        });

        // Media tabs
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMediaTab(e.target.closest('.media-tab').dataset.media);
            });
        });

        // Real-time toggle
        document.getElementById('real-time-toggle')?.addEventListener('click', () => {
            this.toggleRealTime();
        });

        // Monitoring devices button in nav
        document.getElementById('monitoring-devices-btn')?.addEventListener('click', () => {
            this.switchContentTab('monitoring');
        });

        // Search functionality
        this.initializeSearch();

        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // Detail panel close button
        document.querySelector('.detail-close')?.addEventListener('click', () => {
            this.closeDetailPanel();
        });

        // Close detail panel when clicking outside
        document.getElementById('detail-panel')?.addEventListener('click', (e) => {
            if (e.target.id === 'detail-panel') {
                this.closeDetailPanel();
            }
        });
    }

    initializeSearch() {
        // Doctor search
        const doctorSearch = document.getElementById('doctor-search');
        if (doctorSearch) {
            let debounceTimer;
            doctorSearch.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.searchDoctors(e.target.value), 300);
            });
        }

        // Device search
        const deviceSearch = document.getElementById('device-search');
        if (deviceSearch) {
            let debounceTimer;
            deviceSearch.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.searchDevices(e.target.value), 300);
            });
        }

        // Patient search
        const patientSearch = document.getElementById('patient-search');
        if (patientSearch) {
            let debounceTimer;
            patientSearch.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.searchPatients(e.target.value), 300);
            });
        }

        // Date range
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        
        startDate?.addEventListener('change', () => this.applyDateFilter());
        endDate?.addEventListener('change', () => this.applyDateFilter());
    }

    // ===== API CALLS =====

    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async loadInitialData() {
        console.log('Loading initial data...');
        
        try {
            // Load hospitals
            this.hospitals = await this.fetchAPI('/hospitals');
            console.log('Loaded hospitals:', this.hospitals.length);
            
            // Load logs
            await this.loadLogs();
            
            // Load stats
            await this.loadStats();
            
            // Load entities
            await Promise.all([
                this.loadUsers(),
                this.loadDevices(),
                this.loadPatients()
            ]);
            
            console.log('✅ Initial data loaded');
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    async loadLogs() {
        try {
            const params = new URLSearchParams();
            if (this.selectedHospital !== 'all') {
                params.append('hospital_id', this.selectedHospital);
            }
            params.append('limit', '1000');
            
            this.logs = await this.fetchAPI(`/logs?${params.toString()}`);
            this.filteredLogs = [...this.logs];
            
            console.log('Loaded logs:', this.logs.length);
            
            this.renderRecentActivity();
            this.renderLogEntries();
            this.updateCharts();
            
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    async loadStats() {
        try {
            const params = new URLSearchParams();
            if (this.selectedHospital !== 'all') {
                params.append('hospital_id', this.selectedHospital);
            }
            
            this.stats = await this.fetchAPI(`/stats/dashboard?${params.toString()}`);
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async loadUsers() {
        try {
            this.users = await this.fetchAPI('/users');
            console.log('Loaded users:', this.users.length);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async loadDevices() {
        try {
            this.devices = await this.fetchAPI('/devices');
            console.log('Loaded devices:', this.devices.length);
            
            // Update monitoring devices count after loading
            this.updateMonitoringCount();
        } catch (error) {
            console.error('Failed to load devices:', error);
        }
    }

    async loadPatients() {
        try {
            this.patients = await this.fetchAPI('/patients');
            console.log('Loaded patients:', this.patients.length);
        } catch (error) {
            console.error('Failed to load patients:', error);
        }
    }

    // ===== SEARCH =====

    async searchDoctors(query) {
        if (!query.trim()) {
            document.getElementById('doctor-results').innerHTML = '';
            return;
        }

        try {
            const results = await this.fetchAPI(`/search/doctors?q=${encodeURIComponent(query)}`);
            this.renderSearchResults('doctor-results', results, 'doctor');
        } catch (error) {
            console.error('Search doctors failed:', error);
        }
    }

    async searchDevices(query) {
        if (!query.trim()) {
            document.getElementById('device-results').innerHTML = '';
            return;
        }

        try {
            const results = await this.fetchAPI(`/search/devices?q=${encodeURIComponent(query)}`);
            this.renderSearchResults('device-results', results, 'device');
        } catch (error) {
            console.error('Search devices failed:', error);
        }
    }

    async searchPatients(query) {
        if (!query.trim()) {
            document.getElementById('patient-results').innerHTML = '';
            return;
        }

        try {
            const results = await this.fetchAPI(`/search/patients?q=${encodeURIComponent(query)}`);
            this.renderSearchResults('patient-results', results, 'patient');
        } catch (error) {
            console.error('Search patients failed:', error);
        }
    }

    renderSearchResults(containerId, results, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div style="font-weight: 500;">${result.name || result.id}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    ${result.department || result.type || result.gender || ''}
                    ${result.hospital_id ? ` • ${result.hospital_id}` : ''}
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
            this.filterLogsByUser(result.id);
        } else if (type === 'device') {
            this.filterLogsByDevice(result.id);
        } else if (type === 'patient') {
            this.filterLogsByPatient(result.id);
        }
    }

    // ===== FILTERS =====

    filterLogsByHospital() {
        if (this.selectedHospital === 'all') {
            this.filteredLogs = [...this.logs];
        } else {
            this.filteredLogs = this.logs.filter(log => log.hospital_id === this.selectedHospital);
        }
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    filterLogsByUser(userId) {
        this.filteredLogs = this.logs.filter(log => log.user_id === userId);
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    filterLogsByDevice(deviceId) {
        this.filteredLogs = this.logs.filter(log => log.device_id === deviceId);
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    filterLogsByPatient(patientId) {
        this.filteredLogs = this.logs.filter(log => log.patient_id === patientId);
        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    applyFilter(filter) {
        // Update filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

        // Apply filter
        if (filter === 'all') {
            this.filteredLogs = [...this.logs];
        } else if (filter === 'critical') {
            this.filteredLogs = this.logs.filter(log => log.level === 'CRITICAL');
        } else if (filter === 'security') {
            this.filteredLogs = this.logs.filter(log => 
                log.event_type.includes('SECURITY') || log.event_type.includes('ACCESS_DENIED')
            );
        } else if (filter === 'patient-access') {
            this.filteredLogs = this.logs.filter(log => log.event_type.includes('PATIENT'));
        } else if (filter === 'device-operations') {
            this.filteredLogs = this.logs.filter(log => log.event_type.includes('DEVICE'));
        }

        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    applyDateFilter() {
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;

        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);

        this.filteredLogs = this.logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
        });

        this.updateStats();
        this.renderRecentActivity();
        this.renderLogEntries();
    }

    // ===== CHARTS =====

    initializeCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping charts');
            return;
        }
        
        // Activity overview chart
        const activityCtx = document.getElementById('activity-overview-chart');
        if (activityCtx) {
            this.charts.activityOverview = new Chart(activityCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Events',
                        data: [],
                        borderColor: '#1e40af',
                        backgroundColor: 'rgba(30, 64, 175, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Event types chart
        const eventTypesCtx = document.getElementById('event-types-chart');
        if (eventTypesCtx) {
            this.charts.eventTypes = new Chart(eventTypesCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#1e40af', '#059669', '#d97706', '#dc2626', '#64748b',
                            '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        // Sidebar activity chart
        const sidebarActivityCtx = document.getElementById('activity-chart');
        if (sidebarActivityCtx) {
            this.charts.activity = new Chart(sidebarActivityCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: '#1e40af',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    }

    async updateCharts() {
        if (!this.charts.activityOverview) return;

        try {
            // Load activity data from API
            const activityData = await this.fetchAPI('/analytics/activity?hours=24');
            
            if (activityData && activityData.length > 0) {
                const labels = activityData.map(d => {
                    const date = new Date(d.hour);
                    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                });
                const data = activityData.map(d => d.count);
                
                this.charts.activityOverview.data.labels = labels;
                this.charts.activityOverview.data.datasets[0].data = data;
                this.charts.activityOverview.update();
            }

            // Update event types chart
            const eventDist = await this.fetchAPI('/analytics/event-distribution');
            
            if (eventDist && eventDist.length > 0) {
                this.charts.eventTypes.data.labels = eventDist.map(d => d.event_type);
                this.charts.eventTypes.data.datasets[0].data = eventDist.map(d => d.count);
                this.charts.eventTypes.update();
            }

        } catch (error) {
            console.error('Failed to update charts:', error);
        }
    }

    // ===== STATS AND UI UPDATES =====

    updateStats() {
        // Calculate from current filtered logs
        const totalEvents = this.filteredLogs.length;
        const uniqueUsers = new Set(this.filteredLogs.map(log => log.user_id).filter(Boolean)).size;
        const securityEvents = this.filteredLogs.filter(log => 
            log.level === 'ERROR' || log.level === 'CRITICAL' || 
            log.event_type.includes('SECURITY')
        ).length;

        // Update UI
        document.getElementById('total-events').textContent = this.stats.totalEvents || totalEvents;
        document.getElementById('active-users').textContent = this.stats.activeUsers || uniqueUsers;
        document.getElementById('security-events').textContent = this.stats.securityEvents || securityEvents;
        
        // System Health - ensure it's defined and formatted correctly
        const systemHealth = this.stats.systemHealth !== undefined ? this.stats.systemHealth : 99.9;
        document.getElementById('system-health').textContent = `${systemHealth}%`;
        
        // Calculate monitoring devices count
        const monitoringDevices = this.devices.filter(device => 
            device.type && (
                device.type.toUpperCase().includes('MONITOR') || 
                device.type.toUpperCase().includes('VENTILATOR') || 
                device.type.toUpperCase().includes('VITAL')
            )
        );
        
        // Nav stats
        document.getElementById('nav-user-count').textContent = this.stats.activeUsers || uniqueUsers;
        document.getElementById('nav-device-count').textContent = monitoringDevices.length;
        document.getElementById('nav-patient-count').textContent = this.stats.patientCount || 0;
        document.getElementById('nav-alert-count').textContent = this.stats.securityEvents || securityEvents;
        
        // Status bar
        document.getElementById('status-event-count').textContent = this.stats.totalEvents || totalEvents;
        document.getElementById('status-event-rate').textContent = `${this.stats.eventsPerHour || 0}/hour`;
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
            if (!template) return;
            
            const clone = template.content.cloneNode(true);
            const item = clone.querySelector('.activity-item');

            item.querySelector('.activity-message').textContent = log.message;
            item.querySelector('.activity-time').textContent = this.formatTime(log.timestamp);
            item.querySelector('.activity-user').textContent = this.getUserName(log.user_id) || 'Unknown';
            item.querySelector('.activity-device').textContent = this.getDeviceName(log.device_id) || 'Unknown';

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
        
        this.filteredLogs.slice(0, 100).forEach(log => {
            const template = document.getElementById('log-entry-template');
            if (!template) return;
            
            const clone = template.content.cloneNode(true);
            const entry = clone.querySelector('.log-entry');

            entry.setAttribute('data-level', log.level);
            entry.setAttribute('data-type', log.event_type);
            entry.setAttribute('data-log-id', log.id);

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
            const floorContext = entry.querySelector('.context-item.floor-context');
            const clinicContext = entry.querySelector('.context-item.clinic-context');
            const unitContext = entry.querySelector('.context-item.unit-context');
            const roomContext = entry.querySelector('.context-item.room-context');
            const terminalContext = entry.querySelector('.context-item.terminal-context');

            if (log.user_id) {
                userContext.style.display = 'flex';
                userContext.querySelector('.context-value').textContent = this.getUserName(log.user_id);
            } else {
                userContext.style.display = 'none';
            }

            if (log.device_id) {
                deviceContext.style.display = 'flex';
                deviceContext.querySelector('.context-value').textContent = this.getDeviceName(log.device_id);
            } else {
                deviceContext.style.display = 'none';
            }

            if (log.patient_id) {
                patientContext.style.display = 'flex';
                patientContext.querySelector('.context-value').textContent = log.patient_id;
            } else {
                patientContext.style.display = 'none';
            }

            // Location information - each field separately
            if (log.details && log.details.location) {
                const loc = log.details.location;
                
                if (loc.floor) {
                    floorContext.style.display = 'flex';
                    floorContext.querySelector('.context-value').textContent = loc.floor;
                } else {
                    floorContext.style.display = 'none';
                }
                
                if (loc.clinic) {
                    clinicContext.style.display = 'flex';
                    clinicContext.querySelector('.context-value').textContent = loc.clinic;
                } else {
                    clinicContext.style.display = 'none';
                }
                
                if (loc.unit) {
                    unitContext.style.display = 'flex';
                    unitContext.querySelector('.context-value').textContent = loc.unit;
                } else {
                    unitContext.style.display = 'none';
                }
                
                if (loc.room_number) {
                    roomContext.style.display = 'flex';
                    roomContext.querySelector('.context-value').textContent = loc.room_number;
                } else {
                    roomContext.style.display = 'none';
                }
                
                if (loc.workstation) {
                    terminalContext.style.display = 'flex';
                    terminalContext.querySelector('.context-value').textContent = loc.workstation;
                } else {
                    terminalContext.style.display = 'none';
                }
            } else {
                floorContext.style.display = 'none';
                clinicContext.style.display = 'none';
                unitContext.style.display = 'none';
                roomContext.style.display = 'none';
                terminalContext.style.display = 'none';
            }

            // Add click handler to view details button
            const viewDetailsBtn = entry.querySelector('.btn-action[title="View Details"]');
            if (viewDetailsBtn) {
                viewDetailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showLogDetails(log);
                });
            }

            // Also make the entire entry clickable
            entry.style.cursor = 'pointer';
            entry.addEventListener('click', () => {
                this.showLogDetails(log);
            });

            container.appendChild(entry);
        });
    }

    showLogDetails(log) {
        const detailPanel = document.getElementById('detail-panel');
        const detailContent = detailPanel.querySelector('.detail-content');
        
        if (!detailPanel || !detailContent) return;

        // Build detail HTML
        const user = this.users.find(u => u.id === log.user_id);
        const device = this.devices.find(d => d.id === log.device_id);
        const hospital = this.hospitals.find(h => h.id === log.hospital_id);

        const detailHTML = `
            <div style="padding: 1rem;">
                <!-- Header -->
                <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-light);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span class="level-icon ${log.level}" style="width: 12px; height: 12px; border-radius: 50%;"></span>
                        <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">${log.level}</span>
                        <span style="color: var(--text-muted); margin-left: auto; font-size: 0.75rem;">${log.event_type}</span>
                    </div>
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">Etkinlik Detayları</h4>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">ID: ${log.id}</p>
                </div>

                <!-- Message -->
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Mesaj</label>
                    <p style="color: var(--text-primary); font-size: 0.9375rem; line-height: 1.5; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid var(--primary);">${log.message}</p>
                </div>

                <!-- Timestamp -->
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">Zaman Damgası</label>
                    <p style="color: var(--text-primary); font-family: 'Monaco', monospace; font-size: 0.875rem;">${new Date(log.timestamp).toLocaleString('tr-TR')}</p>
                </div>

                <!-- User Info -->
                ${user ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-user" style="margin-right: 0.25rem;"></i> Kullanıcı
                    </label>
                    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                        <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${user.name}</p>
                        <p style="font-size: 0.8125rem; color: var(--text-secondary);">${user.role} • ${user.specialty || 'N/A'}</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">ID: ${user.id}</p>
                    </div>
                </div>
                ` : ''}

                <!-- Device Info -->
                ${device ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-desktop" style="margin-right: 0.25rem;"></i> Cihaz
                    </label>
                    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                        <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${device.name}</p>
                        <p style="font-size: 0.8125rem; color: var(--text-secondary);">${device.type} • ${device.modality || 'N/A'}</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">IP: ${device.ip_address || 'N/A'}</p>
                    </div>
                </div>
                ` : ''}

                <!-- Live Monitoring (if vital signs available) -->
                ${log.details && log.details.vital_signs ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-heartbeat" style="margin-right: 0.25rem; color: #ef4444;"></i> Canlı Hasta İzleme
                    </label>
                    <div style="background: #1a1a2e; padding: 1rem; border-radius: var(--radius-lg); border: 2px solid #2d3748;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                            <!-- Heart Rate -->
                            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: var(--radius); padding: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                    <span style="color: #fca5a5; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;">HR</span>
                                    <i class="fas fa-heart" style="color: #ef4444; font-size: 0.875rem;"></i>
                                </div>
                                <div style="color: #fef2f2; font-size: 2rem; font-weight: 700; font-family: 'Monaco', monospace; text-align: center;">
                                    ${log.details.vital_signs.heart_rate}
                                </div>
                                <div style="color: #fca5a5; font-size: 0.625rem; text-align: center;">bpm</div>
                            </div>

                            <!-- Blood Pressure -->
                            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #dc2626; border-radius: var(--radius); padding: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                    <span style="color: #fca5a5; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;">BP</span>
                                    <i class="fas fa-tint" style="color: #dc2626; font-size: 0.875rem;"></i>
                                </div>
                                <div style="color: #fef2f2; font-size: 1.5rem; font-weight: 700; font-family: 'Monaco', monospace; text-align: center;">
                                    ${log.details.vital_signs.blood_pressure_systolic}/${log.details.vital_signs.blood_pressure_diastolic}
                                </div>
                                <div style="color: #fca5a5; font-size: 0.625rem; text-align: center;">mmHg</div>
                            </div>

                            <!-- SpO2 -->
                            <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid #06b6d4; border-radius: var(--radius); padding: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                    <span style="color: #67e8f9; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;">SpO₂</span>
                                    <i class="fas fa-lungs" style="color: #06b6d4; font-size: 0.875rem;"></i>
                                </div>
                                <div style="color: #cffafe; font-size: 2rem; font-weight: 700; font-family: 'Monaco', monospace; text-align: center;">
                                    ${log.details.vital_signs.spo2}
                                </div>
                                <div style="color: #67e8f9; font-size: 0.625rem; text-align: center;">%</div>
                            </div>

                            <!-- Respiratory Rate -->
                            <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid #eab308; border-radius: var(--radius); padding: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                    <span style="color: #fde047; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;">RESP</span>
                                    <i class="fas fa-wind" style="color: #eab308; font-size: 0.875rem;"></i>
                                </div>
                                <div style="color: #fefce8; font-size: 2rem; font-weight: 700; font-family: 'Monaco', monospace; text-align: center;">
                                    ${log.details.vital_signs.respiratory_rate}
                                </div>
                                <div style="color: #fde047; font-size: 0.625rem; text-align: center;">/min</div>
                            </div>
                        </div>
                        
                        <!-- Status Bar -->
                        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #2d3748; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
                                <span style="color: #10b981; font-size: 0.75rem; font-weight: 600;">İZLEME AKTİF</span>
                            </div>
                            <div style="color: #9ca3af; font-size: 0.75rem; font-family: 'Monaco', monospace;">
                                ${new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Hospital Info -->
                ${hospital ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-hospital" style="margin-right: 0.25rem;"></i> Hastane
                    </label>
                    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                        <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${hospital.name}</p>
                        <p style="font-size: 0.8125rem; color: var(--text-secondary);">${hospital.city}, ${hospital.country}</p>
                    </div>
                </div>
                ` : ''}

                <!-- Location Info -->
                ${log.details && log.details.location ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-map-marker-alt" style="margin-right: 0.25rem;"></i> Lokasyon Bilgileri
                    </label>
                    <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius); border-left: 3px solid #10b981;">
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Kat:</span>
                            <span style="color: var(--text-primary); font-weight: 700;">${log.details.location.floor}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Poliklinik:</span>
                            <span style="color: var(--text-primary); font-weight: 700;">${log.details.location.clinic}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Birim:</span>
                            <span style="color: var(--text-primary); font-weight: 700;">${log.details.location.unit}</span>
                        </div>
                        ${log.details.location.room_number ? `
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Oda No:</span>
                            <span style="color: var(--text-primary);">${log.details.location.room_number}</span>
                        </div>
                        ` : ''}
                        ${log.details.location.bed_number ? `
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Yatak:</span>
                            <span style="color: var(--text-primary);">${log.details.location.bed_number}</span>
                        </div>
                        ` : ''}
                        ${log.details.location.workstation ? `
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Terminal:</span>
                            <span style="color: var(--text-primary); font-family: 'Monaco', monospace;">${log.details.location.workstation}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Patient ID (if exists) -->
                ${log.patient_id ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-user-injured" style="margin-right: 0.25rem;"></i> Patient
                    </label>
                    <p style="color: var(--text-primary); font-family: 'Monaco', monospace; font-size: 0.875rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">${log.patient_id}</p>
                </div>
                ` : ''}

                <!-- DICOM/HL7 Metadata -->
                ${log.details && (log.details.accession_number || log.details.hl7_message_id) ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-barcode" style="margin-right: 0.25rem;"></i> Medical Imaging Identifiers
                    </label>
                    <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius); border-left: 3px solid #3b82f6;">
                        ${log.details.accession_number ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Accession Number:</span>
                            <span style="color: var(--text-primary); font-family: 'Monaco', monospace; font-weight: 700;">${log.details.accession_number}</span>
                        </div>
                        ` : ''}
                        ${log.details.study_instance_uid ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.75rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Study UID:</span>
                            <span style="color: var(--text-muted); font-family: 'Monaco', monospace;">${log.details.study_instance_uid}</span>
                        </div>
                        ` : ''}
                        ${log.details.series_instance_uid ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.75rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Series UID:</span>
                            <span style="color: var(--text-muted); font-family: 'Monaco', monospace;">${log.details.series_instance_uid}</span>
                        </div>
                        ` : ''}
                        ${log.details.hl7_message_id ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">HL7 Message ID:</span>
                            <span style="color: var(--text-primary); font-family: 'Monaco', monospace; font-weight: 700;">${log.details.hl7_message_id}</span>
                        </div>
                        ` : ''}
                        ${log.details.hl7_message_type ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">HL7 Type:</span>
                            <span style="color: var(--text-primary); font-family: 'Monaco', monospace;">${log.details.hl7_message_type}</span>
                        </div>
                        ` : ''}
                        ${log.details.modality ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Modality:</span>
                            <span style="color: var(--text-primary); font-weight: 600;">${log.details.modality}</span>
                        </div>
                        ` : ''}
                        ${log.details.body_part_examined ? `
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; font-size: 0.8125rem;">
                            <span style="color: var(--text-secondary); font-weight: 600;">Body Part:</span>
                            <span style="color: var(--text-primary);">${log.details.body_part_examined}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Other Metadata -->
                ${log.details && Object.keys(log.details).filter(key => 
                    !['accession_number', 'study_instance_uid', 'series_instance_uid', 'hl7_message_id', 'hl7_message_type', 
                      'modality', 'body_part_examined', 'vital_signs', 'patient_id', 'study_date', 'study_time', 
                      'referring_physician', 'series_count', 'instance_count', 'sending_application', 'sending_facility',
                      'receiving_application', 'report_status', 'event_type', 'timestamp'].includes(key)
                ).length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                        <i class="fas fa-info-circle" style="margin-right: 0.25rem;"></i> Additional Info
                    </label>
                    <pre style="color: var(--text-primary); font-size: 0.7rem; background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius); overflow-x: auto; font-family: 'Monaco', monospace; max-height: 200px;">${JSON.stringify(log.details, null, 2)}</pre>
                </div>
                ` : ''}

                <!-- Actions -->
                <div style="display: flex; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                    <button onclick="navigator.clipboard.writeText('${log.id}')" style="flex: 1; padding: 0.5rem 1rem; border: 1px solid var(--border-medium); background: var(--bg-primary); color: var(--text-primary); border-radius: var(--radius); cursor: pointer; font-size: 0.8125rem; font-weight: 500;">
                        <i class="fas fa-copy"></i> Copy ID
                    </button>
                    <button onclick="window.print()" style="flex: 1; padding: 0.5rem 1rem; border: 1px solid var(--border-medium); background: var(--bg-primary); color: var(--text-primary); border-radius: var(--radius); cursor: pointer; font-size: 0.8125rem; font-weight: 500;">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
        `;

        detailContent.innerHTML = detailHTML;
        detailPanel.classList.add('active');
    }

    closeDetailPanel() {
        const detailPanel = document.getElementById('detail-panel');
        if (detailPanel) {
            detailPanel.classList.remove('active');
        }
    }

    // ===== HELPERS =====

    getUserName(userId) {
        const user = this.users.find(u => u.id === userId);
        return user ? user.name : userId;
    }

    getPatientName(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        return patient ? patient.name : patientId;
    }

    getDeviceName(deviceId) {
        const device = this.devices.find(d => d.id === deviceId);
        return device ? device.name : deviceId;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // ===== UI CONTROLS =====

    switchContentTab(tabName) {
        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-content="${tabName}"]`)?.classList.add('active');

        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`)?.classList.add('active');

        // Stop monitoring charts if leaving monitoring tab
        if (this.currentContentTab === 'monitoring' && tabName !== 'monitoring') {
            this.stopRealTimeMonitoring();
        }

        this.currentContentTab = tabName;
        
        // Show/hide sidebar based on tab
        const sidebar = document.querySelector('.sidebar');
        const mainLayout = document.querySelector('.main-layout');
        if (sidebar && mainLayout) {
            if (tabName === 'dashboard') {
                sidebar.style.display = 'block';
                mainLayout.style.gridTemplateColumns = '280px 1fr';
            } else {
                sidebar.style.display = 'none';
                mainLayout.style.gridTemplateColumns = '1fr';
            }
        }

        if (tabName === 'analytics') {
            this.loadAnalyticsData();
        } else if (tabName === 'timeline') {
            this.loadTimelineData();
        } else if (tabName === 'monitoring') {
            this.renderMonitoringDevices();
        } else if (tabName === 'activity') {
            this.initActivityView();
        }
    }

    switchMediaTab(tabName) {
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-media="${tabName}"]`)?.classList.add('active');

        this.currentMediaTab = tabName;
    }

    toggleRealTime() {
        this.isRealTime = !this.isRealTime;
        const button = document.getElementById('real-time-toggle');
        
        if (this.isRealTime) {
            button?.classList.add('active');
            button.innerHTML = '<i class="fas fa-play"></i> Real-time';
        } else {
            button?.classList.remove('active');
            button.innerHTML = '<i class="fas fa-pause"></i> Paused';
        }
    }

    async refreshData() {
        console.log('Refreshing data...');
        await this.loadInitialData();
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

    toggleMonitoringCard(deviceId) {
        // Open fullscreen modal instead of expanding card
        this.openMonitoringModal(deviceId);
    }
    
    openMonitoringModal(deviceId) {
        const device = this.devices.find(d => d.id === deviceId);
        if (!device) return;
        
        // Get latest log for this device
        const latestLog = this.logs
            .filter(log => log.device_id === device.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        const vitalSigns = latestLog?.details?.vital_signs;
        const isOnline = !!vitalSigns;
        
        // Get patient and doctor info
        const patientId = latestLog?.patient_id;
        const userId = latestLog?.user_id;
        const patient = patientId ? this.patients.find(p => p.id === patientId) : null;
        const user = userId ? this.users.find(u => u.id === userId) : null;
        
        const patientName = patient?.name || null;
        const patientFullId = patient?.id || 'N/A';
        const doctorName = user?.name || null;
        
        // Get location from log details
        const location = latestLog?.details?.location;
        
        const modalBody = document.getElementById('monitoring-modal-body');
        
        modalBody.innerHTML = `
            ${isOnline ? `
            <!-- Medical Monitor Display -->
            <div style="background: #0a0a0a; border-radius: 12px; padding: 0; overflow: hidden; border: 3px solid #2d2d2d;">
                <!-- Monitor Header -->
                <div style="background: #1a1a1a; padding: 1rem 1.5rem; border-bottom: 2px solid #2d2d2d;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: #00ff00; margin: 0; font-family: monospace; text-transform: uppercase;">
                            ${patientName || 'HASTA BİLGİSİ YOK'}
                        </h2>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="color: #00ff00; font-size: 0.875rem; font-family: monospace;">${device.name}</span>
                            <span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(0, 255, 0, 0.1); border: 1px solid #00ff00; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #00ff00; font-family: monospace;">
                                <span style="width: 6px; height: 6px; background: #00ff00; border-radius: 50%; animation: pulse 1.5s infinite;"></span>
                                ONLINE
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Monitor Waveforms -->
                <div style="background: #0a0a0a; padding: 1.5rem;">
                    <!-- HR Waveform -->
                    <div style="position: relative; margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: #00ff00; font-size: 0.875rem; font-weight: 700; font-family: monospace; width: 80px;">HR</span>
                            <div style="flex: 1; height: 180px; position: relative;">
                                <canvas id="modal-chart-hr-${device.id}" style="width: 100% !important; height: 100% !important;"></canvas>
                            </div>
                            <div style="text-align: right; min-width: 100px; padding-left: 1rem;">
                                <div id="modal-value-hr-${device.id}" style="color: #00ff00; font-size: 2.5rem; font-weight: 700; font-family: monospace; line-height: 1;">${vitalSigns.heart_rate}</div>
                                <div style="color: #00ff00; font-size: 0.75rem; font-family: monospace;">bpm</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- BP Waveform -->
                    <div style="position: relative; margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: #ff0000; font-size: 0.875rem; font-weight: 700; font-family: monospace; width: 80px;">ART</span>
                            <div style="flex: 1; height: 180px; position: relative;">
                                <canvas id="modal-chart-bp-${device.id}" style="width: 100% !important; height: 100% !important;"></canvas>
                            </div>
                            <div style="text-align: right; min-width: 100px; padding-left: 1rem;">
                                <div id="modal-value-bp-${device.id}" style="color: #ff0000; font-size: 2rem; font-weight: 700; font-family: monospace; line-height: 1;">${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic}</div>
                                <div style="color: #ff0000; font-size: 0.75rem; font-family: monospace;">mmHg</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- SpO2 Waveform -->
                    <div style="position: relative; margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: #00ffff; font-size: 0.875rem; font-weight: 700; font-family: monospace; width: 80px;">SpO₂</span>
                            <div style="flex: 1; height: 180px; position: relative;">
                                <canvas id="modal-chart-spo2-${device.id}" style="width: 100% !important; height: 100% !important;"></canvas>
                            </div>
                            <div style="text-align: right; min-width: 100px; padding-left: 1rem;">
                                <div id="modal-value-spo2-${device.id}" style="color: #00ffff; font-size: 2.5rem; font-weight: 700; font-family: monospace; line-height: 1;">${vitalSigns.spo2}</div>
                                <div style="color: #00ffff; font-size: 0.75rem; font-family: monospace;">%</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- RESP Waveform -->
                    <div style="position: relative;">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: #ffff00; font-size: 0.875rem; font-weight: 700; font-family: monospace; width: 80px;">RESP</span>
                            <div style="flex: 1; height: 180px; position: relative;">
                                <canvas id="modal-chart-resp-${device.id}" style="width: 100% !important; height: 100% !important;"></canvas>
                            </div>
                            <div style="text-align: right; min-width: 100px; padding-left: 1rem;">
                                <div id="modal-value-resp-${device.id}" style="color: #ffff00; font-size: 2.5rem; font-weight: 700; font-family: monospace; line-height: 1;">${vitalSigns.respiratory_rate}</div>
                                <div style="color: #ffff00; font-size: 0.75rem; font-family: monospace;">/min</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ` : `
            <div style="background: rgba(156, 163, 175, 0.1); padding: 3rem; border-radius: 12px; text-align: center; margin-bottom: 2rem; border: 2px dashed #d1d5db;">
                <i class="fas fa-power-off" style="font-size: 4rem; color: #9ca3af; margin-bottom: 1rem; display: block;"></i>
                <h3 style="color: #6b7280; font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Cihaz Aktif Değil</h3>
                <p style="color: #9ca3af; font-size: 1rem;">Hasta bağlı değil • Vital signs verisi yok</p>
            </div>
            `}
            
            <!-- Patient, Doctor & Location Info at Bottom -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                <!-- Patient Info -->
                ${patientName ? `
                <div style="background: rgba(59, 130, 246, 0.05); padding: 1.5rem; border-radius: 12px; border: 2px solid rgba(59, 130, 246, 0.2);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: white; padding: 1rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-user-injured" style="color: #3b82f6; font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Hasta</div>
                            <div style="font-size: 1.125rem; color: #111827; font-weight: 700;">${patientName}</div>
                        </div>
                    </div>
                    <div style="font-size: 0.875rem; color: #6b7280; font-family: monospace; padding: 0.5rem; background: white; border-radius: 6px;">
                        ID: ${patientFullId}
                    </div>
                </div>
                ` : '<div></div>'}
                
                <!-- Doctor Info -->
                ${doctorName ? `
                <div style="background: rgba(16, 185, 129, 0.05); padding: 1.5rem; border-radius: 12px; border: 2px solid rgba(16, 185, 129, 0.2);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: white; padding: 1rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-user-md" style="color: #10b981; font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Doktor</div>
                            <div style="font-size: 1.125rem; color: #111827; font-weight: 700;">${doctorName}</div>
                        </div>
                    </div>
                </div>
                ` : '<div></div>'}
                
                <!-- Location Info -->
                ${location ? `
                <div style="background: rgba(245, 158, 11, 0.05); padding: 1.5rem; border-radius: 12px; border: 2px solid rgba(245, 158, 11, 0.2);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: white; padding: 1rem; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-map-marker-alt" style="color: #f59e0b; font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Lokasyon</div>
                            <div style="font-size: 1rem; color: #111827; font-weight: 700;">${location.clinic}</div>
                        </div>
                    </div>
                    <div style="display: grid; gap: 0.5rem; font-size: 0.875rem;">
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 6px;">
                            <span style="color: #6b7280; font-weight: 600;">Kat:</span>
                            <span style="color: #111827; font-weight: 700;">${location.floor}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 6px;">
                            <span style="color: #6b7280; font-weight: 600;">Birim:</span>
                            <span style="color: #111827; font-weight: 700;">${location.unit}</span>
                        </div>
                        ${location.room_number ? `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: white; border-radius: 6px;">
                            <span style="color: #6b7280; font-weight: 600;">Oda:</span>
                            <span style="color: #111827;">${location.room_number}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : '<div></div>'}
            </div>
        `;
        
        // Show modal
        const modal = document.getElementById('monitoring-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Initialize charts if device is online
        if (isOnline) {
            setTimeout(() => {
                this.createMedicalMonitorChart(device.id, 'hr', vitalSigns.heart_rate, '#00ff00');
                this.createMedicalMonitorChart(device.id, 'bp', vitalSigns.blood_pressure_systolic, '#ff0000');
                this.createMedicalMonitorChart(device.id, 'spo2', vitalSigns.spo2, '#00ffff');
                this.createMedicalMonitorChart(device.id, 'resp', vitalSigns.respiratory_rate, '#ffff00');
                
                // Start real-time monitoring if not already started
                if (!this.monitoringInterval) {
                    this.startRealTimeMonitoring();
                }
            }, 100);
        }
    }
    
    createMedicalMonitorChart(deviceId, type, initialValue, color) {
        const canvas = document.getElementById(`modal-chart-${type}-${deviceId}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const chartKey = `modal-${deviceId}-${type}`;
        
        // Destroy existing chart if any
        if (this.monitoringCharts[chartKey]) {
            this.monitoringCharts[chartKey].destroy();
        }
        
        // Initial data (30 seconds of data points)
        const initialData = Array(30).fill(initialValue);
        const initialLabels = Array(30).fill('');
        
        this.monitoringCharts[chartKey] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialLabels,
                datasets: [{
                    data: initialData,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        display: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: '#1a3a1a',
                            lineWidth: 1
                        },
                        ticks: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }
    
    closeMonitoringModal() {
        const modal = document.getElementById('monitoring-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Destroy modal charts
        Object.keys(this.monitoringCharts).forEach(key => {
            if (key.startsWith('modal-')) {
                this.monitoringCharts[key].destroy();
                delete this.monitoringCharts[key];
            }
        });
        
        // Clear modal content
        document.getElementById('monitoring-modal-body').innerHTML = '';
    }
    
    reflowMonitoringGrid() {
        const grid = document.querySelector('.monitoring-grid');
        if (!grid) return;
        
        // Get grid gap and row height
        const gridComputedStyle = window.getComputedStyle(grid);
        const rowGap = parseInt(gridComputedStyle.getPropertyValue('row-gap')) || 0;
        const rowHeight = parseInt(gridComputedStyle.getPropertyValue('grid-auto-rows')) || 50;
        
        // Get grid columns info
        const templateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
        const columnCount = templateColumns.split(' ').length;
        
        requestAnimationFrame(() => {
            const cards = grid.querySelectorAll('.monitoring-card');
            
            // Track row positions for each column
            const columnRowPositions = new Array(columnCount).fill(1);
            
            cards.forEach((card, index) => {
                // Get card content height
                const cardHeight = card.getBoundingClientRect().height;
                
                // Calculate how many rows this card should span
                const rowSpan = Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap));
                
                // Calculate which column this card should be in (based on original index)
                const columnIndex = (index % columnCount);
                const columnNumber = columnIndex + 1;
                
                // Get the current row position for this column
                const rowStart = columnRowPositions[columnIndex];
                
                // Set grid-column to keep card in same column
                card.style.gridColumn = `${columnNumber}`;
                
                // Set explicit grid-row position (start and span)
                card.style.gridRow = `${rowStart} / span ${rowSpan}`;
                
                // Update the next available row position for this column
                columnRowPositions[columnIndex] = rowStart + rowSpan;
            });
        });
    }

    renderMonitoringDevices() {
        const monitoringDevices = this.devices.filter(device => 
            device.type && (
                device.type.toUpperCase().includes('MONITOR') || 
                device.type.toUpperCase().includes('VENTILATOR') || 
                device.type.toUpperCase().includes('VITAL')
            )
        );
        
        const container = document.getElementById('monitoring-devices-grid');
        const countElement = document.getElementById('active-monitors-count');
        const filteredCountElement = document.getElementById('filtered-devices-count');
        const clinicFilterElement = document.getElementById('clinic-filter');
        
        if (!container) return;
        
        // Populate clinic filter dropdown
        if (clinicFilterElement) {
            const clinics = new Set();
            
            // Extract clinics from device logs
            monitoringDevices.forEach(device => {
                const deviceLogs = this.logs.filter(log => 
                    log.device_id === device.id && 
                    log.details && 
                    log.details.location && 
                    log.details.location.clinic
                );
                
                deviceLogs.forEach(log => {
                    if (log.details.location.clinic) {
                        clinics.add(log.details.location.clinic);
                    }
                });
            });
            
            // Sort and populate dropdown
            const sortedClinics = Array.from(clinics).sort();
            const currentValue = clinicFilterElement.value;
            
            clinicFilterElement.innerHTML = '<option value="all">Tüm Poliklinikler</option>' +
                sortedClinics.map(clinic => 
                    `<option value="${clinic}">${clinic}</option>`
                ).join('');
            
            // Restore selection
            if (currentValue && (currentValue === 'all' || sortedClinics.includes(currentValue))) {
                clinicFilterElement.value = currentValue;
            }
        }
        
        // Filter devices by clinic
        const filteredDevices = this.selectedClinic === 'all' 
            ? monitoringDevices 
            : monitoringDevices.filter(device => {
                const deviceLogs = this.logs.filter(log => 
                    log.device_id === device.id && 
                    log.details && 
                    log.details.location && 
                    log.details.location.clinic === this.selectedClinic
                );
                return deviceLogs.length > 0;
            });
        
        countElement.textContent = monitoringDevices.length;
        if (filteredCountElement) {
            filteredCountElement.textContent = filteredDevices.length;
        }
        
        if (monitoringDevices.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-heartbeat" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary);">Monitoring Cihazı Bulunamadı</h3>
                    <p style="color: var(--text-muted);">Sistemde monitoring cihazı kayıtlı değil.</p>
                </div>
            `;
            return;
        }
        
        if (filteredDevices.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-filter" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary);">Seçili Poliklinkte Cihaz Yok</h3>
                    <p style="color: var(--text-muted);">Bu poliklinkte aktif monitoring cihazı bulunmuyor.</p>
                    <button onclick="document.getElementById('clinic-filter').value='all'; dashboard.selectedClinic='all'; dashboard.renderMonitoringDevices();" 
                            style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">
                        <i class="fas fa-redo"></i> Tüm Cihazları Göster
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredDevices.map(device => {
            // Find latest log with vital signs AND patient for this device
            const deviceLogs = this.logs.filter(log => 
                log.device_id === device.id && 
                log.details && 
                log.details.vital_signs &&
                log.patient_id  // Must have a patient to be active
            ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            const latestLog = deviceLogs[0];
            const vitalSigns = latestLog?.details?.vital_signs;
            
            // Get patient, doctor and location info from latest log
            const patientId = latestLog?.patient_id;
            const userId = latestLog?.user_id;
            const location = latestLog?.details?.location;
            const patientName = patientId ? this.getPatientName(patientId) : null;
            const doctorName = userId ? this.getUserName(userId) : null;
            
            // Device is ONLINE only if it has an active patient
            const isOnline = patientId ? true : false;
            
            return `
                <div id="monitoring-card-${device.id}" class="monitoring-card" style="background: white; border-radius: 12px; padding: 1.25rem; border: 2px solid ${isOnline ? '#10b981' : '#e5e7eb'}; position: relative; cursor: pointer; transition: all 0.2s ease;">
                    <!-- PREVIEW SECTION (Always Visible) -->
                    <div class="monitoring-preview">
                        <!-- Device Header (Always visible) -->
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                            <div style="flex: 1;">
                                <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem;">
                                    ${device.name}
                                </h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">${device.type}</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isOnline ? '#10b981' : '#9ca3af'}; animation: ${isOnline ? 'pulse 2s infinite' : 'none'};"></div>
                                <span style="font-size: 0.7rem; font-weight: 600; color: ${isOnline ? '#10b981' : '#9ca3af'};">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                            </div>
                        </div>
                        
                        <!-- Preview Data (Hidden when expanded) -->
                        <div class="monitoring-preview-data">
                        ${isOnline && vitalSigns ? `
                        <!-- Compact Vital Signs Preview -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
                            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; padding: 0.5rem; text-align: center;">
                                <div style="font-size: 0.6rem; color: #ef4444; font-weight: 600; margin-bottom: 0.125rem;">HR</div>
                                <div style="font-size: 1.125rem; font-weight: 700; color: #dc2626; font-family: monospace;">${vitalSigns.heart_rate}</div>
                                <div style="font-size: 0.55rem; color: #9ca3af;">bpm</div>
                            </div>
                            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; padding: 0.5rem; text-align: center;">
                                <div style="font-size: 0.6rem; color: #dc2626; font-weight: 600; margin-bottom: 0.125rem;">BP</div>
                                <div style="font-size: 0.875rem; font-weight: 700; color: #dc2626; font-family: monospace;">${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic}</div>
                                <div style="font-size: 0.55rem; color: #9ca3af;">mmHg</div>
                            </div>
                            <div style="background: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 6px; padding: 0.5rem; text-align: center;">
                                <div style="font-size: 0.6rem; color: #06b6d4; font-weight: 600; margin-bottom: 0.125rem;">SpO₂</div>
                                <div style="font-size: 1.125rem; font-weight: 700; color: #0891b2; font-family: monospace;">${vitalSigns.spo2}</div>
                                <div style="font-size: 0.55rem; color: #9ca3af;">%</div>
                            </div>
                            <div style="background: rgba(234, 179, 8, 0.05); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 6px; padding: 0.5rem; text-align: center;">
                                <div style="font-size: 0.6rem; color: #eab308; font-weight: 600; margin-bottom: 0.125rem;">RESP</div>
                                <div style="font-size: 1.125rem; font-weight: 700; color: #ca8a04; font-family: monospace;">${vitalSigns.respiratory_rate}</div>
                                <div style="font-size: 0.55rem; color: #9ca3af;">/min</div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <!-- Patient & Doctor Preview -->
                        ${(patientName || doctorName) ? `
                        <div style="display: flex; gap: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.03); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.1);">
                            ${patientName ? `
                            <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-user-injured" style="color: #3b82f6; font-size: 0.875rem;"></i>
                                <div style="min-width: 0;">
                                    <div style="font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Hasta</div>
                                    <div style="font-size: 0.8rem; color: #111827; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${patientName}</div>
                                </div>
                            </div>
                            ` : ''}
                            ${doctorName ? `
                            <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-user-md" style="color: #10b981; font-size: 0.875rem;"></i>
                                <div style="min-width: 0;">
                                    <div style="font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Doktor</div>
                                    <div style="font-size: 0.8rem; color: #111827; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doctorName}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        ` : `
                        <div style="padding: 1rem; background: rgba(156, 163, 175, 0.05); border-radius: 6px; text-align: center; border: 1px dashed #d1d5db;">
                            <i class="fas fa-power-off" style="font-size: 1.5rem; color: #9ca3af; margin-bottom: 0.25rem; display: block;"></i>
                            <p style="color: #6b7280; font-size: 0.75rem; font-weight: 600;">Cihaz Aktif Değil</p>
                        </div>
                        `}
                        </div>
                        <!-- End of preview-data -->
                    </div>
                </div>
            `;
        }).join('');
        
        // Reflow grid after rendering to ensure proper masonry layout
        setTimeout(() => {
            this.reflowMonitoringGrid();
        }, 100);
    }

    initializeMonitoringCharts() {
        // Get all monitoring devices with vital signs
        const monitoringDevices = this.devices.filter(device => 
            device.type && (
                device.type.toUpperCase().includes('MONITOR') || 
                device.type.toUpperCase().includes('VENTILATOR') || 
                device.type.toUpperCase().includes('VITAL')
            )
        );
        
        monitoringDevices.forEach(device => {
            const latestLog = this.logs
                .filter(log => log.device_id === device.id)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            
            const vitalSigns = latestLog?.details?.vital_signs;
            if (!vitalSigns) return; // Skip offline devices
            
            // Initialize data storage for this device
            if (!this.monitoringData[device.id]) {
                this.monitoringData[device.id] = {
                    timestamps: [],
                    heart_rate: [],
                    blood_pressure_systolic: [],
                    blood_pressure_diastolic: [],
                    spo2: [],
                    respiratory_rate: []
                };
            }
            
            // Create charts
            this.createVitalSignChart(device.id, 'hr', 'Heart Rate', vitalSigns.heart_rate, '#ef4444', 'bpm');
            this.createVitalSignChart(device.id, 'bp', 'Blood Pressure', vitalSigns.blood_pressure_systolic, '#dc2626', 'mmHg');
            this.createVitalSignChart(device.id, 'spo2', 'SpO₂', vitalSigns.spo2, '#06b6d4', '%');
            this.createVitalSignChart(device.id, 'resp', 'Respiratory Rate', vitalSigns.respiratory_rate, '#eab308', '/min');
        });
    }
    
    createVitalSignChart(deviceId, type, label, initialValue, color, unit, prefix = '') {
        const canvas = document.getElementById(`${prefix}chart-${type}-${deviceId}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const chartKey = `${prefix}${deviceId}-${type}`;
        
        // Destroy existing chart if any
        if (this.monitoringCharts[chartKey]) {
            this.monitoringCharts[chartKey].destroy();
        }
        
        // Initial data (30 seconds of data points)
        const initialData = Array(30).fill(initialValue);
        const initialLabels = Array(30).fill('').map((_, i) => `${29 - i}s`);
        
        this.monitoringCharts[chartKey] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialLabels,
                datasets: [{
                    label: `${label} (${unit})`,
                    data: initialData,
                    borderColor: color,
                    backgroundColor: `${color}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animation for real-time feel
                },
                scales: {
                    x: {
                        display: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: '#f3f4f6',
                            lineWidth: 1
                        },
                        ticks: {
                            font: {
                                size: 9,
                                family: 'Monaco, monospace'
                            },
                            color: '#6b7280'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 10
                        },
                        bodyFont: {
                            size: 11,
                            family: 'Monaco, monospace'
                        },
                        padding: 8,
                        displayColors: false
                    }
                }
            }
        });
    }
    
    startRealTimeMonitoring() {
        // Clear any existing interval
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Update every second
        this.monitoringInterval = setInterval(() => {
            this.updateMonitoringCharts();
        }, 1000);
        
        console.log('Real-time monitoring started');
    }
    
    stopRealTimeMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('Real-time monitoring stopped');
        }
    }
    
    updateMonitoringCharts() {
        const monitoringDevices = this.devices.filter(device => 
            device.type && (
                device.type.toUpperCase().includes('MONITOR') || 
                device.type.toUpperCase().includes('VENTILATOR') || 
                device.type.toUpperCase().includes('VITAL')
            )
        );
        
        monitoringDevices.forEach(device => {
            const latestLog = this.logs
                .filter(log => log.device_id === device.id)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            
            const vitalSigns = latestLog?.details?.vital_signs;
            if (!vitalSigns) return;
            
            // Generate realistic variations with proper human ranges
            // HR: 60-100 bpm (normal adult), slight variation ±3
            let hr = vitalSigns.heart_rate + Math.floor(Math.random() * 6 - 3);
            hr = Math.max(55, Math.min(110, hr)); // Keep in realistic range
            
            // BP: Systolic 90-140 mmHg, Diastolic 60-90 mmHg
            let bpSys = vitalSigns.blood_pressure_systolic + Math.floor(Math.random() * 10 - 5);
            bpSys = Math.max(85, Math.min(150, bpSys));
            
            let bpDia = vitalSigns.blood_pressure_diastolic + Math.floor(Math.random() * 8 - 4);
            bpDia = Math.max(55, Math.min(95, bpDia));
            
            // SpO2: 95-100% (normal), slight variation ±1
            let spo2 = vitalSigns.spo2 + Math.floor(Math.random() * 3 - 1);
            spo2 = Math.max(93, Math.min(100, spo2));
            
            // RESP: 12-20 /min (normal adult), slight variation ±2
            let resp = vitalSigns.respiratory_rate + Math.floor(Math.random() * 4 - 2);
            resp = Math.max(10, Math.min(24, resp));
            
            // Update chart data with realistic values
            this.updateChartData(device.id, 'hr', hr);
            this.updateChartData(device.id, 'bp', bpSys, bpDia);
            this.updateChartData(device.id, 'spo2', spo2);
            this.updateChartData(device.id, 'resp', resp);
        });
    }
    
    updateChartData(deviceId, type, newValue, bpDiastolic = null) {
        const chartKey = `${deviceId}-${type}`;
        const chart = this.monitoringCharts[chartKey];
        
        if (chart) {
            // Add new data point
            chart.data.datasets[0].data.push(newValue);
            
            // Keep only last 30 data points (30 seconds)
            if (chart.data.datasets[0].data.length > 30) {
                chart.data.datasets[0].data.shift();
            }
            
            // Update chart
            chart.update('none');
        }
        
        // Also update modal chart if exists
        const modalChartKey = `modal-${deviceId}-${type}`;
        const modalChart = this.monitoringCharts[modalChartKey];
        
        if (modalChart) {
            modalChart.data.datasets[0].data.push(newValue);
            
            if (modalChart.data.datasets[0].data.length > 30) {
                modalChart.data.datasets[0].data.shift();
            }
            
            modalChart.update('none');
            
            // Update modal numeric value display
            const valueElement = document.getElementById(`modal-value-${type}-${deviceId}`);
            if (valueElement) {
                if (type === 'bp' && bpDiastolic !== null) {
                    valueElement.textContent = `${newValue}/${bpDiastolic}`;
                } else {
                    valueElement.textContent = newValue;
                }
            }
        }
    }

    updateMonitoringCount() {
        // Calculate monitoring devices count
        const monitoringDevices = this.devices.filter(device => 
            device.type && (
                device.type.toUpperCase().includes('MONITOR') || 
                device.type.toUpperCase().includes('VENTILATOR') || 
                device.type.toUpperCase().includes('VITAL')
            )
        );
        
        const countElement = document.getElementById('nav-device-count');
        if (countElement) {
            countElement.textContent = monitoringDevices.length;
            console.log('Monitoring devices count updated:', monitoringDevices.length);
        }
    }

    showError(message) {
        console.error(message);
        // TODO: Show user-friendly error notification
    }

    async loadAnalyticsData() {
        console.log('Loading analytics data...');
        // Charts are already loaded via updateCharts
    }

    async loadTimelineData() {
        console.log('Loading timeline data...');
        try {
            const timeline = await this.fetchAPI('/analytics/timeline?hours=24');
            console.log('Timeline data:', timeline.length, 'events');
            // TODO: Render timeline visualization
        } catch (error) {
            console.error('Failed to load timeline:', error);
        }
    }

    // ===== HOSPITAL ACTIVITY MODULE =====
    
    initActivityView() {
        // Initialize state
        this.activityState = {
            currentView: 'departments',
            selectedDepartment: null,
            selectedClinic: null,
            patientFilter: 'outpatient',
            searchQuery: ''
        };
        
        // Generate mock data
        this.generateActivityData();
        
        // Setup event listeners
        this.setupActivityEventListeners();
        
        // Render departments
        this.showDepartmentsView();
    }
    
    generateActivityData() {
        // Department data with realistic occupancy
        this.departments = [
            {
                id: 'acil',
                name: 'Acil Servis',
                icon: 'fa-ambulance',
                color: '#ef4444',
                patients: { current: 42, capacity: 50, waiting: 12 },
                staff: { doctors: 8, nurses: 15, onDuty: 23 },
                beds: { occupied: 38, available: 12 },
                avgWaitTime: 45
            },
            {
                id: 'yogun-bakim',
                name: 'Yoğun Bakım',
                icon: 'fa-heartbeat',
                color: '#dc2626',
                patients: { current: 28, capacity: 30, critical: 8 },
                staff: { doctors: 6, nurses: 18, onDuty: 24 },
                beds: { occupied: 28, available: 2 },
                avgStayDays: 5.2
            },
            {
                id: 'poliklinikler',
                name: 'Poliklinikler',
                icon: 'fa-clinic-medical',
                color: '#10b981',
                patients: { current: 156, today: 245, appointments: 89 },
                staff: { doctors: 25, nurses: 12, onDuty: 37 },
                clinics: 12,
                avgWaitTime: 28
            },
            {
                id: 'ameliyathane',
                name: 'Ameliyathane',
                icon: 'fa-procedures',
                color: '#8b5cf6',
                patients: { current: 6, today: 18, scheduled: 12 },
                staff: { doctors: 12, nurses: 20, onDuty: 32 },
                rooms: { active: 6, available: 2, total: 8 },
                avgDuration: 185
            },
            {
                id: 'servisler',
                name: 'Yatan Hasta Servisleri',
                icon: 'fa-bed',
                color: '#3b82f6',
                patients: { current: 284, capacity: 320, discharge: 15 },
                staff: { doctors: 18, nurses: 45, onDuty: 63 },
                beds: { occupied: 284, available: 36 },
                avgStayDays: 4.8
            },
            {
                id: 'radyoloji',
                name: 'Radyoloji',
                icon: 'fa-x-ray',
                color: '#f59e0b',
                patients: { current: 12, today: 78, waiting: 8 },
                staff: { doctors: 8, technicians: 15, onDuty: 23 },
                equipment: { active: 12, total: 15 },
                avgWaitTime: 35
            }
        ];
        
        // Clinic data for Poliklinikler department
        this.clinics = [
            {
                id: 'dahiliye',
                departmentId: 'poliklinikler',
                name: 'Dahiliye',
                patients: { current: 28, today: 45, waiting: 8 },
                doctor: 'Prof. Dr. Ahmet Yılmaz',
                avgWaitTime: 25
            },
            {
                id: 'kardiyoloji',
                departmentId: 'poliklinikler',
                name: 'Kardiyoloji',
                patients: { current: 18, today: 32, waiting: 5 },
                doctor: 'Doç. Dr. Ayşe Kaya',
                avgWaitTime: 35
            },
            {
                id: 'noroloji',
                departmentId: 'poliklinikler',
                name: 'Nöroloji',
                patients: { current: 22, today: 38, waiting: 6 },
                doctor: 'Prof. Dr. Mehmet Demir',
                avgWaitTime: 30
            },
            {
                id: 'ortopedi',
                departmentId: 'poliklinikler',
                name: 'Ortopedi',
                patients: { current: 15, today: 28, waiting: 4 },
                doctor: 'Dr. Zeynep Arslan',
                avgWaitTime: 20
            },
            {
                id: 'kadin-hastaliklari',
                departmentId: 'poliklinikler',
                name: 'Kadın Hastalıkları',
                patients: { current: 24, today: 42, waiting: 7 },
                doctor: 'Doç. Dr. Fatma Öztürk',
                avgWaitTime: 28
            },
            {
                id: 'cocuk',
                departmentId: 'poliklinikler',
                name: 'Çocuk Sağlığı',
                patients: { current: 32, today: 48, waiting: 9 },
                doctor: 'Dr. Can Yıldız',
                avgWaitTime: 22
            },
            {
                id: 'kulak-burun-bogaz',
                departmentId: 'poliklinikler',
                name: 'Kulak Burun Boğaz',
                patients: { current: 17, today: 32, waiting: 5 },
                doctor: 'Prof. Dr. Murat Şahin',
                avgWaitTime: 18
            }
        ];
        
        // Generate patient timeline data
        this.patientTimelines = this.generatePatientTimelines();
    }
    
    generatePatientTimelines() {
        const timelines = [];
        const now = new Date();
        
        // Outpatients (Ayakta hastalar)
        for (let i = 0; i < 15; i++) {
            const patient = {
                id: `OUT-${1000 + i}`,
                type: 'outpatient',
                name: this.generatePatientName(),
                clinic: this.clinics[i % this.clinics.length].name,
                status: ['waiting', 'in-consultation', 'completed'][Math.floor(Math.random() * 3)],
                timeline: []
            };
            
            // Generate timeline events
            const startTime = new Date(now.getTime() - Math.random() * 4 * 3600000);
            patient.timeline.push({
                time: startTime,
                event: 'Kayıt',
                location: 'Giriş/Kabul',
                status: 'completed'
            });
            
            if (patient.status !== 'waiting') {
                patient.timeline.push({
                    time: new Date(startTime.getTime() + 15 * 60000),
                    event: 'Triaj',
                    location: 'Triaj Odası',
                    status: 'completed'
                });
                
                patient.timeline.push({
                    time: new Date(startTime.getTime() + 45 * 60000),
                    event: 'Muayene',
                    location: patient.clinic,
                    status: patient.status === 'in-consultation' ? 'in-progress' : 'completed'
                });
            }
            
            if (patient.status === 'completed') {
                patient.timeline.push({
                    time: new Date(startTime.getTime() + 90 * 60000),
                    event: 'Tahlil/Tetkik',
                    location: 'Laboratuvar',
                    status: 'completed'
                });
                
                patient.timeline.push({
                    time: new Date(startTime.getTime() + 120 * 60000),
                    event: 'Taburcu',
                    location: 'Eczane',
                    status: 'completed'
                });
            }
            
            timelines.push(patient);
        }
        
        // Inpatients (Yatan hastalar)
        for (let i = 0; i < 12; i++) {
            const patient = {
                id: `IN-${2000 + i}`,
                type: 'inpatient',
                name: this.generatePatientName(),
                room: `${Math.floor(Math.random() * 5) + 1}. Kat - Oda ${100 + Math.floor(Math.random() * 50)}`,
                admissionDate: new Date(now.getTime() - Math.random() * 7 * 24 * 3600000),
                status: ['stable', 'monitoring', 'pre-discharge'][Math.floor(Math.random() * 3)],
                timeline: []
            };
            
            const admitTime = patient.admissionDate;
            patient.timeline.push({
                time: admitTime,
                event: 'Yatış',
                location: 'Acil Servis',
                status: 'completed'
            });
            
            patient.timeline.push({
                time: new Date(admitTime.getTime() + 2 * 3600000),
                event: 'Servis Transfer',
                location: patient.room,
                status: 'completed'
            });
            
            // Daily check-ups
            for (let day = 1; day <= 3; day++) {
                patient.timeline.push({
                    time: new Date(admitTime.getTime() + day * 24 * 3600000),
                    event: 'Günlük Kontrol',
                    location: patient.room,
                    status: 'completed'
                });
            }
            
            if (patient.status === 'pre-discharge') {
                patient.timeline.push({
                    time: new Date(now.getTime() - 2 * 3600000),
                    event: 'Taburcu Hazırlığı',
                    location: 'Hemşire Odası',
                    status: 'in-progress'
                });
            }
            
            timelines.push(patient);
        }
        
        return timelines;
    }
    
    generatePatientName() {
        const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Zeynep', 'Can', 'Elif', 'Mustafa', 'Emine'];
        const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Arslan', 'Öztürk', 'Yıldız', 'Aydın', 'Özdemir'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }
    
    setupActivityEventListeners() {
        // Breadcrumb navigation
        document.getElementById('breadcrumb-home')?.addEventListener('click', () => {
            this.showDepartmentsView();
        });
        
        document.getElementById('breadcrumb-department')?.addEventListener('click', () => {
            if (this.activityState.selectedDepartment) {
                this.showClinicsView(this.activityState.selectedDepartment);
            }
        });
        
        // Patient search
        const searchInput = document.getElementById('patient-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activityState.searchQuery = e.target.value.toLowerCase();
                this.renderPatientTimeline();
            });
        }
        
        // Patient filter buttons
        document.querySelectorAll('.patient-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.activityState.patientFilter = type;
                
                document.querySelectorAll('.patient-filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.border = '2px solid #e5e7eb';
                    b.style.background = 'white';
                    b.style.color = '#6b7280';
                });
                
                e.currentTarget.classList.add('active');
                e.currentTarget.style.border = '2px solid #3b82f6';
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.color = '#3b82f6';
                
                this.renderPatientTimeline();
            });
        });
        
        // Patient timeline card toggles (event delegation)
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.patient-timeline-header');
            if (header) {
                const card = header.closest('.patient-timeline-card');
                if (card) {
                    card.classList.toggle('expanded');
                }
            }
        });
    }
    
    showDepartmentsView() {
        this.activityState.currentView = 'departments';
        
        document.getElementById('activity-departments').style.display = 'block';
        document.getElementById('activity-clinics').style.display = 'none';
        document.getElementById('activity-timeline').style.display = 'none';
        document.getElementById('activity-breadcrumb').style.display = 'none';
        
        this.renderDepartments();
    }
    
    showClinicsView(departmentId) {
        this.activityState.currentView = 'clinics';
        this.activityState.selectedDepartment = departmentId;
        
        const department = this.departments.find(d => d.id === departmentId);
        
        document.getElementById('activity-departments').style.display = 'none';
        document.getElementById('activity-clinics').style.display = 'block';
        document.getElementById('activity-timeline').style.display = 'none';
        document.getElementById('activity-breadcrumb').style.display = 'flex';
        
        document.getElementById('breadcrumb-department').textContent = department.name;
        document.getElementById('breadcrumb-department').style.display = 'inline';
        document.getElementById('breadcrumb-arrow-2').style.display = 'none';
        document.getElementById('breadcrumb-clinic').style.display = 'none';
        
        document.getElementById('clinics-title').textContent = `${department.name} - Poliklinikler`;
        
        this.renderClinics(departmentId);
    }
    
    showTimelineView(clinicId) {
        this.activityState.currentView = 'timeline';
        this.activityState.selectedClinic = clinicId;
        
        const clinic = this.clinics.find(c => c.id === clinicId);
        const department = this.departments.find(d => d.id === clinic.departmentId);
        
        document.getElementById('activity-departments').style.display = 'none';
        document.getElementById('activity-clinics').style.display = 'none';
        document.getElementById('activity-timeline').style.display = 'block';
        document.getElementById('activity-breadcrumb').style.display = 'flex';
        
        document.getElementById('breadcrumb-department').textContent = department.name;
        document.getElementById('breadcrumb-department').style.display = 'inline';
        document.getElementById('breadcrumb-arrow-2').style.display = 'inline';
        document.getElementById('breadcrumb-clinic').textContent = clinic.name;
        document.getElementById('breadcrumb-clinic').style.display = 'inline';
        
        document.getElementById('timeline-title').textContent = `${clinic.name} - Hasta Hareketleri`;
        
        this.renderPatientTimeline();
    }
    
    renderDepartments() {
        const container = document.getElementById('departments-grid');
        if (!container) return;
        
        container.innerHTML = this.departments.map(dept => this.createDepartmentCard(dept)).join('');
        
        // Add click event listeners
        this.departments.forEach(dept => {
            const card = document.getElementById(`dept-card-${dept.id}`);
            if (card) {
                card.addEventListener('click', () => {
                    if (dept.id === 'poliklinikler') {
                        this.showClinicsView(dept.id);
                    }
                });
            }
        });
    }
    
    createDepartmentCard(dept) {
        const occupancyPercent = Math.round((dept.patients.current / (dept.patients.capacity || dept.patients.current)) * 100);
        const occupancyColor = occupancyPercent > 90 ? '#ef4444' : occupancyPercent > 70 ? '#f59e0b' : '#10b981';
        const isClickable = dept.id === 'poliklinikler';
        
        return `
            <div id="dept-card-${dept.id}" style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid ${dept.color}20; ${isClickable ? 'cursor: pointer;' : ''} transition: all 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${dept.color}15; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${dept.icon}" style="font-size: 1.5rem; color: ${dept.color};"></i>
                        </div>
                        <div>
                            <h4 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${dept.name}</h4>
                            <p style="font-size: 0.75rem; color: #6b7280;">${dept.staff.onDuty} personel görevde</p>
                        </div>
                    </div>
                    ${isClickable ? '<i class="fas fa-chevron-right" style="color: #9ca3af;"></i>' : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
                    <div style="background: #f9fafb; padding: 0.75rem; border-radius: 8px;">
                        <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.25rem;">Mevcut Hasta</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${dept.color};">${dept.patients.current}</div>
                    </div>
                    <div style="background: #f9fafb; padding: 0.75rem; border-radius: 8px;">
                        <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.25rem;">Kapasite</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #111827;">${dept.patients.capacity || dept.patients.today || '-'}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.75rem; color: #6b7280;">Doluluk Oranı</span>
                        <span style="font-size: 0.75rem; font-weight: 600; color: ${occupancyColor};">${occupancyPercent}%</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${occupancyPercent}%; height: 100%; background: ${occupancyColor}; transition: width 0.3s;"></div>
                    </div>
                </div>
                
                ${dept.avgWaitTime ? `
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #fef3c7; border-radius: 6px; margin-top: 0.75rem;">
                    <i class="fas fa-clock" style="color: #f59e0b;"></i>
                    <span style="font-size: 0.8rem; color: #92400e;">Ort. Bekleme: <strong>${dept.avgWaitTime} dk</strong></span>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    renderClinics(departmentId) {
        const container = document.getElementById('clinics-grid');
        if (!container) return;
        
        const departmentClinics = this.clinics.filter(c => c.departmentId === departmentId);
        
        container.innerHTML = departmentClinics.map(clinic => this.createClinicCard(clinic)).join('');
        
        // Add click event listeners
        departmentClinics.forEach(clinic => {
            const card = document.getElementById(`clinic-card-${clinic.id}`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showTimelineView(clinic.id);
                });
            }
        });
    }
    
    createClinicCard(clinic) {
        const occupancyPercent = Math.min(100, Math.round((clinic.patients.waiting / 15) * 100));
        const occupancyColor = occupancyPercent > 60 ? '#ef4444' : occupancyPercent > 30 ? '#f59e0b' : '#10b981';
        
        return `
            <div id="clinic-card-${clinic.id}" style="background: white; border-radius: 12px; padding: 1.25rem; border: 2px solid #10b98120; cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${clinic.name}</h4>
                        <p style="font-size: 0.75rem; color: #6b7280;">${clinic.doctor}</p>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #9ca3af;"></i>
                </div>
                
                <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="flex: 1; background: #f0fdf4; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #15803d; margin-bottom: 0.125rem;">Mevcut</div>
                        <div style="font-size: 1.125rem; font-weight: 700; color: #15803d;">${clinic.patients.current}</div>
                    </div>
                    <div style="flex: 1; background: #eff6ff; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #1e40af; margin-bottom: 0.125rem;">Bugün</div>
                        <div style="font-size: 1.125rem; font-weight: 700; color: #1e40af;">${clinic.patients.today}</div>
                    </div>
                    <div style="flex: 1; background: #fef3c7; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #92400e; margin-bottom: 0.125rem;">Bekleyen</div>
                        <div style="font-size: 1.125rem; font-weight: 700; color: #92400e;">${clinic.patients.waiting}</div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <i class="fas fa-clock" style="color: #6b7280; font-size: 0.875rem;"></i>
                    <span style="font-size: 0.75rem; color: #374151;">Ort. Bekleme: <strong>${clinic.avgWaitTime} dk</strong></span>
                </div>
            </div>
        `;
    }
    
    renderPatientTimeline() {
        const container = document.getElementById('patients-timeline');
        if (!container) return;
        
        // Filter by patient type
        let filteredPatients = this.patientTimelines.filter(p => p.type === this.activityState.patientFilter);
        
        // Filter by search query
        const searchQuery = this.activityState.searchQuery || '';
        if (searchQuery.trim()) {
            filteredPatients = filteredPatients.filter(p => 
                p.name.toLowerCase().includes(searchQuery) ||
                p.id.toLowerCase().includes(searchQuery)
            );
        }
        
        container.innerHTML = filteredPatients.map(patient => this.createPatientTimelineCard(patient)).join('');
    }
    
    createPatientTimelineCard(patient) {
        const statusColors = {
            'waiting': '#f59e0b',
            'in-consultation': '#3b82f6',
            'completed': '#10b981',
            'stable': '#10b981',
            'monitoring': '#f59e0b',
            'pre-discharge': '#3b82f6'
        };
        
        const statusColor = statusColors[patient.status] || '#6b7280';
        const isOutpatient = patient.type === 'outpatient';
        
        // Get current event (last in-progress or completed event)
        const currentEvent = patient.timeline.find(e => e.status === 'in-progress') || patient.timeline[patient.timeline.length - 1];
        
        return `
            <div class="patient-timeline-card" style="background: white; border-radius: 12px; border: 1px solid #e5e7eb;">
                <!-- Header (Always Visible) -->
                <div class="patient-timeline-header" style="padding: 1.25rem; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${statusColor}20; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${isOutpatient ? 'fa-walking' : 'fa-bed'}" style="color: ${statusColor};"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 0.9375rem; font-weight: 600; color: #111827;">${patient.name}</h4>
                                <p style="font-size: 0.75rem; color: #6b7280;">${patient.id} • ${isOutpatient ? patient.clinic : patient.room}</p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="padding: 0.25rem 0.75rem; background: ${statusColor}15; border-radius: 12px;">
                                <span style="font-size: 0.7rem; font-weight: 600; color: ${statusColor}; text-transform: uppercase;">${this.translateStatus(patient.status)}</span>
                            </div>
                            <i class="fas fa-chevron-down" style="color: #9ca3af;"></i>
                        </div>
                    </div>
                    
                    <!-- Preview Data (Hidden when expanded) -->
                    <div class="patient-preview-data" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6;">
                        <div style="font-size: 0.8125rem; color: #111827;">
                            <i class="fas fa-clock" style="color: #9ca3af; margin-right: 0.5rem;"></i>
                            <strong>${currentEvent.event}</strong> - ${this.formatTime(currentEvent.time)}
                        </div>
                        <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; margin-left: 1.5rem;">
                            <i class="fas fa-map-marker-alt" style="color: #9ca3af; margin-right: 0.25rem;"></i>
                            ${currentEvent.location}
                        </div>
                    </div>
                </div>
                
                <!-- Timeline Details (Hidden by default, shown when expanded) -->
                <div class="patient-timeline-details">
                    <div style="padding: 0 1.25rem 1.25rem 1.25rem;">
                        <div style="position: relative; padding-left: 1.5rem;">
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #e5e7eb;"></div>
                            
                            ${patient.timeline.map((event, index) => `
                                <div style="position: relative; margin-bottom: ${index < patient.timeline.length - 1 ? '1rem' : '0'};">
                                    <div style="position: absolute; left: -1.625rem; top: 0.125rem; width: 10px; height: 10px; border-radius: 50%; background: ${event.status === 'completed' ? '#10b981' : event.status === 'in-progress' ? '#3b82f6' : '#9ca3af'}; border: 2px solid white;"></div>
                                    <div style="padding-left: 0.5rem;">
                                        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.125rem;">
                                            <span style="font-size: 0.8125rem; font-weight: 600; color: #111827;">${event.event}</span>
                                            <span style="font-size: 0.7rem; color: #9ca3af; white-space: nowrap;">${this.formatTime(event.time)}</span>
                                        </div>
                                        <div style="font-size: 0.75rem; color: #6b7280;">
                                            <i class="fas fa-map-marker-alt" style="color: #9ca3af; margin-right: 0.25rem;"></i>
                                            ${event.location}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    translateStatus(status) {
        const translations = {
            'waiting': 'Beklemede',
            'in-consultation': 'Muayenede',
            'completed': 'Tamamlandı',
            'stable': 'Stabil',
            'monitoring': 'Gözlem',
            'pre-discharge': 'Taburcu Öncesi'
        };
        return translations[status] || status;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new EnterpriseAuditDashboard();
});

// Add Socket.IO script if not already loaded
if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
}

