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

// Initialize circular currency picker FAB
function initCurrencyFAB() {
    // Define currencies (same as in initCurrencyPicker)
    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'CAD', symbol: '$', name: 'Canadian Dollar' }, // Changed from C$
        { code: 'AUD', symbol: '$', name: 'Australian Dollar' }, // Changed from A$
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
    ];
    
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    const currencyFab = document.getElementById('currency-fab');
    const currencyFabIcon = document.getElementById('currency-fab-icon');
    const currencyOptions = document.getElementById('currency-options');
    
    // Set initial currency icon
    const currentCurrency = currencies.find(c => c.code === userCurrency);
    if (currentCurrency) {
        currencyFabIcon.textContent = currentCurrency.symbol;
    }
    
    // Create currency options
    currencies.forEach(currency => {
        const option = document.createElement('div');
        option.className = 'currency-option';
        option.dataset.code = currency.code;
        option.innerHTML = `
            <div class="currency-icon">${currency.symbol}</div>
            <div class="currency-name">${currency.code}</div>
        `;
        
        // Add click handler for each option
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.setItem('userCurrency', currency.code);
            location.reload();
        });
        
        currencyOptions.appendChild(option);
    });
    
    // Toggle currency options on FAB click
    currencyFab.addEventListener('click', () => {
        currencyOptions.classList.toggle('active');
    });
    
    // Close currency options when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!currencyFab.contains(e.target) && !currencyOptions.contains(e.target)) {
            currencyOptions.classList.remove('active');
        }
    });
}

// Initialize the currency picker when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Remove initialization of navbar currency picker
    
    // Initialize the currency FAB
    initCurrencyFAB();
});
