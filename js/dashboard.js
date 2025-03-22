/**
 * Dashboard functionality for the Expense Tracker application
 */

// Global filter state
let filterState = {
    dateRange: 'all',
    startDate: null,
    endDate: null,
    category: 'all',
    minAmount: null,
    maxAmount: null,
    searchQuery: ''
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    requireAuth();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display user's name or fullname with priority, fallback to email
    const displayName = currentUser.fullname || currentUser.name || currentUser.email;
    document.getElementById('user-name').textContent = displayName;
    
    // Fix duplicate logout button event listener - keep only one
    document.getElementById('logout-btn').addEventListener('click', function() {
        // Clear all user-related data from localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        
        // You might want to keep expense data for the next login, but if you want to clear it:
        // localStorage.removeItem('expenses');
        // localStorage.removeItem('budgets');
        
        // Redirect to login page
        window.location.href = 'index.html';
    });
    
    // Initialize expense form
    initExpenseForm();
    
    // Initialize expense list with descending order
    renderExpenseList();
    
    // Initialize search functionality
    initSearchFunctionality();
    
    // Initialize modal functionality
    initModals();

    // Initialize search and filter functionality
    initSearchAndFilters();
    
    // Reorganize dashboard layout to place expenses box beside budgets
    reorganizeDashboardLayout();
});

// Initialize the expense form
function initExpenseForm() {
    const expenseForm = document.getElementById('expense-form');
    const dateInput = document.getElementById('expense-date');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    expenseForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const amount = document.getElementById('expense-amount').value;
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const notes = document.getElementById('expense-notes').value;
        
        // Validate the form
        let hasError = false;
        
        if (!amount || parseFloat(amount) <= 0) {
            showError(document.getElementById('expense-amount'), 'Please enter a valid amount');
            hasError = true;
        }
        
        if (!category) {
            showError(document.getElementById('expense-category'), 'Please select a category');
            hasError = true;
        }
        
        if (!date) {
            showError(document.getElementById('expense-date'), 'Please select a date');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Add the expense
        const expense = expenseManager.addExpense(amount, category, date, notes);
        if (expense) {
            // Reset the form
            expenseForm.reset();
            dateInput.value = today;
            
            // Update the expense list
            renderExpenseList();
            
            // Show success message
            showMessage('Expense added successfully!', 'success');
            
            // Check budget status after adding expense
            checkBudgetAlerts();
        }
    });
    
    // Clear error when input changes
    document.getElementById('expense-amount').addEventListener('input', function() {
        clearError(this);
    });
    
    document.getElementById('expense-category').addEventListener('change', function() {
        clearError(this);
    });
    
    document.getElementById('expense-date').addEventListener('input', function() {
        clearError(this);
    });
}

// Render the expense list - modified to sort expenses in descending order and limit to 3
function renderExpenseList(expenses = null, animate = false) {
    const expenseList = document.getElementById('expense-list');
    const emptyState = document.getElementById('empty-state');
    const noResults = document.getElementById('no-results');
    
    // If expenses not provided, get filtered expenses
    if (expenses === null) {
        const allExpenses = expenseManager.getAllExpenses();
        expenses = filterExpenses(allExpenses);
    }
    
    // Always ensure expenses are sorted by date in descending order (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limit to 3 most recent expenses for dashboard view
    const displayExpenses = expenses.slice(0, 3);
    
    // Handle animations for existing items if requested
    if (animate) {
        const existingItems = expenseList.querySelectorAll('.expense-item');
        if (existingItems.length > 0) {
            // Add fade-out animation to existing items
            existingItems.forEach(item => {
                item.classList.add('fade-out');
            });
            
            // Wait for animation to complete before updating the list
            setTimeout(() => {
                updateExpenseListItems(expenseList, displayExpenses, emptyState, noResults, expenses.length > 3);
            }, 300); // Match the animation duration
            return;
        }
    }
    
    // No animation or no existing items
    updateExpenseListItems(expenseList, displayExpenses, emptyState, noResults, expenses.length > 3);
}

