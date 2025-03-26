/**
 * Profile page functionality for the Expense Tracker application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    requireAuth();
    
    // Display user information
    displayUserInfo();
    
    // Load and display user statistics
    loadUserStatistics();
    
    // Handle profile form submission
    document.getElementById('profile-edit-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateUserProfile();
    });
    
    // Handle password change form submission
    document.getElementById('change-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });
    
    // Load current currency setting
    loadCurrencySetting();
    
    // Handle currency selection change
    document.getElementById('currency-select').addEventListener('change', function() {
        updateCurrency(this.value);
    });
});

// Function to check if user is authenticated
function requireAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
    }
}

// Function to display user information
function displayUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const displayName = currentUser.fullname || currentUser.name || currentUser.email;
        
        // Update profile header
        document.getElementById('profile-name').textContent = displayName;
        document.getElementById('profile-email').textContent = currentUser.email;
        
        // Update user-name in navbar
        document.getElementById('user-name').textContent = displayName;
        
        // Update personal information section
        document.getElementById('info-name').textContent = displayName;
        document.getElementById('info-email').textContent = currentUser.email;
        
        // Format and display join date (using registration timestamp or current date as fallback)
        const joinDate = currentUser.joined ? new Date(currentUser.joined) : new Date();
        document.getElementById('info-joined').textContent = joinDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Function to load user statistics
function loadUserStatistics() {
    // Get user expenses from localStorage
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    // Calculate statistics
    const totalExpensesCount = expenses.length;
    document.getElementById('total-expenses-count').textContent = totalExpensesCount;
    
    // Calculate categories used
    const categoriesUsed = new Set(expenses.map(expense => expense.category)).size;
    document.getElementById('categories-used').textContent = categoriesUsed;
    
    // Calculate average expense amount
    if (totalExpensesCount > 0) {
        const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const averageAmount = totalAmount / totalExpensesCount;
        document.getElementById('avg-expense-amount').textContent = formatCurrency(averageAmount);
    }
    
    // Find most used category
    if (totalExpensesCount > 0) {
        const categoryCounts = {};
        expenses.forEach(expense => {
            categoryCounts[expense.category] = (categoryCounts[expense.category] || 0) + 1;
        });
        
        let mostUsedCategory = '';
        let highestCount = 0;
        
        for (const category in categoryCounts) {
            if (categoryCounts[category] > highestCount) {
                mostUsedCategory = category;
                highestCount = categoryCounts[category];
            }
        }
        
        // Display category name instead of code
        document.getElementById('most-used-category').textContent = getCategoryName(mostUsedCategory);
    }
}

// Function to update user profile
function updateUserProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    
    if (name && email) {
        // Update current user
        currentUser.name = name;
        currentUser.email = email;
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users array to ensure persistence
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(user => user.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex] = {...users[userIndex], name, email};
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Refresh display
        displayUserInfo();
        
        // Switch back to view mode
        document.getElementById('profile-info-view').style.display = 'block';
        document.getElementById('profile-edit-form').style.display = 'none';
        
        // Show success message (could add a toast/notification component here)
        alert('Profile updated successfully!');
    }
}

// Function to change password
function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Simple validation
    if (!currentPassword) {
        document.getElementById('current-password-error').textContent = 'Please enter your current password';
        return;
    }
    
    if (newPassword.length < 6) {
        document.getElementById('new-password-error').textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        document.getElementById('confirm-new-password-error').textContent = 'Passwords do not match';
        return;
    }
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // In a real app, you would verify the current password with the server
    // For this demo, we'll assume it's correct (or compare with stored password)
    
    // Update password for current user
    currentUser.password = newPassword;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Close modal
    document.getElementById('change-password-modal').classList.remove('show');
    document.getElementById('modal-backdrop').classList.remove('show');
    
    // Reset form
    document.getElementById('change-password-form').reset();
    
    // Show success message
    alert('Password changed successfully!');
}

// Function to load currency setting
function loadCurrencySetting() {
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    document.getElementById('currency-select').value = userCurrency;
}

// Function to update currency
function updateCurrency(currencyCode) {
    localStorage.setItem('userCurrency', currencyCode);
    alert('Currency updated to ' + currencyCode + '. Changes will take effect when you reload the page.');
}

// Helper function to format currency
function formatCurrency(amount) {
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: userCurrency 
    }).format(amount);
}

// Helper function to get category name from category code
function getCategoryName(categoryCode) {
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
    
    return categories[categoryCode] || categoryCode;
}
