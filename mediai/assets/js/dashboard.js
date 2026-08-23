import { Utils, Notification } from './app.js';
import api from './api.js';

class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        // Load dashboard data
        await this.loadDashboardData();

        // Setup event listeners
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            // Show loading state
            this.showLoading();

            // Fetch dashboard data
            const data = await api.getPatientDashboard();

            // Update stats
            this.updateStats(data.stats);

            // Update appointments
            this.updateAppointments(data.appointments);

            // Update health insights
            this.updateHealthInsights(data.insights);

            // Update activity
            this.updateActivity(data.activity);

        } catch (error) {
            Notification.error('Failed to load dashboard data');
            console.error('Dashboard error:', error);
        } finally {
            this.hideLoading();
        }
    }

    updateStats(stats) {
        const statsContainer = document.querySelector('.stats-grid');
        if (!statsContainer) return;

        // Update stat values
        const statElements = statsContainer.querySelectorAll('.stat-value');
        if (statElements.length >= 4) {
            statElements[0].innerHTML = `${stats.patients || 0} <span>patients</span>`;
            statElements[1].innerHTML = `${stats.appointments || 0} <span>appointments</span>`;
            statElements[2].innerHTML = `${stats.medications || 0} <span>medications</span>`;
            statElements[3].innerHTML = `${stats.healthScore || 0} <span>score</span>`;
        }
    }

    updateAppointments(appointments) {
        const container = document.querySelector('.appointments-card .appointment-list');
        if (!container) return;

        if (!appointments || appointments.length === 0) {
            container.innerHTML = '<p class="no-data">No upcoming appointments</p>';
            return;
        }

        container.innerHTML = appointments.map(apt => `
            <div class="appointment-item">
                <div class="appointment-info">
                    <h4>${apt.doctorName}</h4>
                    <p>${apt.type}</p>
                    <span class="appointment-time">${apt.date} at ${apt.time}</span>
                </div>
                <span class="appointment-status ${apt.status}">${apt.status}</span>
            </div>
        `).join('');
    }

    updateHealthInsights(insights) {
        const container = document.querySelector('.health-insights .insights-list');
        if (!container) return;

        if (!insights || insights.length === 0) {
            container.innerHTML = '<p class="no-data">No health insights available</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i class="fas fa-lightbulb"></i>
                <p>${insight.message}</p>
            </div>
        `).join('');
    }

    updateActivity(activity) {
        const container = document.querySelector('.activity-timeline');
        if (!container) return;

        if (!activity || activity.length === 0) {
            container.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        container.innerHTML = activity.map(item => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${item.icon || 'fa-calendar-check'}"></i>
                </div>
                <div class="activity-content">
                    <p>${item.description}</p>
                    <span class="activity-time">${item.time}</span>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }

        // View all buttons
        document.querySelectorAll('.view-all').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('href');
                if (target) {
                    window.location.href = target;
                }
            });
        });
    }

    showLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
});