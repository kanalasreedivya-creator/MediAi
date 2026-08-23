import { Notification } from './app.js';
import api from './api.js';

class WearableManager {
    constructor() {
        this.devices = [];
        this.currentData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.loadData();
        this.setupDeviceSync();
        this.setupCharts();
    }

    async loadData() {
        try {
            // Load devices
            const devices = await this.getDevices();
            this.devices = devices;
            this.renderDevices();

            // Load health data
            const data = await this.getHealthData();
            this.currentData = data;
            this.updateStats(data);
            this.updateCharts(data);

        } catch (error) {
            Notification.error('Failed to load wearable data');
            console.error('Wearable error:', error);
        }
    }

    async getDevices() {
        // Mock device data
        return [
            {
                id: 1,
                name: 'Heart Rate Monitor',
                type: 'heart_rate',
                icon: 'fa-heartbeat',
                connected: true,
                lastSync: new Date()
            },
            {
                id: 2,
                name: 'Sleep Tracker',
                type: 'sleep',
                icon: 'fa-bed',
                connected: true,
                lastSync: new Date()
            },
            {
                id: 3,
                name: 'Fitness Tracker',
                type: 'fitness',
                icon: 'fa-shoe-prints',
                connected: false,
                lastSync: null
            }
        ];
    }

    async getHealthData() {
        // Mock health data
        return {
            heartRate: {
                current: 72,
                avg: 72,
                min: 65,
                max: 85,
                history: [68, 72, 75, 70, 73, 71, 72, 69, 74, 72]
            },
            sleep: {
                duration: 7.5,
                deep: 2.5,
                light: 4.0,
                rem: 1.0,
                history: [7, 7.5, 6.5, 8, 7, 7.5, 7.5]
            },
            steps: {
                today: 8542,
                goal: 10000,
                history: [7000, 8500, 9200, 7800, 9000, 8500, 8542]
            },
            calories: {
                today: 2100,
                history: [1900, 2100, 2300, 2000, 2200, 2100, 2100]
            }
        };
    }

    renderDevices() {
        const container = document.querySelector('.device-status');
        if (!container) return;

        container.innerHTML = this.devices.map(device => `
            <div class="device-card">
                <i class="fas ${device.icon}"></i>
                <div>
                    <h4>${device.name}</h4>
                    <span class="device-${device.connected ? 'connected' : 'disconnected'}">
                        ${device.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    ${device.lastSync ? `<small>Last sync: ${this.formatTime(device.lastSync)}</small>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateStats(data) {
        const statsContainer = document.querySelector('.wearable-stats');
        if (!statsContainer) return;

        const stats = [
            { icon: 'fa-heart', value: `${data.heartRate.current} bpm`, label: 'Average Heart Rate' },
            { icon: 'fa-moon', value: `${data.sleep.duration} hrs`, label: 'Sleep Duration' },
            { icon: 'fa-running', value: `${data.steps.today.toLocaleString()}`, label: 'Steps Today' },
            { icon: 'fa-fire', value: `${data.calories.today.toLocaleString()} cal`, label: 'Calories Burned' }
        ];

        statsContainer.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas ${stat.icon}"></i></div>
                <div class="stat-info">
                    <h3>${stat.value}</h3>
                    <p>${stat.label}</p>
                </div>
            </div>
        `).join('');
    }

    setupDeviceSync() {
        const syncBtn = document.querySelector('.btn-primary');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncDevices());
        }

        // Auto sync every 5 minutes
        setInterval(() => this.syncDevices(), 300000);
    }

    async syncDevices() {
        try {
            Notification.info('Syncing devices...');

            // Simulate sync
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update devices
            this.devices.forEach(device => {
                device.connected = true;
                device.lastSync = new Date();
            });

            this.renderDevices();
            Notification.success('Devices synced successfully');

            // Refresh data
            await this.loadData();

        } catch (error) {
            Notification.error('Failed to sync devices');
            console.error('Sync error:', error);
        }
    }

    setupCharts() {
        this.createHeartRateChart();
        this.createSleepChart();
    }

    createHeartRateChart() {
        const canvas = document.getElementById('heartRateChart');
        if (!canvas) return;

        const data = this.currentData?.heartRate?.history || [68, 72, 75, 70, 73, 71, 72, 69, 74, 72];
        const labels = data.map((_, i) => `Day ${i + 1}`);

        this.charts.heartRate = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Heart Rate (bpm)',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        min: 60,
                        max: 90
                    }
                }
            }
        });
    }

    createSleepChart() {
        const canvas = document.getElementById('sleepChart');
        if (!canvas) return;

        const data = this.currentData?.sleep?.history || [7, 7.5, 6.5, 8, 7, 7.5, 7.5];
        const labels = data.map((_, i) => `Day ${i + 1}`);

        this.charts.sleep = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep (hours)',
                    data: data,
                    backgroundColor: '#60a5fa',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateCharts(data) {
        // Update heart rate chart
        if (this.charts.heartRate && data?.heartRate?.history) {
            this.charts.heartRate.data.datasets[0].data = data.heartRate.history;
            this.charts.heartRate.update();
        }

        // Update sleep chart
        if (this.charts.sleep && data?.sleep?.history) {
            this.charts.sleep.data.datasets[0].data = data.sleep.history;
            this.charts.sleep.update();
        }
    }

    formatTime(date) {
        if (!date) return 'Never';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize wearable manager
document.addEventListener('DOMContentLoaded', () => {
    const wearable = new WearableManager();
});