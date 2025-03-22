/**
 * Expense management functions for the Expense Tracker application
 */

// Expense class to represent an expense
class Expense {
    constructor(id, amount, category, date, notes, userId) {
        this.id = id;
        this.amount = parseFloat(amount);
        this.category = category;
        this.date = date;
        this.notes = notes;
        this.userId = userId;
        this.createdAt = new Date().toISOString();
    }
}

// ExpenseManager class to handle all expense operations
class ExpenseManager {
    constructor() {
        this.expenses = [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.loadExpenses();
    }

    // Load expenses from localStorage
    loadExpenses() {
        if (!this.currentUser) return;
        
        const allExpenses = JSON.parse(localStorage.getItem('expenses') || '{}');
        this.expenses = allExpenses[this.currentUser.email] || [];
    }

    // Save expenses to localStorage
    saveExpenses() {
        if (!this.currentUser) return;
        
        const allExpenses = JSON.parse(localStorage.getItem('expenses') || '{}');
        allExpenses[this.currentUser.email] = this.expenses;
        localStorage.setItem('expenses', JSON.stringify(allExpenses));
    }

    // Add a new expense
    addExpense(amount, category, date, notes) {
        if (!this.currentUser) return null;
        
        const id = Date.now().toString();
        const expense = new Expense(
            id,
            amount,
            category,
            date,
            notes,
            this.currentUser.email
        );
        
        this.expenses.push(expense);
        this.saveExpenses();
        
        // Dispatch event for chart updates
        document.dispatchEvent(new Event('expensesUpdated'));
        
        return expense;
    }

    // Get all expenses
    getAllExpenses() {
        return [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Get expense by ID
    getExpenseById(id) {
        return this.expenses.find(expense => expense.id === id);
    }

    // Update an expense
    updateExpense(id, amount, category, date, notes) {
        const expenseIndex = this.expenses.findIndex(expense => expense.id === id);
        if (expenseIndex === -1) return null;
        
        this.expenses[expenseIndex].amount = parseFloat(amount);
        this.expenses[expenseIndex].category = category;
        this.expenses[expenseIndex].date = date;
        this.expenses[expenseIndex].notes = notes;
        
        this.saveExpenses();
        
        // Dispatch event for chart updates
        document.dispatchEvent(new Event('expensesUpdated'));
        
        return this.expenses[expenseIndex];
    }

    // Delete an expense
    deleteExpense(id) {
        const expenseIndex = this.expenses.findIndex(expense => expense.id === id);
        if (expenseIndex === -1) return false;
        
        this.expenses.splice(expenseIndex, 1);
        this.saveExpenses();
        
        // Dispatch event for chart updates
        document.dispatchEvent(new Event('expensesUpdated'));
        
        return true;
    }

    // Search expenses
    searchExpenses(query) {
        if (!query) return this.getAllExpenses();
        
        query = query.toLowerCase();
        return this.getAllExpenses().filter(expense => 
            expense.category.toLowerCase().includes(query) ||
            expense.notes.toLowerCase().includes(query) ||
            expense.amount.toString().includes(query) ||
            formatDate(expense.date).toLowerCase().includes(query)
        );
    }
}

// Initialize the expense manager
const expenseManager = new ExpenseManager();

// Helper function to get category name from its value
function getCategoryName(categoryValue) {
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
    
    return categories[categoryValue] || 'Other';
}

// Helper function to format currency
function formatCurrency(amount) {
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: userCurrency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Add currency picker functionality
function initCurrencyPicker() {
    // Define currencies with their symbols
    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
    ];
    
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    
    // Find the navbar user-info section where we want to add the currency picker
    const userInfoSection = document.querySelector('.user-info');
    if (!userInfoSection) return;
    
    // Create currency picker element
    const currencyPicker = document.createElement('div');
    currencyPicker.className = 'currency-picker';
    currencyPicker.innerHTML = `
        <select id="currency-select" title="Change currency">
            ${currencies.map(curr => 
                `<option value="${curr.code}" ${curr.code === userCurrency ? 'selected' : ''}>
                    ${curr.symbol} ${curr.code}
                </option>`
            ).join('')}
        </select>
    `;
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .currency-picker {
            display: flex;
            align-items: center;
            margin-right: 15px;
        }
        .currency-picker select {
            padding: 6px 12px;
            border-radius: 6px;
            background-color: var(--bg-card, white);
            border: 1px solid var(--border-color, #ddd);
            font-size: 14px;
            font-weight: 500;
            color: var(--text-color, #333);
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 8px center;
            padding-right: 28px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .currency-picker select:hover {
            border-color: var(--primary-color, #3498db);
        }
        .currency-picker select:focus {
            outline: none;
            border-color: var(--primary-color, #3498db);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        .currency-picker select option {
            padding: 8px;
            background-color: var(--bg-card, white);
            color: var(--text-color, #333);
        }
        [data-theme="dark"] .currency-picker select {
            background-color: var(--bg-card, #333);
            color: var(--text-color, #f5f5f5);
            border-color: var(--border-color, #555);
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23bbb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        }
        [data-theme="dark"] .currency-picker select option {
            background-color: var(--bg-card, #333);
            color: var(--text-color, #f5f5f5);
        }
    `;
    document.head.appendChild(style);
    
    // Insert the currency picker before the user name in the nav
    const userName = userInfoSection.querySelector('#user-name');
    if (userName) {
        userInfoSection.insertBefore(currencyPicker, userName);
    } else {
        userInfoSection.appendChild(currencyPicker);
    }
    
    // Add event listener
    document.getElementById('currency-select').addEventListener('change', function() {
        localStorage.setItem('userCurrency', this.value);
        // Refresh page to apply new currency
        location.reload();
    });
}

// Initialize the currency picker when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize on all pages that have a navbar
    if (document.querySelector('.user-info')) {
        initCurrencyPicker();
    }
});