// Update the expense list items - modified to add "view all" button if needed
function updateExpenseListItems(expenseList, expenses, emptyState, noResults, hasMore = false) {
    // Clear the current list except the empty state and no results
    const expenseItems = expenseList.querySelectorAll('.expense-item');
    expenseItems.forEach(item => item.remove());
    
    // Remove existing "View All" button if present
    const existingViewAll = expenseList.querySelector('.view-all-expenses');
    if (existingViewAll) {
        existingViewAll.remove();
    }
    
    // Show empty state if no expenses at all (not filtered)
    if (expenseManager.getAllExpenses().length === 0) {
        emptyState.style.display = 'block';
        noResults.style.display = 'none';
        return;
    }
    
    // Show no results message if filtered to zero but have expenses
    if (expenses.length === 0) {
        emptyState.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    // Hide both messages if we have expenses to show
    emptyState.style.display = 'none';
    noResults.style.display = 'none';
    
    // Add each expense to the list
    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item fade-in';
        expenseItem.dataset.id = expense.id;
        
        const categoryName = getCategoryName(expense.category);
        
        expenseItem.innerHTML = `
            <div class="expense-item-main">
                <div class="expense-header">
                    <span class="category-badge category-${expense.category}">${categoryName}</span>
                    <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="expense-date">${formatDate(expense.date)}</div>
                ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
            </div>
            <div class="expense-actions">
                <button class="edit-btn" title="Edit expense">✏️</button>
                <button class="delete-btn" title="Delete expense">🗑️</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const editBtn = expenseItem.querySelector('.edit-btn');
        const deleteBtn = expenseItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => openEditExpenseModal(expense.id));
        deleteBtn.addEventListener('click', () => openDeleteExpenseModal(expense.id));
        
        // Append to the list instead of insertBefore to maintain correct order
        expenseList.appendChild(expenseItem);
    });
    
    // Add "View All" button if there are more expenses
    if (hasMore) {
        const viewAllBtn = document.createElement('div');
        viewAllBtn.className = 'view-all-expenses';
        viewAllBtn.innerHTML = `View All Expenses <span class="view-all-icon">→</span>`;
        viewAllBtn.addEventListener('click', function() {
            // Instead of toggling filters, open a popup with all expenses
            openExpensesPopup();
        });
        expenseList.appendChild(viewAllBtn);
    }
}

// New function to display all expenses in a popup
function openExpensesPopup() {
    const allExpenses = expenseManager.getAllExpenses();
    
    // Create a local filter state for the popup
    const popupFilterState = {
        dateRange: 'all',
        startDate: null,
        endDate: null,
        category: 'all',
        minAmount: null,
        maxAmount: null,
        searchQuery: ''
    };
    
    // Create the modal element
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'all-expenses-modal';
    
    // Create modal content with search and filters
    modal.innerHTML = `
        <div class="modal-content expenses-modal-content">
            <div class="modal-header">
                <h3>All Expenses</h3>
                <button class="close-modal">&times;</button>
            </div>
            
            <div class="expense-controls popup-expense-controls">
                <div class="search-box">
                    <input type="text" id="popup-expense-search" placeholder="Search expenses...">
                    <button type="button" class="search-clear" id="popup-clear-search">×</button>
                </div>
                <button id="popup-toggle-filters" class="btn btn-outline btn-sm">
                    <span id="popup-filter-icon">🔍</span> Filters
                </button>
            </div>
            
            <div class="advanced-filters" id="popup-advanced-filters">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="popup-filter-date-range">Date Range</label>
                        <select id="popup-filter-date-range">
                            <option value="all">All Time</option>
                            <option value="month">This Month</option>
                            <option value="week">This Week</option>
                            <option value="day">Today</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div class="filter-group custom-date-range" id="popup-custom-date-container">
                        <div class="date-range-inputs">
                            <div class="date-input">
                                <label for="popup-filter-date-start">From</label>
                                <input type="date" id="popup-filter-date-start">
                            </div>
                            <div class="date-input">
                                <label for="popup-filter-date-end">To</label>
                                <input type="date" id="popup-filter-date-end">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="popup-filter-category">Category</label>
                        <select id="popup-filter-category">
                            <option value="all">All Categories</option>
                            <option value="food">Food & Dining</option>
                            <option value="transportation">Transportation</option>
                            <option value="housing">Housing & Rent</option>
                            <option value="utilities">Utilities</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="shopping">Shopping</option>
                            <option value="health">Health & Medical</option>
                            <option value="travel">Travel</option>
                            <option value="education">Education</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Amount Range</label>
                        <div class="amount-range-inputs">
                            <div class="amount-input">
                                <label for="popup-filter-amount-min">Min</label>
                                <input type="number" id="popup-filter-amount-min" placeholder="0" step="0.01" min="0">
                            </div>
                            <div class="amount-input">
                                <label for="popup-filter-amount-max">Max</label>
                                <input type="number" id="popup-filter-amount-max" placeholder="∞" step="0.01" min="0">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="filter-actions">
                    <button id="popup-apply-filters" class="btn btn-primary btn-sm">Apply Filters</button>
                    <button id="popup-reset-filters" class="btn btn-outline btn-sm">Reset</button>
                </div>
            </div>
            
            <!-- Active Filters Display -->
            <div class="active-filters" id="popup-active-filters"></div>

            <div class="filter-results-summary" id="popup-filter-results-summary"></div>
            
            <div class="expenses-list-container">
                <div class="expenses-list" id="all-expenses-list"></div>
                <div class="no-results" id="popup-no-results" style="display: none;">
                    <p>No expenses match your search criteria.</p>
                    <button id="popup-clear-all-filters" class="btn btn-outline btn-sm">Clear All Filters</button>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-outline close-popup">Close</button>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    document.body.appendChild(modal);
    
    // Make backdrop visible
    const modalBackdrop = document.getElementById('modal-backdrop');
    modalBackdrop.classList.add('active');
    
    // Set default date values for custom date range
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    document.getElementById('popup-filter-date-end').value = endDateStr;
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    document.getElementById('popup-filter-date-start').value = startDateStr;
    
    // Initialize filter functionality
    initPopupFilters(popupFilterState, allExpenses);
    
    // Initial render of expenses
    renderPopupExpenses(allExpenses, popupFilterState);
    
    // Add event listeners to close buttons
    const closeButtons = modal.querySelectorAll('.close-modal, .close-popup');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeExpensesPopup);
    });
    
    // Also close when clicking on backdrop
    modalBackdrop.addEventListener('click', closeExpensesPopup);
    
    // Add some custom styles for this modal
    const styleElement = document.createElement('style');
    styleElement.id = 'expenses-popup-styles';
    styleElement.textContent = `
        .expenses-modal-content {
            width: 95%;
            max-width: 1100px;
        }
        
        .popup-content-layout {
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }
        
        .expenses-list-container {
            flex: 1;
            max-height: 70vh;
            overflow-y: auto;
            padding: 0 10px;
            min-width: 0;
        }
        
        #all-expenses-list {
            margin: 10px 0;
        }
        
        #all-expenses-list .expense-item:last-child {
            border-bottom: 1px solid var(--border-color);
        }
        
        .popup-expense-controls {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .popup-expense-controls .search-box {
            width: 200px;
        }
        
        .filters-side-container {
            width: 280px;
            min-width: 280px;
        }
        
        .filters-side-container h4 {
            margin: 0 0 15px 0;
            color: var(--text-color);
            font-size: 16px;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }
        
        #popup-advanced-filters {
            width: 100%;
            background-color: transparent;
            padding: 0;
            border: none;
            box-shadow: none;
            margin-top: 10px;
            position: static;
            display: block !important;
            opacity: 1 !important;
            transform: none !important;
            visibility: visible !important;
        }
        
        #popup-toggle-filters {
            display: none;
        }
        
        .filter-results-summary {
            margin-bottom: 10px;
            font-style: italic;
            font-size: 14px;
            color: #666;
        }
        
        .active-filters {
            margin-bottom: 15px;
        }

        #popup-custom-date-container.show {
            display: block;
        }

        #popup-custom-date-container {
            display: none;
        }

        .filters-side-container .filter-row {
            margin-bottom: 15px;
        }
        
        .filters-side-container .filter-actions {
            margin-top: 20px;
        }
        
        #popup-advanced-filters .filter-group select,
        #popup-advanced-filters .filter-group input {
            background-color: white;
            border: 1px solid #ddd;
        }
    `;
    document.head.appendChild(styleElement);
    
    // After the modal is added, restructure it for side-by-side layout
    setTimeout(() => {
        // Get elements we need to restructure
        const expensesContainer = document.querySelector('.expenses-list-container');
        const filterSection = document.getElementById('popup-advanced-filters');
        const resultsSection = document.getElementById('popup-filter-results-summary');
        const activeFiltersSection = document.getElementById('popup-active-filters');
        
        if (!expensesContainer || !filterSection) {
            console.error('Could not find required elements for popup layout');
            return;
        }
        
        // Create wrapper for side-by-side layout
        const contentLayout = document.createElement('div');
        contentLayout.className = 'popup-content-layout';
        
        // Get parent of expenses container
        const parent = expensesContainer.parentNode;
        
        // Create filters container with a heading
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'filters-side-container';
        
        // Create header for filter section
        const filtersHeading = document.createElement('h4');
        filtersHeading.textContent = 'Filter Options';
        
        // Restructure the DOM - order matters for visual hierarchy
        parent.insertBefore(contentLayout, expensesContainer);
        contentLayout.appendChild(expensesContainer);
        
        // Build the filter container in proper order
        filtersContainer.appendChild(filtersHeading);
        if (activeFiltersSection) filtersContainer.appendChild(activeFiltersSection);
        if (resultsSection) filtersContainer.appendChild(resultsSection);
        filtersContainer.appendChild(filterSection);
        
        // Add the filter container to the layout
        contentLayout.appendChild(filtersContainer);
        
        // Force the filter section to be visible
        filterSection.style.display = 'block';
        filterSection.classList.add('show');
        
        console.log('Popup layout restructured, filters should be visible');
    }, 100); // Increased timeout for more reliability
}

