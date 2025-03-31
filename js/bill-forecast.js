/**
 * Bill payment forecast functionality
 */

// Initialize forecast when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBillForecast();
});

// Initialize bill forecast
function initBillForecast() {
    renderForecast();
    
    // Update forecast when bills are updated
    document.addEventListener('billsUpdated', renderForecast);
    
    // Also listen for when a bill is marked as paid
    document.addEventListener('expensesUpdated', renderForecast);
}

// Render payment forecast
function renderForecast() {
    if (!window.billManager) return;
    
    const forecastContainer = document.getElementById('forecast-timeline');
    if (!forecastContainer) return;
    
    // Clear existing content
    forecastContainer.innerHTML = '';
    
    // Get upcoming bills for the next 30 days
    const bills = window.billManager.getUpcomingBills(30);
    
    if (bills.length === 0) {
        forecastContainer.innerHTML = `
            <div class="empty-forecast">
                <p>No upcoming bills in the next 30 days.</p>
            </div>
        `;
        return;
    }
    
    // Group bills by due date
    const groupedBills = groupBillsByDate(bills);
    
    // Sort dates
    const sortedDates = Object.keys(groupedBills).sort((a, b) => new Date(a) - new Date(b));
    
    // Create forecast items for each date
    sortedDates.forEach(dateStr => {
        const dateBills = groupedBills[dateStr];
        
        // Parse date properly
        const dueDate = new Date(dateStr);
        
        // Format date
        const formattedDate = formatDateWithRelative(dueDate);
        
        // Calculate if any bill is overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const isOverdue = dueDate < today;
        
        // Create forecast item
        const forecastItem = document.createElement('div');
        forecastItem.className = `forecast-item ${isOverdue ? 'overdue' : 'pending'}`;
        
        // Calculate total for this date
        const dateTotal = dateBills.reduce((total, bill) => total + parseFloat(bill.amount), 0);
        
        forecastItem.innerHTML = `
            <div class="forecast-date">
                ${formattedDate} • Total: ${formatCurrency(dateTotal)}
            </div>
            <div class="forecast-bills">
                ${dateBills.map(bill => `
                    <div class="forecast-bill">
                        <span class="forecast-bill-name">${bill.name}</span>
                        <span class="forecast-bill-amount">${formatCurrency(bill.amount)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Group bills by due date
function groupBillsByDate(bills) {
    const groupedBills = {};
    
    bills.forEach(bill => {
        if (!bill.dueDate) return;
        
        // Normalize the date format to YYYY-MM-DD to avoid timezone issues
        const billDate = new Date(bill.dueDate);
        const year = billDate.getFullYear();
        const month = String(billDate.getMonth() + 1).padStart(2, '0');
        const day = String(billDate.getDate()).padStart(2, '0');
        const normalizedDateStr = `${year}-${month}-${day}`;
        
        if (!groupedBills[normalizedDateStr]) {
            groupedBills[normalizedDateStr] = [];
        }
        
        groupedBills[normalizedDateStr].push(bill);
    });
    
    return groupedBills;
}

// Format date with relative time
function formatDateWithRelative(date) {
    // Format date
    const formattedDate = date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric'
    });
    
    // Calculate days difference
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return relative text
    if (diffDays === 0) {
        return `Today (${formattedDate})`;
    } else if (diffDays === 1) {
        return `Tomorrow (${formattedDate})`;
    } else if (diffDays < 0) {
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue (${formattedDate})`;
    } else if (diffDays <= 7) {
        return `In ${diffDays} day${diffDays !== 1 ? 's' : ''} (${formattedDate})`;
    } else {
        return formattedDate;
    }
}

// Format currency helper function
function formatCurrency(amount) {
    // Get the user's preferred currency
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    
    // Format the amount with the user's locale and currency
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: userCurrency
    }).format(amount);
}
