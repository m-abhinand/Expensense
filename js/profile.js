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
    
    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Setup reset data button
    document.getElementById('reset-data').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) return;
            
            // Reset expenses - expenses are stored by userEmail as key in an object
            const allExpenses = JSON.parse(localStorage.getItem('expenses')) || {};
            if (allExpenses[currentUser.email]) {
                delete allExpenses[currentUser.email];
                localStorage.setItem('expenses', JSON.stringify(allExpenses));
            }
            
            // Reset budgets - budgets are also stored by userEmail
            const allBudgets = JSON.parse(localStorage.getItem('budgets')) || {};
            if (allBudgets[currentUser.email]) {
                delete allBudgets[currentUser.email];
                localStorage.setItem('budgets', JSON.stringify(allBudgets));
            }
            
            // Reset bills if they exist
            if (localStorage.getItem(`bills_${currentUser.email}`)) {
                localStorage.removeItem(`bills_${currentUser.email}`);
            }
            
            // Refresh statistics
            loadUserStatistics();
            showNotification('All data has been reset successfully', 'success');
        }
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
        // Use name or email if name is not available
        const displayName = currentUser.name || currentUser.email || 'User';
        
        // Generate and display user initials in the avatar
        const userInitials = generateUserInitials(displayName);
        const avatarContainer = document.querySelector('.profile-avatar');
        if (avatarContainer) {
            avatarContainer.innerHTML = `<div class="initials-avatar">${userInitials}</div>`;
        }
        
        // Update profile header
        document.getElementById('profile-name').textContent = displayName;
        document.getElementById('profile-email').textContent = currentUser.email || '';
        
        // Update user-name in navbar
        document.getElementById('user-name').textContent = displayName;
        
        // Update personal information section
        document.getElementById('info-name').textContent = displayName;
        document.getElementById('info-email').textContent = currentUser.email || '';
        
        // Format and display join date
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
    // Get expenses from localStorage - expenses are stored by userEmail
    const allExpenses = JSON.parse(localStorage.getItem('expenses')) || {};
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;
    
    // Get user's expenses array
    const userExpenses = allExpenses[currentUser.email] || [];
    
    // Calculate and display statistics
    const totalExpenses = userExpenses.length;
    document.getElementById('total-expenses-count').textContent = totalExpenses;
    
    // Calculate unique categories used
    const uniqueCategories = new Set(userExpenses.map(expense => expense.category));
    document.getElementById('categories-used').textContent = uniqueCategories.size || 0;
    
    // Calculate average expense
    let totalAmount = 0;
    if (userExpenses.length > 0) {
        totalAmount = userExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const avgAmount = totalAmount / userExpenses.length;
        
        // Get current currency
        const currency = localStorage.getItem(`currency_${currentUser.email}`) || 'USD';
        document.getElementById('avg-expense-amount').textContent = formatCurrency(avgAmount, currency);
    } else {
        // Get current currency for display
        const currency = localStorage.getItem(`currency_${currentUser.email}`) || 'USD';
        document.getElementById('avg-expense-amount').textContent = formatCurrency(0, currency);
    }
    
    // Find most used category
    const categoryCounts = {};
    userExpenses.forEach(expense => {
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
    
    // Display category name
    document.getElementById('most-used-category').textContent = mostUsedCategory ? getCategoryName(mostUsedCategory) : 'None';
}

// Function to update user profile
function updateUserProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    
    if (name && email) {
        // Check if the email is being changed
        const oldEmail = currentUser.email;
        const isEmailChanged = email !== oldEmail;
        
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
            
            // If email was changed, we need to update all data associated with it
            if (isEmailChanged && oldEmail) {
                // Update expenses
                const allExpenses = JSON.parse(localStorage.getItem('expenses')) || {};
                if (allExpenses[oldEmail]) {
                    allExpenses[email] = allExpenses[oldEmail];
                    delete allExpenses[oldEmail];
                    localStorage.setItem('expenses', JSON.stringify(allExpenses));
                }
                
                // Update budgets
                const allBudgets = JSON.parse(localStorage.getItem('budgets')) || {};
                if (allBudgets[oldEmail]) {
                    allBudgets[email] = allBudgets[oldEmail];
                    delete allBudgets[oldEmail];
                    localStorage.setItem('budgets', JSON.stringify(allBudgets));
                }
                
                // Update bills
                if (localStorage.getItem(`bills_${oldEmail}`)) {
                    const bills = localStorage.getItem(`bills_${oldEmail}`);
                    localStorage.setItem(`bills_${email}`, bills);
                    localStorage.removeItem(`bills_${oldEmail}`);
                }
                
                // Update currency
                if (localStorage.getItem(`currency_${oldEmail}`)) {
                    const currency = localStorage.getItem(`currency_${oldEmail}`);
                    localStorage.setItem(`currency_${email}`, currency);
                    localStorage.removeItem(`currency_${oldEmail}`);
                }
            }
        }
        
        // Refresh display
        displayUserInfo();
        
        // Switch back to view mode
        document.getElementById('profile-info-view').style.display = 'block';
        document.getElementById('profile-edit-form').style.display = 'none';
        
        // Show success message
        showNotification('Profile updated successfully!', 'success');
    }
}