// Function to initialize filters in the popup
function initPopupFilters(popupFilterState, allExpenses) {
    // Search functionality
    const searchInput = document.getElementById('popup-expense-search');
    const clearButton = document.getElementById('popup-clear-search');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        // Highlight the clear button if there's text
        if (query.length > 0) {
            this.parentElement.classList.add('has-value');
        } else {
            this.parentElement.classList.remove('has-value');
        }
        
        popupFilterState.searchQuery = query;
        renderPopupExpenses(allExpenses, popupFilterState);
    });
    
    // Clear search button
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.parentElement.classList.remove('has-value');
        popupFilterState.searchQuery = '';
        renderPopupExpenses(allExpenses, popupFilterState);
    });
    
    // Toggle filters button
    document.getElementById('popup-toggle-filters').addEventListener('click', function() {
        const filterSection = document.getElementById('popup-advanced-filters');
        filterSection.classList.toggle('show');
        
        // Update button icon
        const filterIcon = document.getElementById('popup-filter-icon');
        if (filterSection.classList.contains('show')) {
            filterIcon.textContent = '🔽'; // Down arrow for open state
        } else {
            filterIcon.textContent = '🔍'; // Magnifying glass for closed state
        }
    });
    
    // Date range filter
    const dateRangeSelect = document.getElementById('popup-filter-date-range');
    const customDateContainer = document.getElementById('popup-custom-date-container');
    const startDateInput = document.getElementById('popup-filter-date-start');
    const endDateInput = document.getElementById('popup-filter-date-end');
    
    dateRangeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateContainer.classList.add('show');
        } else {
            customDateContainer.classList.remove('show');
        }
        
        popupFilterState.dateRange = this.value;
        
        if (this.value !== 'custom') {
            popupFilterState.startDate = null;
            popupFilterState.endDate = null;
        }
    });
    
    // Handle custom date inputs
    startDateInput.addEventListener('change', function() {
        popupFilterState.startDate = this.value ? new Date(this.value) : null;
    });
    
    endDateInput.addEventListener('change', function() {
        popupFilterState.endDate = this.value ? new Date(this.value) : null;
    });
    
    // Category filter
    const categorySelect = document.getElementById('popup-filter-category');
    categorySelect.addEventListener('change', function() {
        popupFilterState.category = this.value;
    });
    
    // Amount range filters
    const minAmountInput = document.getElementById('popup-filter-amount-min');
    const maxAmountInput = document.getElementById('popup-filter-amount-max');
    
    minAmountInput.addEventListener('input', function() {
        popupFilterState.minAmount = this.value ? parseFloat(this.value) : null;
    });
    
    maxAmountInput.addEventListener('input', function() {
        popupFilterState.maxAmount = this.value ? parseFloat(this.value) : null;
    });
    
    // Apply filters button
    document.getElementById('popup-apply-filters').addEventListener('click', function() {
        renderPopupExpenses(allExpenses, popupFilterState);
        updatePopupActiveFilters(popupFilterState, allExpenses);
    });
    
    // Reset filters button
    document.getElementById('popup-reset-filters').addEventListener('click', function() {
        resetPopupFilters(popupFilterState, false);
        updatePopupActiveFilters(popupFilterState, allExpenses);
        renderPopupExpenses(allExpenses, popupFilterState);
    });
    
    // Clear all filters button
    document.getElementById('popup-clear-all-filters').addEventListener('click', function() {
        resetPopupFilters(popupFilterState, true);
        updatePopupActiveFilters(popupFilterState, allExpenses);
        renderPopupExpenses(allExpenses, popupFilterState);
    });
}

// Function to reset popup filters
function resetPopupFilters(popupFilterState, includeSearch = false) {
    document.getElementById('popup-filter-date-range').value = 'all';
    document.getElementById('popup-custom-date-container').classList.remove('show');
    document.getElementById('popup-filter-category').value = 'all';
    document.getElementById('popup-filter-amount-min').value = '';
    document.getElementById('popup-filter-amount-max').value = '';
    
    if (includeSearch) {
        document.getElementById('popup-expense-search').value = '';
        document.getElementById('popup-expense-search').parentElement.classList.remove('has-value');
    }
    
    // Reset filter state
    popupFilterState.dateRange = 'all';
    popupFilterState.startDate = null;
    popupFilterState.endDate = null;
    popupFilterState.category = 'all';
    popupFilterState.minAmount = null;
    popupFilterState.maxAmount = null;
    
    if (includeSearch) {
        popupFilterState.searchQuery = '';
    }
    
    // Reset date fields
    const today = new Date();
    document.getElementById('popup-filter-date-end').value = today.toISOString().split('T')[0];
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    document.getElementById('popup-filter-date-start').value = startDate.toISOString().split('T')[0];
}

// Function to update active filters in the popup
function updatePopupActiveFilters(popupFilterState, allExpenses) {
    const activeFiltersContainer = document.getElementById('popup-active-filters');
    activeFiltersContainer.innerHTML = '';
    
    // Date range filter
    if (popupFilterState.dateRange && popupFilterState.dateRange !== 'all') {
        let dateLabel;
        
        switch(popupFilterState.dateRange) {
            case 'month':
                dateLabel = 'This Month';
                break;
            case 'week':
                dateLabel = 'This Week';
                break;
            case 'day':
                dateLabel = 'Today';
                break;
            case 'custom':
                const startStr = popupFilterState.startDate ? formatDate(popupFilterState.startDate) : 'Any';
                const endStr = popupFilterState.endDate ? formatDate(popupFilterState.endDate) : 'Any';
                dateLabel = `${startStr} to ${endStr}`;
                break;
        }
        
        addPopupActiveFilterTag(activeFiltersContainer, 'Date: ' + dateLabel, () => {
            popupFilterState.dateRange = 'all';
            document.getElementById('popup-filter-date-range').value = 'all';
            document.getElementById('popup-custom-date-container').classList.remove('show');
            renderPopupExpenses(allExpenses, popupFilterState);
            updatePopupActiveFilters(popupFilterState, allExpenses);
        });
    }
    
    // Category filter
    if (popupFilterState.category && popupFilterState.category !== 'all') {
        const categoryName = getCategoryName(popupFilterState.category);
        addPopupActiveFilterTag(activeFiltersContainer, 'Category: ' + categoryName, () => {
            popupFilterState.category = 'all';
            document.getElementById('popup-filter-category').value = 'all';
            renderPopupExpenses(allExpenses, popupFilterState);
            updatePopupActiveFilters(popupFilterState, allExpenses);
        });
    }
    
    // Min amount filter
    if (popupFilterState.minAmount !== null) {
        addPopupActiveFilterTag(activeFiltersContainer, 'Min: ' + formatCurrency(popupFilterState.minAmount), () => {
            popupFilterState.minAmount = null;
            document.getElementById('popup-filter-amount-min').value = '';
            renderPopupExpenses(allExpenses, popupFilterState);
            updatePopupActiveFilters(popupFilterState, allExpenses);
        });
    }
    
    // Max amount filter
    if (popupFilterState.maxAmount !== null) {
        addPopupActiveFilterTag(activeFiltersContainer, 'Max: ' + formatCurrency(popupFilterState.maxAmount), () => {
            popupFilterState.maxAmount = null;
            document.getElementById('popup-filter-amount-max').value = '';
            renderPopupExpenses(allExpenses, popupFilterState);
            updatePopupActiveFilters(popupFilterState, allExpenses);
        });
    }
    
    // Search query
    if (popupFilterState.searchQuery) {
        addPopupActiveFilterTag(activeFiltersContainer, 'Search: ' + popupFilterState.searchQuery, () => {
            popupFilterState.searchQuery = '';
            document.getElementById('popup-expense-search').value = '';
            document.getElementById('popup-expense-search').parentElement.classList.remove('has-value');
            renderPopupExpenses(allExpenses, popupFilterState);
            updatePopupActiveFilters(popupFilterState, allExpenses);
        });
    }
}

