/**
 * Form validation functions
 */

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    // Password should be at least 8 characters long
    // and contain at least one uppercase letter, one lowercase letter, and one number
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber,
        message: password.length < minLength ? 
            'Password must be at least 8 characters long' : 
            (!hasUpperCase || !hasLowerCase || !hasNumber) ? 
            'Password must include uppercase, lowercase, and number' : ''
    };
}

// Show validation errors
function showError(inputElement, message) {
    const errorElement = document.getElementById(`${inputElement.id}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        inputElement.classList.add('error');
    }
}

// Clear validation errors
function clearError(inputElement) {
    const errorElement = document.getElementById(`${inputElement.id}-error`);
    if (errorElement) {
        errorElement.textContent = '';
        inputElement.classList.remove('error');
    }
}

// Set up form validation for signup form
function setupSignupValidation() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const fullnameInput = document.getElementById('fullname');

    // Email validation
    emailInput.addEventListener('blur', function() {
        if (!validateEmail(this.value) && this.value.trim() !== '') {
            showError(this, 'Please enter a valid email address');
        } else {
            clearError(this);
        }
    });

    // Password validation
    passwordInput.addEventListener('blur', function() {
        if (this.value.trim() !== '') {
            const validation = validatePassword(this.value);
            if (!validation.isValid) {
                showError(this, validation.message);
            } else {
                clearError(this);
            }
        }
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('blur', function() {
        if (this.value.trim() !== '' && this.value !== passwordInput.value) {
            showError(this, 'Passwords do not match');
        } else {
            clearError(this);
        }
    });

    // Full name validation
    fullnameInput.addEventListener('blur', function() {
        if (this.value.trim().length < 2) {
            showError(this, 'Please enter your full name');
        } else {
            clearError(this);
        }
    });
}

// Set up form validation for login form
function setupLoginValidation() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Email validation
    emailInput.addEventListener('blur', function() {
        if (!validateEmail(this.value) && this.value.trim() !== '') {
            showError(this, 'Please enter a valid email address');
        } else {
            clearError(this);
        }
    });
}

// Initialize validation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupSignupValidation();
    setupLoginValidation();
});