// Function to change password
function changePassword() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    // Clear previous errors
    document.getElementById('current-password-error').textContent = '';
    document.getElementById('new-password-error').textContent = '';
    document.getElementById('confirm-new-password-error').textContent = '';
    
    // Validate inputs
    let isValid = true;
    
    // Check if current password is correct
    if (currentPassword !== currentUser.password) {
        document.getElementById('current-password-error').textContent = 'Current password is incorrect';
        isValid = false;
    }
    
    // Validate new password
    if (newPassword.length < 6) {
        document.getElementById('new-password-error').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    // Confirm passwords match
    if (newPassword !== confirmPassword) {
        document.getElementById('confirm-new-password-error').textContent = 'Passwords do not match';
        isValid = false;
    }
    
    if (isValid) {
        // Update password in currentUser
        currentUser.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users array
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(user => user.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex] = {...users[userIndex], password: newPassword};
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Reset form and close modal
        document.getElementById('change-password-form').reset();
        document.getElementById('change-password-modal').classList.remove('show');
        document.getElementById('modal-backdrop').classList.remove('show');
        
        // Show success message
        showNotification('Password updated successfully!', 'success');
    }
}

// Function to load currency setting
function loadCurrencySetting() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get user-specific currency or fall back to global setting
    const userCurrency = localStorage.getItem(`currency_${currentUser.email}`) 
        || localStorage.getItem('userCurrency') 
        || 'USD';
    
    // Set the correct currency in the dropdown
    document.getElementById('currency-select').value = userCurrency;
    
    // Also update the global setting for compatibility
    localStorage.setItem('userCurrency', userCurrency);
}

// Function to update currency
function updateCurrency(currencyCode) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currencyCode) return;
    
    // Save currency as user-specific
    localStorage.setItem(`currency_${currentUser.email}`, currencyCode);
    
    // Also update global setting for compatibility with other parts of the app
    localStorage.setItem('userCurrency', currencyCode);
    
    // Refresh statistics to show correct currency format
    loadUserStatistics();
    showNotification('Currency updated successfully!', 'success');
}

// Helper function to format currency
function formatCurrency(amount, currencyCode = 'USD') {
    const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'JPY': '¥'
    };
    
    try {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode
        });
        return formatter.format(amount);
    } catch (error) {
        // Fallback if Intl is not supported
        const symbol = currencySymbols[currencyCode] || '$';
        return `${symbol}${amount.toFixed(2)}`;
    }
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
        'health': 'Healthcare',
        'travel': 'Travel',
        'education': 'Education',
        'other': 'Other'
    };
    
    return categories[categoryCode] || categoryCode;
}

// Helper function to show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Generates initials from a user's name
 * - For one word: First letter of the word
 * - For two words: First letter of each word
 * - For more words: First letter of first and last word
 * @param {string} name - The user's full name
 * @return {string} The initials
 */
function generateUserInitials(name) {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    
    if (words.length === 1) {
        // For single word names (e.g., "John" → "J")
        return words[0].charAt(0).toUpperCase();
    } else if (words.length === 2) {
        // For two word names (e.g., "John Doe" → "JD")
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    } else {
        // For multiple words (e.g., "John Middle Doe" → "JD")
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
}