// Add an active filter tag to the popup display
function addPopupActiveFilterTag(container, label, removeCallback) {
    const tagElement = document.createElement('div');
    tagElement.className = 'active-filter';
    tagElement.innerHTML = `
        ${label}
        <span class="remove-filter">×</span>
    `;
    
    tagElement.querySelector('.remove-filter').addEventListener('click', removeCallback);
    container.appendChild(tagElement);
}

// Function to render filtered expenses in the popup
function renderPopupExpenses(allExpenses, popupFilterState) {
    const expensesList = document.getElementById('all-expenses-list');
    const noResults = document.getElementById('popup-no-results');
    
    // Filter expenses based on the popup filter state
    const filteredExpenses = allExpenses.filter(expense => {
        // Apply date filters
        if (!popupPassesDateFilter(expense, popupFilterState)) return false;
        
        // Apply category filter
        if (popupFilterState.category !== 'all' && expense.category !== popupFilterState.category) return false;
        
        // Apply amount filters
        if (popupFilterState.minAmount !== null && expense.amount < popupFilterState.minAmount) return false;
        if (popupFilterState.maxAmount !== null && expense.amount > popupFilterState.maxAmount) return false;
        
        // Apply search query
        if (popupFilterState.searchQuery && !popupMatchesSearchQuery(expense, popupFilterState.searchQuery)) return false;
        
        // Passed all filters
        return true;
    });
    
    // Update results summary
    const summaryElement = document.getElementById('popup-filter-results-summary');
    if (filteredExpenses.length === allExpenses.length) {
        summaryElement.innerHTML = '';
    } else {
        summaryElement.innerHTML = `Showing ${filteredExpenses.length} of ${allExpenses.length} expenses`;
    }
    
    // Clear the current list
    expensesList.innerHTML = '';
    
    // Show no results message if filtered to zero
    if (filteredExpenses.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }
    
    // Add each filtered expense to the list
    filteredExpenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item fade-in';
        expenseItem.dataset.id = expense.id;
        
        const categoryName = getCategoryName(expense.category);
        
        expenseItem.innerHTML = `
            <div class="expense-item-main">
                <div class="expense-header">
                    <span class="category-badge category-${expense.category}">${categoryName}</span>
                    <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="expense-date">${formatDate(expense.date)}</div>
                ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
            </div>
            <div class="expense-actions">
                <button class="edit-btn" title="Edit expense">✏️</button>
                <button class="delete-btn" title="Delete expense">🗑️</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const editBtn = expenseItem.querySelector('.edit-btn');
        const deleteBtn = expenseItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => {
            closeExpensesPopup();
            openEditExpenseModal(expense.id);
        });
        
        deleteBtn.addEventListener('click', () => {
            closeExpensesPopup();
            openDeleteExpenseModal(expense.id);
        });
        
        expensesList.appendChild(expenseItem);
    });
    
    // Make sure we update the active filters
    updatePopupActiveFilters(popupFilterState, allExpenses);
}

// Check if an expense passes the date filter in the popup
function popupPassesDateFilter(expense, popupFilterState) {
    const expenseDate = new Date(expense.date);
    
    // Custom date range
    if (popupFilterState.dateRange === 'custom') {
        if (popupFilterState.startDate && expenseDate < popupFilterState.startDate) return false;
        if (popupFilterState.endDate) {
            const endCompare = new Date(popupFilterState.endDate);
            endCompare.setHours(23, 59, 59); // End of the day
            if (expenseDate > endCompare) return false;
        }
        return true;
    }
    
    // Today
    if (popupFilterState.dateRange === 'day') {
        const today = new Date();
        return expenseDate.getDate() === today.getDate() && 
               expenseDate.getMonth() === today.getMonth() &&
               expenseDate.getFullYear() === today.getFullYear();
    }
    
    // This week
    if (popupFilterState.dateRange === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return expenseDate >= startOfWeek;
    }
    
    // This month
    if (popupFilterState.dateRange === 'month') {
        const today = new Date();
        return expenseDate.getMonth() === today.getMonth() && 
               expenseDate.getFullYear() === today.getFullYear();
    }
    
    // All time
    return true;
}

// Check if an expense matches the search query in the popup
function popupMatchesSearchQuery(expense, query) {
    query = query.toLowerCase();
    
    // Search in category
    if (getCategoryName(expense.category).toLowerCase().includes(query)) return true;
    
    // Search in notes
    if (expense.notes && expense.notes.toLowerCase().includes(query)) return true;
    
    // Search in amount
    if (expense.amount.toString().includes(query)) return true;
    
    // Search in date
    if (formatDate(expense.date).toLowerCase().includes(query)) return true;
    
    return false;
}

// Function to close the expenses popup
function closeExpensesPopup() {
    const modal = document.getElementById('all-expenses-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    const modalBackdrop = document.getElementById('modal-backdrop');
    modalBackdrop.classList.remove('active');
    
    // Remove the custom styles
    const styleElement = document.getElementById('expenses-popup-styles');
    if (styleElement) {
        document.head.removeChild(styleElement);
    }
}

// Initialize search functionality
function initSearchFunctionality() {
    const searchInput = document.getElementById('expense-search');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        const filteredExpenses = expenseManager.searchExpenses(query);
        renderExpenseList(filteredExpenses);
    });
}

// Initialize modal functionality
function initModals() {
    const modalBackdrop = document.getElementById('modal-backdrop');
    const editExpenseModal = document.getElementById('edit-expense-modal');
    const deleteExpenseModal = document.getElementById('delete-expense-modal');
    
    // Initialize Add Expense FAB button
    const addExpenseFab = document.getElementById('add-expense-fab');
    const addExpenseModal = document.getElementById('add-expense-modal');
    
    if (addExpenseFab) {
        addExpenseFab.addEventListener('click', function() {
            addExpenseModal.classList.add('active');
            modalBackdrop.classList.add('active');
        });
    }
    
    // Close modals when clicking backdrop
    modalBackdrop.addEventListener('click', closeAllModals);
    
    // Close buttons for modals
    const closeButtons = document.querySelectorAll('.close-modal, .cancel-edit, .cancel-delete');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Edit form submission
    const editExpenseForm = document.getElementById('edit-expense-form');
    editExpenseForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const id = document.getElementById('edit-expense-id').value;
        const amount = document.getElementById('edit-expense-amount').value;
        const category = document.getElementById('edit-expense-category').value;
        const date = document.getElementById('edit-expense-date').value;
        const notes = document.getElementById('edit-expense-notes').value;
        
        const updatedExpense = expenseManager.updateExpense(id, amount, category, date, notes);
        
        if (updatedExpense) {
            closeAllModals();
            renderExpenseList();
            showMessage('Expense updated successfully!', 'success');
        }
    });
    
    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    confirmDeleteBtn.addEventListener('click', function() {
        const id = this.dataset.id;
        
        const deleted = expenseManager.deleteExpense(id);
        
        if (deleted) {
            closeAllModals();
            
            // Find and animate the deleted expense item
            const expenseItem = document.querySelector(`.expense-item[data-id="${id}"]`);
            if (expenseItem) {
                expenseItem.classList.add('slide-out');
                expenseItem.addEventListener('animationend', function() {
                    renderExpenseList();
                    showMessage('Expense deleted successfully!', 'success');
                });
            } else {
                renderExpenseList();
                showMessage('Expense deleted successfully!', 'success');
            }
        }
    });
}

// Open edit expense modal
function openEditExpenseModal(id) {
    const expense = expenseManager.getExpenseById(id);
    if (!expense) return;
    
    // Set form values
    document.getElementById('edit-expense-id').value = expense.id;
    document.getElementById('edit-expense-amount').value = expense.amount;
    document.getElementById('edit-expense-category').value = expense.category;
    document.getElementById('edit-expense-date').value = expense.date;
    document.getElementById('edit-expense-notes').value = expense.notes;
    
    // Open the modal
    document.getElementById('edit-expense-modal').classList.add('active');
    document.getElementById('modal-backdrop').classList.add('active');
}

// Open delete expense modal
function openDeleteExpenseModal(id) {
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    confirmDeleteBtn.dataset.id = id;
    
    // Open the modal
    document.getElementById('delete-expense-modal').classList.add('active');
    document.getElementById('modal-backdrop').classList.add('active');
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('modal-backdrop').classList.remove('active');
}

// Show error message in form
function showError(inputElement, message) {
    const errorElement = document.getElementById(`${inputElement.id}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        inputElement.classList.add('error');
    }
}

