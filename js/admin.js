/**
 * Admin functionality for the Expense Tracker application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Admin credentials
    const ADMIN_USERNAME = 'admin@expense.com';
    const ADMIN_PASSWORD = 'admin@123';
    
    // Get DOM elements
    const adminLoginToggle = document.getElementById('admin-login-toggle');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const closeModalButtons = document.querySelectorAll('.close-modal, .cancel-admin-login');
    
    // Open admin login modal
    if (adminLoginToggle) {
        adminLoginToggle.addEventListener('click', function(e) {
            e.preventDefault();
            adminLoginModal.classList.add('active');
            modalBackdrop.classList.add('active');
        });
    }
    
    // Close modal functionality
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            adminLoginModal.classList.remove('active');
            modalBackdrop.classList.remove('active');
        });
    });
    
    // Close when clicking on backdrop
    modalBackdrop.addEventListener('click', function() {
        adminLoginModal.classList.remove('active');
        modalBackdrop.classList.remove('active');
    });
    
    // Handle admin login form submission
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value.trim();
            
            // Reset error messages
            document.getElementById('admin-username-error').textContent = '';
            document.getElementById('admin-password-error').textContent = '';
            
            // Validate inputs
            let hasError = false;
            
            if (!username) {
                document.getElementById('admin-username-error').textContent = 'Username is required';
                hasError = true;
            }
            
            if (!password) {
                document.getElementById('admin-password-error').textContent = 'Password is required';
                hasError = true;
            }
            
            if (hasError) return;
            
            // Check admin credentials
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Set admin session
                sessionStorage.setItem('adminAuthenticated', 'true');
                
                // Redirect to admin dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                // Show error for invalid credentials
                document.getElementById('admin-password-error').textContent = 'Invalid username or password';
            }
        });
    }
});

// Function to check if the user is authenticated as admin
function requireAdminAuth() {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (!isAdmin) {
        window.location.href = 'index.html';
    }
}

// Function to get all users data
function getAllUsersData() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.map(user => {
        // Remove sensitive information like password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

// Function to get all expenses data grouped by user
function getAllExpensesData() {
    const allExpenses = JSON.parse(localStorage.getItem('expenses')) || {};
    return allExpenses;
}

// Function to get all budgets data grouped by user
function getAllBudgetsData() {
    const allBudgets = JSON.parse(localStorage.getItem('budgets')) || {};
    return allBudgets;
}

// Function to format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

// Function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Function to get category name
function getCategoryName(categoryId) {
    const categories = {
        'food': 'Food & Dining',
        'transportation': 'Transportation',
        'housing': 'Housing & Rent',
        'utilities': 'Utilities',
        'entertainment': 'Entertainment',
        'shopping': 'Shopping',
        'health': 'Health & Medical',
        'travel': 'Travel',
        'education': 'Education',
        'other': 'Other'
    };
    
    return categories[categoryId] || categoryId;
}
