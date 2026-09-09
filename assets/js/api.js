import { Utils } from './app.js';

class API {
    constructor() {
        this.baseUrl = 'https://api.mediai.com/v1';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Set authentication token
    setToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    // Get token from storage
    getToken() {
        return Utils.getCookie('auth_token') || Utils.storage.get('user')?.token || null;
    }

    // Handle API response
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            const error = data.message || 'An error occurred';
            throw new Error(error);
        }

        return data;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // Auth endpoints
    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async refreshToken() {
        return this.post('/auth/refresh');
    }

    async forgotPassword(email) {
        return this.post('/auth/forgot-password', { email });
    }

    async resetPassword(token, password) {
        return this.post('/auth/reset-password', { token, password });
    }

    // User endpoints
    async getUserProfile() {
        return this.get('/user/profile');
    }

    async updateUserProfile(data) {
        return this.put('/user/profile', data);
    }

    async changePassword(data) {
        return this.put('/user/change-password', data);
    }

    // Patient endpoints
    async getPatientDashboard() {
        return this.get('/patient/dashboard');
    }

    async getPatientAppointments() {
        return this.get('/patient/appointments');
    }

    async bookAppointment(data) {
        return this.post('/patient/appointments', data);
    }

    async cancelAppointment(id) {
        return this.delete(`/patient/appointments/${id}`);
    }

    async getMedicalRecords() {
        return this.get('/patient/records');
    }

    async uploadMedicalRecord(data) {
        return this.post('/patient/records', data);
    }

    // Symptom checker
    async checkSymptoms(symptoms) {
        return this.post('/symptom-checker', { symptoms });
    }

    async getHealthPrediction(data) {
        return this.post('/predictions', data);
    }

    // Doctor endpoints
    async getDoctors(params = {}) {
        return this.get('/doctors', params);
    }

    async getDoctorAvailability(id) {
        return this.get(`/doctors/${id}/availability`);
    }

    // Hospital endpoints
    async getHospitals(params = {}) {
        return this.get('/hospitals', params);
    }

    async getHospitalDepartments(id) {
        return this.get(`/hospitals/${id}/departments`);
    }

    // AI Assistant
    async askAssistant(question) {
        return this.post('/assistant', { question });
    }

    // Wearable data
    async getWearableData() {
        return this.get('/wearable');
    }

    async syncWearableData(data) {
        return this.post('/wearable/sync', data);
    }

    // Notifications
    async getNotifications() {
        return this.get('/notifications');
    }

    async markNotificationAsRead(id) {
        return this.put(`/notifications/${id}/read`);
    }

    async markAllNotificationsAsRead() {
        return this.put('/notifications/read-all');
    }

    // Analytics
    async getHealthAnalytics() {
        return this.get('/analytics/health');
    }

    async getAppointmentAnalytics() {
        return this.get('/analytics/appointments');
    }

    // Admin endpoints
    async getUsers(params = {}) {
        return this.get('/admin/users', params);
    }

    async updateUserStatus(id, status) {
        return this.put(`/admin/users/${id}/status`, { status });
    }

    async getSystemStats() {
        return this.get('/admin/stats');
    }

    async getOutbreaks() {
        return this.get('/admin/outbreaks');
    }

    async getFeedback() {
        return this.get('/admin/feedback');
    }
}

// Create API instance
const api = new API();

// Auto-set token if available
const token = api.getToken();
if (token) {
    api.setToken(token);
}

export default api;