// Clear error message in form
function clearError(inputElement) {
    const errorElement = document.getElementById(`${inputElement.id}-error`);
    if (errorElement) {
        errorElement.textContent = '';
        inputElement.classList.remove('error');
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <div class="message-content">
            ${message}
            <button class="close-message">×</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(messageElement);
    
    // Add animation
    setTimeout(() => {
        messageElement.classList.add('message-show');
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        messageElement.classList.remove('message-show');
        messageElement.addEventListener('transitionend', () => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        });
    }, 3000);
    
    // Close button
    const closeBtn = messageElement.querySelector('.close-message');
    closeBtn.addEventListener('click', () => {
        messageElement.classList.remove('message-show');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    });
}

// Check budget alerts after expense operations
function checkBudgetAlerts() {
    // Check monthly budget
    const monthlyStatus = budgetManager.checkBudgetStatus('monthly');
    if (monthlyStatus.isSet && monthlyStatus.isExceeded) {
        updateBudgetDisplay('monthly');
    }
    
    // Check weekly budget
    const weeklyStatus = budgetManager.checkBudgetStatus('weekly');
    if (weeklyStatus.isSet && weeklyStatus.isExceeded) {
        updateBudgetDisplay('weekly');
    }
}

// Initialize search and filter functionality
function initSearchAndFilters() {
    // Initialize search functionality with real-time updates
    initRealTimeSearch();
    
    // Initialize advanced filters
    initAdvancedFilters();
    
    // Set up filter toggle button
    document.getElementById('toggle-filters').addEventListener('click', function() {
        const filterSection = document.getElementById('advanced-filters');
        filterSection.classList.toggle('show');
        
        // Update button icon
        const filterIcon = document.getElementById('filter-icon');
        if (filterSection.classList.contains('show')) {
            filterIcon.textContent = '🔍';
        } else {
            filterIcon.textContent = '🔍';
        }
    });
}

// Initialize real-time search
function initRealTimeSearch() {
    const searchInput = document.getElementById('expense-search');
    const clearButton = document.getElementById('clear-search');
    
    // Real-time search as user types
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        // Highlight the clear button if there's text
        if (query.length > 0) {
            this.parentElement.classList.add('has-value');
        } else {
            this.parentElement.classList.remove('has-value');
        }
        
        // Update filter state
        filterState.searchQuery = query;
        
        // Apply filters with a small debounce
        debounce(applyFiltersAndRender, 300)();
    });
    
    // Clear search button
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.parentElement.classList.remove('has-value');
        filterState.searchQuery = '';
        applyFiltersAndRender();
    });
}

// Initialize the advanced filters
function initAdvancedFilters() {
    // Date range filter
    const dateRangeSelect = document.getElementById('filter-date-range');
    const customDateContainer = document.getElementById('custom-date-container');
    const startDateInput = document.getElementById('filter-date-start');
    const endDateInput = document.getElementById('filter-date-end');
    
    // Show custom date inputs when "Custom Range" is selected
    dateRangeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateContainer.classList.add('show');
        } else {
            customDateContainer.classList.remove('show');
        }
        
        // Update filter state
        filterState.dateRange = this.value;
        
        // If a preset is selected, clear custom dates
        if (this.value !== 'custom') {
            startDateInput.value = '';
            endDateInput.value = '';
            filterState.startDate = null;
            filterState.endDate = null;
        }
    });
    
    // Handle custom date inputs
    startDateInput.addEventListener('change', function() {
        filterState.startDate = this.value ? new Date(this.value) : null;
    });
    
    endDateInput.addEventListener('change', function() {
        filterState.endDate = this.value ? new Date(this.value) : null;
    });
    
    // Category filter
    const categorySelect = document.getElementById('filter-category');
    categorySelect.addEventListener('change', function() {
        filterState.category = this.value;
    });
    
    // Amount range filters
    const minAmountInput = document.getElementById('filter-amount-min');
    const maxAmountInput = document.getElementById('filter-amount-max');
    
    minAmountInput.addEventListener('input', function() {
        filterState.minAmount = this.value ? parseFloat(this.value) : null;
    });
    
    maxAmountInput.addEventListener('input', function() {
        filterState.maxAmount = this.value ? parseFloat(this.value) : null;
    });
    
    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', function() {
        applyFiltersAndRender();
    });
    
    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', function() {
        resetFilters();
        updateActiveFiltersDisplay();
        applyFiltersAndRender();
    });
    
    // Clear all filters button (shown when no results)
    document.getElementById('clear-all-filters').addEventListener('click', function() {
        resetFilters(true); // Also reset search
        updateActiveFiltersDisplay();
        applyFiltersAndRender();
    });
    
    // Set initial default values
    setDefaultDateValues();
}

// Set default date values for custom date range
function setDefaultDateValues() {
    const today = new Date();
    
    // End date defaults to today
    const endDateStr = today.toISOString().split('T')[0];
    document.getElementById('filter-date-end').value = endDateStr;
    
    // Start date defaults to 30 days ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    document.getElementById('filter-date-start').value = startDateStr;
}

