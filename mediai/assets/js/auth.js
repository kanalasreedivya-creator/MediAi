import { Utils, Notification } from './app.js';

class Auth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check for existing session
        this.checkSession();

        // Setup login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Setup registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Setup forgot password form
        const forgotForm = document.getElementById('forgotForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Setup logout buttons
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });

        // Setup toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = e.target.parentElement.querySelector('input');
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                    e.target.classList.toggle('fa-eye');
                    e.target.classList.toggle('fa-eye-slash');
                }
            });
        });
    }

    checkSession() {
        const user = Utils.storage.get('user');
        if (user) {
            this.currentUser = user;
            this.isAuthenticated = true;
            this.redirectToDashboard(user.role);
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('#email').value;
        const password = form.querySelector('#password').value;
        const remember = form.querySelector('#remember')?.checked || false;

        if (!email || !password) {
            Notification.error('Please fill in all fields');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Notification.error('Please enter a valid email address');
            return;
        }

        // Simulate API call
        this.loginUser(email, password, remember);
    }

    loginUser(email, password, remember) {
        // Show loading state
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // Simulate API request
        setTimeout(() => {
            // Mock user data
            const user = {
                id: '1',
                email: email,
                name: 'John Doe',
                role: 'patient',
                avatar: 'assets/images/avatars/user.jpg',
                token: 'mock-jwt-token'
            };

            // Save user data
            if (remember) {
                Utils.storage.set('user', user);
                Utils.setCookie('auth_token', user.token, 7);
            } else {
                Utils.storage.set('user', user);
                Utils.setCookie('auth_token', user.token, 1);
            }

            this.currentUser = user;
            this.isAuthenticated = true;

            Notification.success('Login successful!');

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Redirect
            this.redirectToDashboard(user.role);
        }, 1500);
    }

    handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const firstName = form.querySelector('#firstName').value;
        const lastName = form.querySelector('#lastName').value;
        const email = form.querySelector('#email').value;
        const phone = form.querySelector('#phone').value;
        const password = form.querySelector('#password').value;
        const role = form.querySelector('#role').value;
        const terms = form.querySelector('#terms')?.checked || false;

        // Validation
        if (!firstName || !lastName || !email || !phone || !password || !role) {
            Notification.error('Please fill in all fields');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Notification.error('Please enter a valid email address');
            return;
        }

        if (!Utils.validatePhone(phone)) {
            Notification.error('Please enter a valid phone number');
            return;
        }

        if (password.length < 8) {
            Notification.error('Password must be at least 8 characters');
            return;
        }

        if (!terms) {
            Notification.error('Please agree to the Terms of Service');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;

        // Simulate API request
        setTimeout(() => {
            Notification.success('Account created successfully!');

            // Auto-login after registration
            const user = {
                id: '1',
                email: email,
                name: `${firstName} ${lastName}`,
                role: role,
                avatar: 'assets/images/avatars/default.jpg',
                token: 'mock-jwt-token'
            };

            Utils.storage.set('user', user);
            this.currentUser = user;
            this.isAuthenticated = true;

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Redirect
            this.redirectToDashboard(role);
        }, 1500);
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('#email').value;

        if (!email) {
            Notification.error('Please enter your email address');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Notification.error('Please enter a valid email address');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Simulate API request
        setTimeout(() => {
            Notification.success('Password reset link sent to your email');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }, 1500);
    }

    logout() {
        Utils.storage.remove('user');
        Utils.deleteCookie('auth_token');
        this.currentUser = null;
        this.isAuthenticated = false;
        Notification.success('Logged out successfully');

        setTimeout(() => {
            window.location.href = '../index.html';
        }, 500);
    }

    redirectToDashboard(role) {
        const redirects = {
            patient: 'patient/dashboard.html',
            doctor: 'doctor/dashboard.html',
            hospital: 'hospital/dashboard.html',
            admin: 'admin/dashboard.html'
        };

        const path = redirects[role] || 'patient/dashboard.html';
        setTimeout(() => {
            window.location.href = path;
        }, 500);
    }

    // Protected route check
    requireAuth() {
        if (!this.isAuthenticated) {
            Notification.warning('Please login to access this page');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 500);
            return false;
        }
        return true;
    }

    // Role-based access control
    requireRole(allowedRoles) {
        if (!this.isAuthenticated || !this.currentUser) {
            this.requireAuth();
            return false;
        }

        if (!allowedRoles.includes(this.currentUser.role)) {
            Notification.error('Access denied. Insufficient permissions.');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 500);
            return false;
        }

        return true;
    }
}

// Initialize auth
const auth = new Auth();

// Export for use in other files
export default auth;