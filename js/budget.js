/**
 * Budget management functionality
 */

// Budget class to represent a user's budget
class Budget {
    constructor(type, amount, userId) {
        this.type = type; // 'monthly' or 'weekly'
        this.amount = parseFloat(amount);
        this.userId = userId;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

// BudgetManager class to handle all budget operations
class BudgetManager {
    constructor() {
        this.budgets = {};
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.loadBudgets();
    }

    // Load budgets from localStorage
    loadBudgets() {
        if (!this.currentUser) return;
        
        const allBudgets = JSON.parse(localStorage.getItem('budgets') || '{}');
        this.budgets = allBudgets[this.currentUser.email] || {};
    }

    // Save budgets to localStorage
    saveBudgets() {
        if (!this.currentUser) return;
        
        const allBudgets = JSON.parse(localStorage.getItem('budgets') || '{}');
        allBudgets[this.currentUser.email] = this.budgets;
        localStorage.setItem('budgets', JSON.stringify(allBudgets));
    }

    // Set a budget
    setBudget(type, amount) {
        if (!this.currentUser) return null;
        if (type !== 'monthly' && type !== 'weekly') return null;
        
        const budget = new Budget(
            type,
            amount,
            this.currentUser.email
        );
        
        this.budgets[type] = budget;
        this.saveBudgets();
        
        // Dispatch event for budget updates
        document.dispatchEvent(new Event('budgetsUpdated'));
        
        return budget;
    }

    // Get a specific budget
    getBudget(type) {
        if (!this.budgets[type]) return null;
        return this.budgets[type];
    }

    // Get all budgets
    getAllBudgets() {
        return this.budgets;
    }

    // Check if spending exceeds budget
    checkBudgetStatus(type) {
        const budget = this.getBudget(type);
        if (!budget) return { 
            isSet: false, 
            percentage: 0, 
            isExceeded: false, 
            isWarning: false 
        };

        const expenses = expenseManager.getAllExpenses();
        let relevantExpenses = [];
        
        const today = new Date();
        
        if (type === 'monthly') {
            // Get expenses for current month
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            relevantExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear;
            });
        } else if (type === 'weekly') {
            // Get expenses for current week (Sunday to Saturday)
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            relevantExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= startOfWeek;
            });
        }
        
        const totalSpent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const percentage = (totalSpent / budget.amount) * 100;
        
        return {
            isSet: true,
            budget: budget.amount,
            spent: totalSpent,
            remaining: budget.amount - totalSpent,
            percentage: percentage,
            isExceeded: percentage > 100,
            isWarning: percentage >= 80 && percentage <= 100
        };
    }
}

// Initialize the budget manager
const budgetManager = new BudgetManager();

// Initialize budget UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBudgetUI();
    updateBudgetDisplays();
});

// Update budget displays
function updateBudgetDisplays() {
    updateBudgetDisplay('monthly');
    updateBudgetDisplay('weekly');
}

// Update a specific budget display
function updateBudgetDisplay(type) {
    const status = budgetManager.checkBudgetStatus(type);
    
    const budgetAmountElement = document.getElementById(`${type}-budget-amount`);
    const budgetElement = document.getElementById(`${type}-budget`);
    const spentElement = document.getElementById(`${type}-spent`);
    const percentageElement = document.getElementById(`${type}-percentage`);
    const progressBar = document.getElementById(`${type}-budget-bar`);
    const budgetCard = document.querySelector(`.budget-card.${type}`);
    
    // Clear existing classes from progress bar
    progressBar.classList.remove('warning', 'danger', 'exceeded');
    
    if (status.isSet) {
        // Update amount displays
        budgetAmountElement.textContent = formatCurrency(status.budget);
        budgetElement.textContent = formatCurrency(status.budget);
        spentElement.textContent = formatCurrency(status.spent);
        percentageElement.textContent = Math.round(status.percentage) + '%';
        
        // Update progress bar
        progressBar.style.width = Math.min(status.percentage, 100) + '%';
        
        // Check if budget is exceeded or nearing limits
        if (status.isExceeded) {
            progressBar.classList.add('exceeded');
            showBudgetExceededAlert(type);
            
            // If not already showing alert, add animation
            if (!budgetCard.classList.contains('exceeded')) {
                budgetCard.classList.add('shake');
                setTimeout(() => {
                    budgetCard.classList.remove('shake');
                }, 820); // Animation duration
            }
            
            budgetCard.classList.add('exceeded');
        } else if (status.isWarning) {
            progressBar.classList.add('warning');
            budgetCard.classList.remove('exceeded');
        } else {
            budgetCard.classList.remove('exceeded');
        }
    } else {
        // Show "Not Set" when budget is not set
        budgetAmountElement.textContent = 'Not Set';
        budgetElement.textContent = '$0.00';
        spentElement.textContent = '$0.00';
        percentageElement.textContent = '0%';
        progressBar.style.width = '0%';
    }
}