// Reset all filters to default values
function resetFilters(includeSearch = false) {
    document.getElementById('filter-date-range').value = 'all';
    document.getElementById('custom-date-container').classList.remove('show');
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-amount-min').value = '';
    document.getElementById('filter-amount-max').value = '';
    
    if (includeSearch) {
        document.getElementById('expense-search').value = '';
        document.getElementById('expense-search').parentElement.classList.remove('has-value');
    }
    
    // Reset filter state
    filterState = {
        dateRange: 'all',
        startDate: null,
        endDate: null,
        category: 'all',
        minAmount: null,
        maxAmount: null,
        searchQuery: includeSearch ? '' : filterState.searchQuery
    };
    
    // Reset default date values
    setDefaultDateValues();
}

// Apply filters and render the expense list
function applyFiltersAndRender() {
    // Apply all active filters to the expenses
    const expenses = expenseManager.getAllExpenses();
    const filteredExpenses = filterExpenses(expenses);
    
    // Update active filters display
    updateActiveFiltersDisplay();
    
    // Update the results summary
    updateResultsSummary(filteredCount, totalCount);
    
    // Render the filtered list with animation
    renderExpenseList(filteredExpenses, true);
}

// Filter expenses based on current filter state
function filterExpenses(expenses) {
    const filtered = expenses.filter(expense => {
        // Apply date filters
        if (!passesDateFilter(expense)) return false;
        
        // Apply category filter
        if (filterState.category !== 'all' && expense.category !== filterState.category) return false;
        
        // Apply amount filters
        if (filterState.minAmount !== null && expense.amount < filterState.minAmount) return false;
        if (filterState.maxAmount !== null && expense.amount > filterState.maxAmount) return false;
        
        // Apply search query
        if (filterState.searchQuery && !matchesSearchQuery(expense, filterState.searchQuery)) return false;
        
        // Passed all filters
        return true;
    });
    
    // Sort filtered results by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Check if an expense passes the date filter
function passesDateFilter(expense) {
    const expenseDate = new Date(expense.date);
    
    // Custom date range
    if (filterState.dateRange === 'custom') {
        if (filterState.startDate && expenseDate < filterState.startDate) return false;
        if (filterState.endDate) {
            const endCompare = new Date(filterState.endDate);
            endCompare.setHours(23, 59, 59); // End of the day
            if (expenseDate > endCompare) return false;
        }
        return true;
    }
    
    // Today
    if (filterState.dateRange === 'day') {
        const today = new Date();
        return expenseDate.getDate() === today.getDate() && 
               expenseDate.getMonth() === today.getMonth() &&
               expenseDate.getFullYear() === today.getFullYear();
    }
    
    // This week
    if (filterState.dateRange === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return expenseDate >= startOfWeek;
    }
    
    // This month
    if (filterState.dateRange === 'month') {
        const today = new Date();
        return expenseDate.getMonth() === today.getMonth() && 
               expenseDate.getFullYear() === today.getFullYear();
    }
    
    // All time
    return true;
}

// Check if an expense matches the search query
function matchesSearchQuery(expense, query) {
    query = query.toLowerCase();
    
    // Search in category
    if (getCategoryName(expense.category).toLowerCase().includes(query)) return true;
    
    // Search in notes
    if (expense.notes && expense.notes.toLowerCase().includes(query)) return true;
    
    // Search in amount
    if (expense.amount.toString().includes(query)) return true;
    
    // Search in date
    if (formatDate(expense.date).toLowerCase().includes(query)) return true;
    
    return false;
}

// Update the active filters display
function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('active-filters');
    activeFiltersContainer.innerHTML = '';
    
    // Date range filter
    if (filterState.dateRange && filterState.dateRange !== 'all') {
        let dateLabel;
        
        switch(filterState.dateRange) {
            case 'month':
                dateLabel = 'This Month';
                break;
            case 'week':
                dateLabel = 'This Week';
                break;
            case 'day':
                dateLabel = 'Today';
                break;
            case 'custom':
                const startStr = filterState.startDate ? formatDate(filterState.startDate) : 'Any';
                const endStr = filterState.endDate ? formatDate(filterState.endDate) : 'Any';
                dateLabel = `${startStr} to ${endStr}`;
                break;
        }
        
        addActiveFilterTag(activeFiltersContainer, 'Date: ' + dateLabel, () => {
            filterState.dateRange = 'all';
            document.getElementById('filter-date-range').value = 'all';
            document.getElementById('custom-date-container').classList.remove('show');
            applyFiltersAndRender();
        });
    }
    
    // Category filter
    if (filterState.category && filterState.category !== 'all') {
        const categoryName = getCategoryName(filterState.category);
        addActiveFilterTag(activeFiltersContainer, 'Category: ' + categoryName, () => {
            filterState.category = 'all';
            document.getElementById('filter-category').value = 'all';
            applyFiltersAndRender();
        });
    }
    
    // Min amount filter
    if (filterState.minAmount !== null) {
        addActiveFilterTag(activeFiltersContainer, 'Min: ' + formatCurrency(filterState.minAmount), () => {
            filterState.minAmount = null;
            document.getElementById('filter-amount-min').value = '';
            applyFiltersAndRender();
        });
    }
    
    // Max amount filter
    if (filterState.maxAmount !== null) {
        addActiveFilterTag(activeFiltersContainer, 'Max: ' + formatCurrency(filterState.maxAmount), () => {
            filterState.maxAmount = null;
            document.getElementById('filter-amount-max').value = '';
            applyFiltersAndRender();
        });
    }
    
    // Search query
    if (filterState.searchQuery) {
        addActiveFilterTag(activeFiltersContainer, 'Search: ' + filterState.searchQuery, () => {
            filterState.searchQuery = '';
            document.getElementById('expense-search').value = '';
            document.getElementById('expense-search').parentElement.classList.remove('has-value');
            applyFiltersAndRender();
        });
    }
}

// Add an active filter tag to the display
function addActiveFilterTag(container, label, removeCallback) {
    const tagElement = document.createElement('div');
    tagElement.className = 'active-filter';
    tagElement.innerHTML = `
        ${label}
        <span class="remove-filter">×</span>
    `;
    
    tagElement.querySelector('.remove-filter').addEventListener('click', removeCallback);
    container.appendChild(tagElement);
}

// Update the results summary display
function updateResultsSummary(filteredCount, totalCount) {
    const summaryElement = document.getElementById('filter-results-summary');
    
    if (filteredCount === totalCount) {
        summaryElement.innerHTML = '';
    } else {
        summaryElement.innerHTML = `Showing ${filteredCount} of ${totalCount} expenses`;
    }
}

