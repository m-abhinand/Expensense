/**
 * Theme switching functionality
 */

// Define setTheme in the global scope so it can be used by the storage event listener
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // Update the icon based on theme
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
}

document.addEventListener('DOMContentLoaded', function() {
    // Get the theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or use default
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Add event listener to toggle button if it exists
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Get current theme and toggle it
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
});

// Listen for storage events to sync theme across tabs
window.addEventListener('storage', function(event) {
    if (event.key === 'theme') {
        setTheme(event.newValue);
    }
});
