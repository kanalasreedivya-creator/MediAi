import { Notification } from './app.js';
import api from './api.js';

class SymptomChecker {
    constructor() {
        this.selectedSymptoms = new Set();
        this.currentStep = 1;
        this.maxSteps = 3;
        this.init();
    }

    init() {
        // Setup category filters
        this.setupCategories();

        // Setup symptom selection
        this.setupSymptomSelection();

        // Setup step navigation
        this.setupStepNavigation();

        // Setup form submission
        this.setupFormSubmission();
    }

    setupCategories() {
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter symptoms
                const category = btn.dataset.category;
                this.filterSymptoms(category);
            });
        });
    }

    filterSymptoms(category) {
        const symptomGrid = document.getElementById('symptomGrid');
        if (!symptomGrid) return;

        const symptoms = symptomGrid.querySelectorAll('.symptom-tag');
        symptoms.forEach(symptom => {
            if (category === 'all') {
                symptom.style.display = 'block';
            } else {
                const categories = symptom.dataset.categories?.split(',') || [];
                symptom.style.display = categories.includes(category) ? 'block' : 'none';
            }
        });
    }

    setupSymptomSelection() {
        const symptomTags = document.querySelectorAll('.symptom-tag input[type="checkbox"]');
        symptomTags.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedSymptoms.add(checkbox.value);
                } else {
                    this.selectedSymptoms.delete(checkbox.value);
                }
                this.updateSelectedCount();
            });
        });
    }

    updateSelectedCount() {
        const countElement = document.querySelector('.selected-count');
        if (countElement) {
            countElement.textContent = this.selectedSymptoms.size;
        }
    }

    setupStepNavigation() {
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');

        nextButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToStep(this.currentStep + 1);
            });
        });

        prevButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToStep(this.currentStep - 1);
            });
        });

        // Update step indicators
        this.updateStepIndicators();
    }

    goToStep(step) {
        if (step < 1 || step > this.maxSteps) return;

        // Validate current step
        if (!this.validateStep(this.currentStep)) return;

        // Hide all steps
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.remove('active');
        });

        // Show target step
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        this.currentStep = step;
        this.updateStepIndicators();
    }

    validateStep(step) {
        if (step === 1) {
            // Validate symptom selection
            if (this.selectedSymptoms.size === 0) {
                Notification.warning('Please select at least one symptom');
                return false;
            }
        }
        return true;
    }

    updateStepIndicators() {
        const steps = document.querySelectorAll('.step');
        const stepLines = document.querySelectorAll('.step-line');

        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');

            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });

        stepLines.forEach((line, index) => {
            line.classList.remove('active');
            if (index + 1 < this.currentStep) {
                line.classList.add('active');
            }
        });
    }

    setupFormSubmission() {
        const form = document.getElementById('symptomForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (this.currentStep < this.maxSteps) {
                this.goToStep(this.currentStep + 1);
                return;
            }

            // Submit symptoms
            await this.submitSymptoms();
        });
    }

    async submitSymptoms() {
        try {
            // Show loading
            this.showLoading();

            // Get additional data
            const additionalData = this.getAdditionalData();

            // Prepare payload
            const payload = {
                symptoms: Array.from(this.selectedSymptoms),
                ...additionalData
            };

            // API call
            const result = await api.checkSymptoms(payload);

            // Display results
            this.displayResults(result);

            Notification.success('Symptom analysis complete');

        } catch (error) {
            Notification.error('Failed to analyze symptoms');
            console.error('Symptom analysis error:', error);
        } finally {
            this.hideLoading();
        }
    }

    getAdditionalData() {
        const form = document.getElementById('symptomForm');
        const data = {};

        // Get date
        const dateInput = form.querySelector('input[type="date"]');
        if (dateInput) {
            data.startDate = dateInput.value;
        }

        // Get severity
        const severityInput = form.querySelector('input[type="range"]');
        if (severityInput) {
            data.severity = severityInput.value;
        }

        // Get notes
        const notesInput = form.querySelector('textarea');
        if (notesInput) {
            data.notes = notesInput.value;
        }

        return data;
    }

    displayResults(result) {
        const resultsContainer = document.querySelector('.result-container');
        if (!resultsContainer) return;

        const loading = resultsContainer.querySelector('.result-loading');
        const content = resultsContainer.querySelector('.result-content');

        if (loading) {
            loading.style.display = 'none';
        }

        if (content) {
            content.style.display = 'block';

            // Update results
            const conditionsList = content.querySelector('.conditions-list');
            if (conditionsList && result.conditions) {
                conditionsList.innerHTML = result.conditions.map(condition => `
                    <li>
                        <span class="condition">${condition.name}</span>
                        - ${condition.match}% match
                    </li>
                `).join('');
            }

            // Update recommendations
            const recommendationsList = content.querySelector('.recommendations-list');
            if (recommendationsList && result.recommendations) {
                recommendationsList.innerHTML = result.recommendations.map(rec => `
                    <li><i class="fas fa-check-circle"></i> ${rec}</li>
                `).join('');
            }
        }
    }

    showLoading() {
        const loading = document.querySelector('.result-loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.querySelector('.result-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Initialize symptom checker
document.addEventListener('DOMContentLoaded', () => {
    const checker = new SymptomChecker();
});