// Debounce helper function to limit how often a function can run
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add function to reorganize dashboard layout
function reorganizeDashboardLayout() {
    // Wait for DOM to be fully loaded
    setTimeout(() => {
        const dashboardContainer = document.querySelector('.dashboard-layout');
        if (!dashboardContainer) {
            console.warn('Dashboard container not found');
            return;
        }

        // Add class to enable grid or flex layout
        dashboardContainer.classList.add('three-column-layout');

        // Find the expense and budget sections
        const expensesSection = document.querySelector('.expense-list-container');
        const monthlyBudgetSection = document.querySelector('.budget-card.monthly');
        const weeklyBudgetSection = document.querySelector('.budget-card.weekly');

        // Make sure we found all sections
        if (!expensesSection || !monthlyBudgetSection || !weeklyBudgetSection) {
            console.warn('Could not find all dashboard sections for reorganization');
            return;
        }

        // Add classes for layout
        expensesSection.classList.add('dashboard-column');
        monthlyBudgetSection.classList.add('dashboard-column');
        weeklyBudgetSection.classList.add('dashboard-column');
        
        // Set equal width for all three boxes
        expensesSection.style.flex = "1";
        expensesSection.style.maxWidth = "none";
        monthlyBudgetSection.style.flex = "1";
        monthlyBudgetSection.style.maxWidth = "none";
        weeklyBudgetSection.style.flex = "1";
        weeklyBudgetSection.style.maxWidth = "none";
        
        // Move budget cards next to expenses section in the layout
        const budgetOverviewSection = document.querySelector('.budget-overview');
        if (budgetOverviewSection) {
            // Remove budget cards from their original parent
            budgetOverviewSection.removeChild(monthlyBudgetSection);
            budgetOverviewSection.removeChild(weeklyBudgetSection);
            
            // Insert them as siblings after the expense section
            dashboardContainer.appendChild(monthlyBudgetSection);
            dashboardContainer.appendChild(weeklyBudgetSection);
            
            // Add additional data sections under monthly budget
            addBudgetInsights(monthlyBudgetSection, 'monthly');
            
            // Add additional data sections under weekly budget
            addBudgetInsights(weeklyBudgetSection, 'weekly');
        }
        
        // Find the chart containers
        const chartsSection = document.querySelector('.charts-section');
        const categoryChartContainer = document.querySelector('.chart-container:has(#category-chart)');
        const trendChartContainer = document.querySelector('.chart-container:has(#trend-chart)');
        
        if (chartsSection && categoryChartContainer && trendChartContainer) {
            // Create a new container for charts below the boxes
            const chartsRow = document.createElement('div');
            chartsRow.className = 'charts-row';
            chartsRow.style.display = 'flex';
            chartsRow.style.flexWrap = 'wrap';
            chartsRow.style.justifyContent = 'space-between';
            chartsRow.style.marginTop = '20px';
            chartsRow.style.width = '100%';
            
            // Remove chart containers from their original parent
            chartsSection.removeChild(categoryChartContainer);
            chartsSection.removeChild(trendChartContainer);
            
            // Make each chart container take up 50% width (minus some gap)
            categoryChartContainer.style.flex = '0 0 calc(50% - 10px)';
            trendChartContainer.style.flex = '0 0 calc(50% - 10px)';
            
            // Add charts to the new container
            chartsRow.appendChild(categoryChartContainer);
            chartsRow.appendChild(trendChartContainer);
            
            // Add the charts row below the budget and expense boxes
            dashboardContainer.parentNode.insertBefore(chartsRow, dashboardContainer.nextSibling);
        } else {
            console.warn('Could not find chart containers for reorganization');
        }
        
        console.log('Dashboard layout reorganized');
    }, 100);  // Small delay to ensure DOM is ready
}

// New function to add budget insights under budget cards
function addBudgetInsights(budgetSection, periodType) {
    // Create container for additional data
    const insightsContainer = document.createElement('div');
    insightsContainer.className = `budget-insights ${periodType}-insights`;
    insightsContainer.style.marginTop = '15px';
    insightsContainer.style.padding = '10px';
    insightsContainer.style.borderTop = '1px solid var(--border-color)';
    
    // Add heading
    const heading = document.createElement('h4');
    heading.style.marginBottom = '12px';
    heading.style.color = 'var(--text-color)';
    insightsContainer.appendChild(heading);
    
    // Add top spending categories
    const topCategoriesSection = createTopCategoriesSection(periodType);
    insightsContainer.appendChild(topCategoriesSection);
    
    // Add savings calculation
    const savingsSection = createSavingsSection(periodType);
    insightsContainer.appendChild(savingsSection);
    
    // Add mini spending trend
    const trendSection = createMiniTrendSection(periodType);
    insightsContainer.appendChild(trendSection);
    
    // Append to budget section
    budgetSection.appendChild(insightsContainer);
    
    // Update data
    updateBudgetInsights(periodType);
}

// Create top spending categories section
function createTopCategoriesSection(periodType) {
    const section = document.createElement('div');
    section.className = 'budget-insight-section top-categories';
    
    const title = document.createElement('div');
    title.className = 'insight-title';
    title.textContent = 'Top Categories';
    title.style.fontSize = '13px';
    title.style.fontWeight = '500';
    title.style.marginBottom = '8px';
    
    const content = document.createElement('div');
    content.className = `top-categories-content ${periodType}-top-categories`;
    content.style.fontSize = '12px';
    
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
}

// Create savings calculation section
function createSavingsSection(periodType) {
    const section = document.createElement('div');
    section.className = 'budget-insight-section savings';
    section.style.marginTop = '15px';
    
    const title = document.createElement('div');
    title.className = 'insight-title';
    title.textContent = 'Budget Status';
    title.style.fontSize = '13px';
    title.style.fontWeight = '500';
    title.style.marginBottom = '8px';
    
    const content = document.createElement('div');
    content.className = `savings-content ${periodType}-savings`;
    content.style.fontSize = '12px';
    
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
}

// Create mini trend section
function createMiniTrendSection(periodType) {
    const section = document.createElement('div');
    section.className = 'budget-insight-section mini-trend';
    section.style.marginTop = '15px';
    
    const title = document.createElement('div');
    title.className = 'insight-title';
    title.textContent = 'Spending Trend';
    title.style.fontSize = '13px';
    title.style.fontWeight = '500';
    title.style.marginBottom = '8px';
    
    const content = document.createElement('div');
    content.className = `mini-trend-content ${periodType}-trend`;
    content.style.height = '40px';
    content.style.position = 'relative';
    
    section.appendChild(title);
    section.appendChild(content);
    
    return section;
}

// Function to update budget insights data
function updateBudgetInsights(periodType) {
    // Get all expenses
    const allExpenses = expenseManager.getAllExpenses();
    if (!allExpenses.length) return;
    
    // Filter expenses for the current period
    const today = new Date();
    let periodExpenses = [];
    
    if (periodType === 'monthly') {
        periodExpenses = allExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === today.getMonth() &&
                   expenseDate.getFullYear() === today.getFullYear();
        });
    } else { // weekly
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        periodExpenses = allExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startOfWeek;
        });
    }
    
    // Update top categories
    updateTopCategories(periodExpenses, periodType);
    
    // Update savings data
    updateSavingsData(periodExpenses, periodType);
    
    // Update mini trend
    updateMiniTrend(periodExpenses, periodType);
}

