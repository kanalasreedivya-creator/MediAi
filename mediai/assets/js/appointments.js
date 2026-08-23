import { Notification } from './app.js';
import api from './api.js';

class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.filters = {
            status: 'all',
            date: 'all'
        };
        this.init();
    }

    init() {
        // Load appointments
        this.loadAppointments();

        // Setup filters
        this.setupFilters();

        // Setup appointment form
        this.setupAppointmentForm();

        // Setup appointment actions
        this.setupAppointmentActions();
    }

    async loadAppointments() {
        try {
            const data = await api.getPatientAppointments();
            this.appointments = data.appointments || [];
            this.renderAppointments();
        } catch (error) {
            Notification.error('Failed to load appointments');
            console.error('Appointments error:', error);
        }
    }

    renderAppointments() {
        const list = document.querySelector('.appointment-list');
        if (!list) return;

        const filtered = this.filterAppointments();

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="no-appointments">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No appointments found</p>
                    <a href="appointment.html" class="btn-primary">Book an Appointment</a>
                </div>
            `;
            return;
        }

        list.innerHTML = filtered.map(appointment => `
            <div class="appointment-card ${appointment.status}">
                <div class="appointment-header">
                    <div class="appointment-doctor">
                        <img src="${appointment.doctorAvatar || '../assets/images/doctors/default.jpg'}" alt="Doctor">
                        <div>
                            <h4>${appointment.doctorName}</h4>
                            <p>${appointment.specialty}</p>
                        </div>
                    </div>
                    <span class="appointment-status ${appointment.status}">${appointment.status}</span>
                </div>
                <div class="appointment-details">
                    <div class="detail">
                        <i class="fas fa-calendar"></i>
                        <span>${appointment.date}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-clock"></i>
                        <span>${appointment.time}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-hospital"></i>
                        <span>${appointment.hospital}</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    ${this.getAppointmentActions(appointment)}
                </div>
            </div>
        `).join('');
    }

    getAppointmentActions(appointment) {
        if (appointment.status === 'cancelled') {
            return '';
        }

        if (appointment.status === 'completed') {
            return `
                <button class="btn-secondary btn-sm" onclick="appointmentManager.viewSummary('${appointment.id}')">View Summary</button>
                <button class="btn-primary btn-sm" onclick="appointmentManager.bookFollowUp('${appointment.id}')">Book Follow-up</button>
            `;
        }

        return `
            <button class="btn-secondary btn-sm" onclick="appointmentManager.reschedule('${appointment.id}')">Reschedule</button>
            <button class="btn-danger btn-sm" onclick="appointmentManager.cancel('${appointment.id}')">Cancel</button>
            ${appointment.type === 'virtual' ? `<button class="btn-primary btn-sm" onclick="appointmentManager.join('${appointment.id}')">Join</button>` : ''}
        `;
    }

    filterAppointments() {
        let filtered = this.appointments;

        // Status filter
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(apt => apt.status === this.filters.status);
        }

        // Date filter
        if (this.filters.date === 'today') {
            const today = new Date().toDateString();
            filtered = filtered.filter(apt => 
                new Date(apt.date).toDateString() === today
            );
        } else if (this.filters.date === 'upcoming') {
            const today = new Date();
            filtered = filtered.filter(apt => 
                new Date(apt.date) > today && apt.status !== 'cancelled'
            );
        }

        // Sort by date
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        return filtered;
    }

    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (filter) {
                    this.filters.status = filter;
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.renderAppointments();
                }
            });
        });

        const dateFilter = document.querySelector('.date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
                this.renderAppointments();
            });
        }
    }

    setupAppointmentForm() {
        const form = document.getElementById('appointmentForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                // Get form data
                const formData = new FormData(form);
                const data = {
                    doctorId: formData.get('doctor'),
                    hospitalId: formData.get('hospital'),
                    date: formData.get('date'),
                    time: formData.get('time'),
                    reason: formData.get('reason'),
                    type: formData.get('visitType')
                };

                // Validate
                if (!data.doctorId || !data.hospitalId || !data.date || !data.time) {
                    Notification.warning('Please fill in all required fields');
                    return;
                }

                // Show loading
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Booking...';
                submitBtn.disabled = true;

                // Book appointment
                await api.bookAppointment(data);

                Notification.success('Appointment booked successfully!');

                // Redirect to appointments
                setTimeout(() => {
                    window.location.href = 'appointments.html';
                }, 1500);

            } catch (error) {
                Notification.error('Failed to book appointment');
                console.error('Booking error:', error);
            } finally {
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Book Appointment';
                submitBtn.disabled = false;
            }
        });
    }

    setupAppointmentActions() {
        // Setup appointment actions (cancel, reschedule, etc.)
        document.querySelectorAll('.appointment-actions .btn-danger').forEach(btn => {
            btn.addEventListener('click', async () => {
                const appointmentId = btn.dataset.id;
                if (appointmentId && confirm('Are you sure you want to cancel this appointment?')) {
                    await this.cancelAppointment(appointmentId);
                }
            });
        });
    }

    async cancelAppointment(id) {
        try {
            await api.cancelAppointment(id);
            Notification.success('Appointment cancelled');
            await this.loadAppointments();
        } catch (error) {
            Notification.error('Failed to cancel appointment');
            console.error('Cancel error:', error);
        }
    }

    async reschedule(id) {
        // Open reschedule modal
        const modal = document.getElementById('rescheduleModal');
        if (modal) {
            modal.classList.add('active');
            // Pre-fill with appointment data
            const appointment = this.appointments.find(apt => apt.id === id);
            if (appointment) {
                // Populate form fields
            }
        }
    }

    async join(id) {
        // Join virtual appointment
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment && appointment.joinUrl) {
            window.open(appointment.joinUrl, '_blank');
        } else {
            Notification.warning('Join link not available');
        }
    }

    viewSummary(id) {
        // View appointment summary
        window.location.href = `appointment-summary.html?id=${id}`;
    }

    bookFollowUp(id) {
        // Book follow-up appointment
        window.location.href = `appointment.html?followup=${id}`;
    }
}

// Initialize appointment manager
const appointmentManager = new AppointmentManager();
export default appointmentManager;