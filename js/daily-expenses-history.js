/**
 * Daily expenses history functionality
 */

// Initialize daily expense view when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDailyExpenseView();
});

// Initialize daily expense view
function initDailyExpenseView() {
    const daySummaryCard = document.getElementById('day-summary-card');
    
    if (daySummaryCard) {
        daySummaryCard.addEventListener('click', function() {
            showDailyExpenses();
        });
        // Add visual indication that the card is clickable
        daySummaryCard.classList.add('clickable');
    }
}

// Show daily expenses history
function showDailyExpenses() {
    const modal = document.getElementById('historical-expenses-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const titleElement = document.getElementById('historical-expenses-title');
    const periodsListElement = document.getElementById('historical-periods-list');
    
    // Clear previous content
    periodsListElement.innerHTML = '';
    
    // Set the title for daily expenses
    titleElement.textContent = 'Daily Expenses History';
    
    // Get all expenses
    const expenses = expenseManager.getAllExpenses();
    if (!expenses.length) {
        periodsListElement.innerHTML = '<div class="empty-state">No expense data available.</div>';
        openModal();
        return;
    }
    
    // Group expenses by day
    const dailyExpenses = groupExpensesByDay(expenses);
    
    // Sort periods in descending order (newest first)
    const sortedPeriods = Object.keys(dailyExpenses).sort((a, b) => {
        return new Date(b) - new Date(a);
    });
    
    // Generate HTML for each period
    sortedPeriods.forEach(periodKey => {
        const periodData = dailyExpenses[periodKey];
        const totalAmount = periodData.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        
        const periodElement = document.createElement('div');
        periodElement.className = 'historical-period-item';
        
        // Format day label
        const date = new Date(periodKey);
        const periodLabel = formatDate(date);
        
        // Create period header with toggle functionality
        const periodHeader = document.createElement('div');
        periodHeader.className = 'historical-period-header';
        periodHeader.innerHTML = `
            <div class="period-info">
                <span class="period-label">${periodLabel}</span>
                <span class="period-amount">${formatCurrency(totalAmount)}</span>
            </div>
            <span class="toggle-icon">▼</span>
        `;
        
        // Create container for period expenses
        const expensesContainer = document.createElement('div');
        expensesContainer.className = 'historical-period-expenses';
        expensesContainer.style.maxHeight = '0';
        expensesContainer.style.opacity = '0';
        expensesContainer.style.overflow = 'hidden';
        
        // Add expenses to container
        if (periodData.expenses.length > 0) {
            periodData.expenses.forEach(expense => {
                const expenseItem = document.createElement('div');
                expenseItem.className = 'historical-expense-item';
                expenseItem.innerHTML = `
                    <div class="expense-item-main">
                        <div class="expense-header">
                            <span class="category-badge category-${expense.category}">${getCategoryName(expense.category)}</span>
                            <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                        </div>
                        <div class="expense-date">${formatDate(new Date(expense.date))}</div>
                        ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
                    </div>
                `;
                expensesContainer.appendChild(expenseItem);
            });
        } else {
            expensesContainer.innerHTML = '<div class="empty-state">No expenses in this period.</div>';
        }
        
        // Toggle expense visibility when header is clicked with smooth transition
        periodHeader.addEventListener('click', function() {
            const isVisible = expensesContainer.classList.contains('expanded');
            
            if (isVisible) {
                // Collapse section - first set exact height before transitioning to 0
                expensesContainer.style.maxHeight = expensesContainer.scrollHeight + 'px';
                // Force reflow to ensure the browser registers the maxHeight
                expensesContainer.offsetHeight;
                // Now set to 0 to trigger the animation
                expensesContainer.style.maxHeight = '0';
                expensesContainer.style.opacity = '0';
                expensesContainer.classList.remove('expanded');
                periodHeader.querySelector('.toggle-icon').textContent = '▼';
            } else {
                // Expand section
                expensesContainer.classList.add('expanded');
                expensesContainer.style.maxHeight = expensesContainer.scrollHeight + 'px';
                expensesContainer.style.opacity = '1';
                periodHeader.querySelector('.toggle-icon').textContent = '▲';
                
                // Adjust maxHeight after transition completes to allow for content growth
                setTimeout(() => {
                    if (expensesContainer.classList.contains('expanded')) {
                        expensesContainer.style.maxHeight = 'none';
                    }
                }, 300); // Should match transition duration
            }
        });
        
        // Add elements to period container
        periodElement.appendChild(periodHeader);
        periodElement.appendChild(expensesContainer);
        periodsListElement.appendChild(periodElement);
    });
    
    // Open the modal - modified to match application's modal opening pattern
    function openModal() {
        // Add the proper classes to show the modal and backdrop
        modal.classList.add('active');
        modalBackdrop.classList.add('active');
    }
    
    // Call openModal to display the modal
    openModal();
}

// Group expenses by day
function groupExpensesByDay(expenses) {
    const dailyExpenses = {};
    
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        // Create a day key in ISO format with year, month, and day
        const periodKey = new Date(
            expenseDate.getFullYear(), 
            expenseDate.getMonth(), 
            expenseDate.getDate()
        ).toISOString();
        
        if (!dailyExpenses[periodKey]) {
            dailyExpenses[periodKey] = {
                date: new Date(periodKey),
                expenses: []
            };
        }
        
        dailyExpenses[periodKey].expenses.push(expense);
    });
    
    return dailyExpenses;
}