// Show budget exceeded alert
function showBudgetExceededAlert(type) {
    const status = budgetManager.checkBudgetStatus(type);
    
    // Only proceed if budget is actually exceeded
    if (!status.isExceeded) return;
    
    const budgetCard = document.querySelector(`.budget-card.${type}`);
    
    // Check if alert already exists
    let alertElement = budgetCard.querySelector('.budget-alert');
    
    if (!alertElement) {
        // Create new alert element
        alertElement = document.createElement('div');
        alertElement.className = 'budget-alert';
        
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
        const overBy = formatCurrency(status.spent - status.budget);
        
        alertElement.innerHTML = `${typeLabel} budget exceeded by <strong>${overBy}</strong>!`;
        budgetCard.appendChild(alertElement);
    }
    
    // Also show a notification if this is first time exceeding
    if (!budgetCard.classList.contains('exceeded')) {
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
        showMessage(`${typeLabel} budget exceeded! You've spent ${Math.round(status.percentage)}% of your budget.`, 'error');
    }
}

// Initialize budget UI elements
function initBudgetUI() {
    // Set up budget setting buttons
    const budgetButtons = document.querySelectorAll('.set-budget');
    budgetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.dataset.type;
            openBudgetModal(type);
        });
    });
    
    // Set up budget form
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const type = document.getElementById('budget-type').value;
            const amount = document.getElementById('budget-amount').value;
            
            // Validate input
            if (!amount || parseFloat(amount) <= 0) {
                showError(document.getElementById('budget-amount'), 'Please enter a valid amount');
                return;
            }
            
            // Set the budget
            budgetManager.setBudget(type, amount);
            
            // Update displays
            updateBudgetDisplays();
            
            // Close the modal
            closeAllModals();
            
            // Show success message
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
            showMessage(`${typeLabel} budget set to ${formatCurrency(amount)}`, 'success');
        });
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('#budget-modal .close-modal, #budget-modal .cancel-budget');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Add budget type selector functionality
    const monthlyOption = document.getElementById('budget-type-monthly');
    const weeklyOption = document.getElementById('budget-type-weekly');
    
    if (monthlyOption && weeklyOption) {
        monthlyOption.addEventListener('click', function() {
            document.getElementById('budget-type').value = 'monthly';
            document.getElementById('budget-type-title').textContent = 'Monthly';
            monthlyOption.classList.add('active');
            weeklyOption.classList.remove('active');
            
            // Update the info text and current spending
            updateBudgetModalInfo('monthly');
        });
        
        weeklyOption.addEventListener('click', function() {
            document.getElementById('budget-type').value = 'weekly';
            document.getElementById('budget-type-title').textContent = 'Weekly';
            weeklyOption.classList.add('active');
            monthlyOption.classList.remove('active');
            
            // Update the info text and current spending
            updateBudgetModalInfo('weekly');
        });
    }
    
    // Update budget displays when expenses are updated
    document.addEventListener('expensesUpdated', updateBudgetDisplays);
}

// Open budget setting modal
function openBudgetModal(type) {
    const modal = document.getElementById('budget-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const typeTitle = document.getElementById('budget-type-title');
    const typeInput = document.getElementById('budget-type');
    const amountInput = document.getElementById('budget-amount');
    
    // Set the budget type
    typeTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeInput.value = type;
    
    // Set current budget amount if it exists
    const currentBudget = budgetManager.getBudget(type);
    if (currentBudget) {
        amountInput.value = currentBudget.amount;
    } else {
        amountInput.value = '';
    }
    
    // Update the type selector buttons
    const monthlyOption = document.getElementById('budget-type-monthly');
    const weeklyOption = document.getElementById('budget-type-weekly');
    
    if (type === 'monthly') {
        monthlyOption.classList.add('active');
        weeklyOption.classList.remove('active');
    } else {
        weeklyOption.classList.add('active');
        monthlyOption.classList.remove('active');
    }
    
    // Update the info text and current spending
    updateBudgetModalInfo(type);
    
    // Show the modal
    modal.classList.add('active');
    modalBackdrop.classList.add('active');
    
    // Focus on the amount input
    setTimeout(() => {
        amountInput.focus();
    }, 100);
}

// Update budget modal info text and current spending
function updateBudgetModalInfo(type) {
    const infoText = document.getElementById('budget-info-text');
    const currentSpendingElement = document.getElementById('current-spending-amount');
    
    if (!infoText || !currentSpendingElement) return;
    
    // Get current spending for the period
    const now = new Date();
    const expenses = expenseManager.getAllExpenses();
    let relevantExpenses = [];
    let periodText = '';
    
    if (type === 'monthly') {
        // Get expenses for current month
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        relevantExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
        
        periodText = 'this month';
    } else if (type === 'weekly') {
        // Get expenses for current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        relevantExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startOfWeek;
        });
        
        periodText = 'this week';
    }
    
    const totalSpent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    currentSpendingElement.textContent = formatCurrency(totalSpent);
    
    // Update the info text
    if (type === 'monthly') {
        infoText.textContent = 'Set your total budget for the current month. This helps track your monthly spending patterns.';
    } else {
        infoText.textContent = 'Set your weekly spending budget. This helps manage your short-term expenses more effectively.';
    }
}
