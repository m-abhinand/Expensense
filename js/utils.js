/**
 * Utility functions for the Expense Tracker application
 */

// Hash a password using a simple algorithm (SHA-256)
// In a real application, you would use a more secure method with salt
async function hashPassword(password) {
    // Use the Web Crypto API if available
    if (window.crypto && window.crypto.subtle) {
        try {
            const msgUint8 = new TextEncoder().encode(password);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (e) {
            console.error('Crypto API error:', e);
            // Fallback to a simple hash function
            return simpleHash(password);
        }
    } else {
        // Fallback for browsers without Crypto API support
        return simpleHash(password);
    }
}

// A simple hash function for fallback (not secure for production!)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

// Check if user is currently logged in
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Redirect if user is not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
    }
}

// Format date to readable string
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
