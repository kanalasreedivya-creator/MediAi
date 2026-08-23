import { Notification } from './app.js';
import api from './api.js';

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        this.loadNotifications();
        this.setupWebSocket();
        this.setupNotificationActions();
    }

    async loadNotifications() {
        try {
            const data = await api.getNotifications();
            this.notifications = data.notifications || [];
            this.unreadCount = data.notifications.filter(n => !n.read).length;
            this.renderNotifications();
            this.updateBadge();
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    renderNotifications() {
        const list = document.querySelector('.notifications-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${this.getIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${this.getTimeAgo(notification.createdAt)}</span>
                </div>
                ${!notification.read ? `
                    <button class="notification-mark-read" onclick="notificationManager.markAsRead('${notification.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    getIcon(type) {
        const icons = {
            'appointment': 'fa-calendar-check',
            'health': 'fa-heartbeat',
            'system': 'fa-info-circle',
            'message': 'fa-envelope',
            'reminder': 'fa-bell'
        };
        return icons[type] || 'fa-bell';
    }

    getTimeAgo(date) {
        const diff = new Date() - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    }

    updateBadge() {
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            badge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        });
    }

    setupWebSocket() {
        // Setup WebSocket connection for real-time notifications
        try {
            const ws = new WebSocket('wss://api.mediai.com/ws');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    this.addNotification(data.notification);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.warn('WebSocket not available, using polling');
            // Fallback: Poll for notifications every 30 seconds
            setInterval(() => this.loadNotifications(), 30000);
        }
    }

    addNotification(notification) {
        this.notifications.unshift(notification);
        this.unreadCount++;
        this.renderNotifications();
        this.updateBadge();
        
        // Show toast notification
        Notification.show(notification.message, notification.type);
    }

    setupNotificationActions() {
        // Mark all as read
        const markAllBtn = document.querySelector('.mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterNotifications(filter);
            });
        });
    }

    filterNotifications(filter) {
        const items = document.querySelectorAll('.notification-item');
        items.forEach(item => {
            if (filter === 'all') {
                item.style.display = 'flex';
            } else {
                const type = item.querySelector('.notification-icon')?.className;
                if (type && type.includes(filter)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    async markAsRead(id) {
        try {
            await api.markNotificationAsRead(id);
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                this.unreadCount--;
                this.renderNotifications();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await api.markAllNotificationsAsRead();
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.renderNotifications();
            this.updateBadge();
            Notification.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }
}

// Initialize notification manager
const notificationManager = new NotificationManager();
export default notificationManager;