// Update top categories display
function updateTopCategories(expenses, periodType) {
    const container = document.querySelector(`.${periodType}-top-categories`);
    if (!container) return;
    
    // Group expenses by category and calculate totals
    const categoryTotals = {};
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += parseFloat(expense.amount);
    });
    
    // Sort categories by amount
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Just top 3
    
    if (sortedCategories.length === 0) {
        container.innerHTML = '<div class="empty-insight">No expenses yet</div>';
        return;
    }
    
    // Generate HTML
    let html = '';
    sortedCategories.forEach(([category, amount]) => {
        const categoryName = getCategoryName(category);
        html += `
            <div class="top-category-item">
                <span class="mini-category-badge category-${category}"></span>
                <span class="category-name">${categoryName}</span>
                <span class="category-amount">${formatCurrency(amount)}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add some style for the badges
    const styleId = 'top-categories-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .top-category-item {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .mini-category-badge {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
                display: inline-block;
            }
            
            .category-name {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .category-amount {
                font-weight: 500;
                margin-left: 5px;
            }
            
            .empty-insight {
                color: #999;
                font-style: italic;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Update savings data
function updateSavingsData(expenses, periodType) {
    const container = document.querySelector(`.${periodType}-savings`);
    if (!container) return;
    
    // Calculate total spending for this period
    const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Get budget amount
    const budget = budgetManager.getBudget(periodType);
    
    if (!budget || !budget.amount) {
        container.innerHTML = '<div class="empty-insight">No budget set</div>';
        return;
    }
    
    const budgetAmount = parseFloat(budget.amount);
    const remaining = Math.max(0, budgetAmount - totalSpent);
    const percentUsed = Math.min(100, Math.round((totalSpent / budgetAmount) * 100));
    const percentRemaining = 100 - percentUsed;
    
    // Generate HTML with mini progress bar
    container.innerHTML = `
        <div class="budget-mini-stats">
            <div class="budget-mini-stat">
                <span>Spent: </span>
                <span>${formatCurrency(totalSpent)}</span>
            </div>
            <div class="budget-mini-stat">
                <span>Remaining: </span>
                <span class="${remaining === 0 ? 'used-up' : ''}">${formatCurrency(remaining)}</span>
            </div>
        </div>
        <div class="budget-mini-progress">
            <div class="budget-mini-progress-bar" style="width: ${percentUsed}%"></div>
            <div class="budget-mini-progress-text">${percentUsed}%</div>
        </div>
    `;
    
    // Add some style for the mini progress bar
    const styleId = 'budget-mini-progress-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .budget-mini-stats {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 12px;
            }
            
            .budget-mini-stat {
                white-space: nowrap;
            }
            
            .budget-mini-progress {
                height: 6px;
                background-color: #e9ecef;
                border-radius: 3px;
                position: relative;
                overflow: hidden;
            }
            
            .budget-mini-progress-bar {
                height: 100%;
                background-color: var(--primary-color);
                border-radius: 3px;
            }
            
            .budget-mini-progress-text {
                position: absolute;
                right: 0;
                top: -16px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .used-up {
                color: #dc3545;
            }
        `;
        document.head.appendChild(style);
    }
}

// Update mini trend chart
function updateMiniTrend(expenses, periodType) {
    const container = document.querySelector(`.${periodType}-trend`);
    if (!container) return;
    
    if (expenses.length < 2) {
        container.innerHTML = '<div class="empty-insight">Not enough data for trend</div>';
        return;
    }
    
    // Group expenses by date
    let groupedExpenses = {};
    let dateFormat = {};
    
    if (periodType === 'monthly') {
        // Group by day of month
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const day = date.getDate();
            if (!groupedExpenses[day]) {
                groupedExpenses[day] = 0;
                dateFormat[day] = date.toLocaleDateString(undefined, {day: 'numeric'});
            }
            groupedExpenses[day] += parseFloat(expense.amount);
        });
    } else {
        // Group by day of week
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const day = date.getDay();
            if (!groupedExpenses[day]) {
                groupedExpenses[day] = 0;
                dateFormat[day] = date.toLocaleDateString(undefined, {weekday: 'short'});
            }
            groupedExpenses[day] += parseFloat(expense.amount);
        });
    }
    
    // Convert to array and sort by date
    let dataPoints = Object.entries(groupedExpenses)
        .map(([date, amount]) => ({date: parseInt(date), amount, label: dateFormat[date]}))
        .sort((a, b) => a.date - b.date);
    
    // Create a simple sparkline
    const max = Math.max(...dataPoints.map(p => p.amount));
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Generate SVG for sparkline
    let pathData = '';
    dataPoints.forEach((point, index) => {
        const x = (index / (dataPoints.length - 1)) * width;
        const y = height - ((point.amount / max) * height);
        if (index === 0) {
            pathData += `M ${x},${y} `;
        } else {
            pathData += `L ${x},${y} `;
        }
    });
    
    // Create SVG
    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
            <path d="${pathData}" stroke="var(--primary-color)" stroke-width="2" fill="none" />
            ${dataPoints.map((point, index) => {
                const x = (index / (dataPoints.length - 1)) * width;
                const y = height - ((point.amount / max) * height);
                return `<circle cx="${x}" cy="${y}" r="3" fill="var(--primary-color)" />`;
            }).join('')}
        </svg>
    `;
}

// Custom code to modify filter behavior
(function() {
    // Execute when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit longer to ensure reorganizeDashboardLayout has run
        setTimeout(function() {
            // Add CSS to enhance filter UI
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                /* Hide the filter button */
                #toggle-filters {
                    display: none;
                }
                
                .expense-list-container {
                    position: relative;
                }
                
                .advanced-filters {
                    position: absolute;
                    right: -320px;
                    top: 0;
                    width: 300px;
                    background-color: var(--card-bg);
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    margin-bottom: 20px;
                    border: 1px solid var(--border-color);
                    z-index: 100;
                }
                
                .advanced-filters .filter-row {
                    margin-bottom: 20px;
                }
                
                .advanced-filters label {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--text-color);
                }
                
                .advanced-filters select,
                .advanced-filters input {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 10px;
                    width: 100%;
                    background-color: var(--input-bg);
                    color: var(--text-color);
                    transition: all 0.2s ease;
                }
                
                .advanced-filters select:focus,
                .advanced-filters input:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }
                
                .filter-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .filter-actions button {
                    padding: 10px 16px;
                    font-weight: 500;
                }
                
                .date-range-inputs,
                .amount-range-inputs {
                    gap: 15px;
                }
                
                .custom-date-range.show {
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px dashed #e0e0e0;
                }
                
                /* Animation for showing/hiding */
                .advanced-filters.show {
                    animation: fadeInFilter 0.3s ease forwards;
                }
                
                @keyframes fadeInFilter {
                    0% {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(styleEl);
            
            // Get references to the relevant elements
            const filterSection = document.getElementById('advanced-filters');
            const monthlyBudgetSection = document.querySelector('.budget-card.monthly');
            
            // Create a mutation observer to watch for changes to the filter section
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if   (mutation.attributeName === 'class') {
                        const isVisible = filterSection.classList.contains('show');
                        // Only hide the monthly budget box, not the entire budget overview
                        if (monthlyBudgetSection) {
                            monthlyBudgetSection.style.display = isVisible ? 'none' : '';
                        }
                    }
                });
            });
            
            // Start observing the filter section
            observer.observe(filterSection, {
                attributes: true,
                attributeFilter: ['class']
            });
        }, 600); // Longer timeout to ensure reorganizeDashboardLayout has completed
    });
})();

// Listen for budget and expense changes to update insights
document.addEventListener('expensesUpdated', function() {
    updateBudgetInsights('monthly');
    updateBudgetInsights('weekly');
});

document.addEventListener('budgetsUpdated', function() {
    updateBudgetInsights('monthly');
    updateBudgetInsights('weekly');
});
