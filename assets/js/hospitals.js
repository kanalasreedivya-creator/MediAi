import { Notification } from './app.js';
import api from './api.js';

class HospitalManager {
    constructor() {
        this.hospitals = [];
        this.filters = {
            location: 'all',
            specialty: 'all'
        };
        this.init();
    }

    init() {
        this.loadHospitals();
        this.setupFilters();
        this.setupSearch();
    }

    async loadHospitals() {
        try {
            const data = await api.getHospitals();
            this.hospitals = data.hospitals || [];
            this.renderHospitals();
        } catch (error) {
            Notification.error('Failed to load hospitals');
            console.error('Hospitals error:', error);
        }
    }

    renderHospitals() {
        const grid = document.querySelector('.hospitals-grid');
        if (!grid) return;

        const filtered = this.filterHospitals();

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-hospital"></i>
                    <p>No hospitals found</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(hospital => `
            <div class="hospital-card">
                <img src="${hospital.image || '../assets/images/hospitals/default.jpg'}" alt="${hospital.name}">
                <div class="hospital-info">
                    <h3>${hospital.name}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${hospital.location}</p>
                    <div class="hospital-rating">
                        ${this.renderStars(hospital.rating)}
                        <span>${hospital.rating} (${hospital.reviews} reviews)</span>
                    </div>
                    <div class="hospital-specialties">
                        ${hospital.specialties.map(s => `<span>${s}</span>`).join('')}
                    </div>
                    <div class="hospital-actions">
                        <a href="#" class="btn-primary" onclick="hospitalManager.viewDetails('${hospital.id}')">View Details</a>
                        <a href="../patient/appointment.html?hospital=${hospital.id}" class="btn-secondary">Book Appointment</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    filterHospitals() {
        let filtered = this.hospitals;

        if (this.filters.location !== 'all') {
            filtered = filtered.filter(h => h.location === this.filters.location);
        }

        if (this.filters.specialty !== 'all') {
            filtered = filtered.filter(h => 
                h.specialties.includes(this.filters.specialty)
            );
        }

        return filtered;
    }

    setupFilters() {
        const locationFilter = document.querySelector('.location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => {
                this.filters.location = e.target.value;
                this.renderHospitals();
            });
        }

        const specialtyFilter = document.querySelector('.specialty-filter');
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', (e) => {
                this.filters.specialty = e.target.value;
                this.renderHospitals();
            });
        }
    }

    setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const term = e.target.value.toLowerCase();
                const filtered = this.hospitals.filter(h => 
                    h.name.toLowerCase().includes(term) ||
                    h.location.toLowerCase().includes(term) ||
                    h.specialties.some(s => s.toLowerCase().includes(term))
                );
                this.renderHospitals(filtered);
            }, 300);
        });
    }

    viewDetails(id) {
        window.location.href = `hospital-details.html?id=${id}`;
    }
}

// Initialize hospital manager
const hospitalManager = new HospitalManager();
export default hospitalManager;