// User authentication functions

document.addEventListener('DOMContentLoaded', function() {
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validate form
            if (validateLoginForm(email, password)) {
                // Perform login logic
                loginUser(email, password);
            }
        });
    }
    
    // Handle signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate form
            if (validateSignupForm(name, email, password, confirmPassword)) {
                // Perform signup logic
                registerUser(name, email, password);
            }
        });
    }
});

function validateLoginForm(email, password) {
    let isValid = true;
    
    // Reset error messages
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    
    // Email validation
    if (!isValidEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Password validation
    if (password.length < 6) {
        document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    return isValid;
}

function validateSignupForm(name, email, password, confirmPassword) {
    let isValid = true;
    
    // Reset error messages
    document.getElementById('name-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('confirm-password-error').textContent = '';
    
    // Name validation
    if (name.trim() === '') {
        document.getElementById('name-error').textContent = 'Name is required';
        isValid = false;
    }
    
    // Email validation
    if (!isValidEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email';
        isValid = false;
    }
    
    // Password validation
    if (password.length < 6) {
        document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function loginUser(email, password) {
    // Add your authentication logic here
    // For example, using localStorage to simulate authentication
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid email or password');
    }
}

function registerUser(name, email, password) {
    // Add your registration logic here
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        document.getElementById('email-error').textContent = 'Email already in use';
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password
    };
    
    // Add user to storage
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set current user
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
}
