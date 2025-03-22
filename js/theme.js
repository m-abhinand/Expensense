/**
 * Theme switching functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme toggle
    initThemeToggle();
    
    // Apply saved theme on page load
    applySavedTheme();
});

// Initialize theme toggle button
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', function() {
        toggleTheme();
    });
}

// Toggle between light and dark themes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add transition class for smooth animation
    document.body.classList.add('theme-transition');
    
    // Apply theme change
    setTheme(newTheme);
    
    // Save the theme preference
    localStorage.setItem('theme', newTheme);
    
    // Remove transition class after animation completes
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 300);
}

// Apply theme based on saved preference
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }
}

// Set theme to light or dark
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update the theme icon
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    // If charts exist, update them for the new theme
    if (typeof updateChartsForTheme === 'function') {
        updateChartsForTheme(theme);
    }
}

// Listen for storage events to sync theme across tabs
window.addEventListener('storage', function(event) {
    if (event.key === 'theme') {
        setTheme(event.newValue);
    }
});
