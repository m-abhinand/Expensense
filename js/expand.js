/**
 * Expense expansion functionality for the Expense Tracker application
 * This file handles the "View All Expenses" popup and related functions
 */

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
    const closeButtons = modal.querySelectorAll('.close-modal');
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
            width: 90%;
            max-width: 900px;
        }
        
        .popup-content-layout {
            display: flex;
            gap: 15px;
            margin-top: 10px;
        }
        
        .expenses-list-container {
            flex: 1;
            max-height: 60vh; /* Reduced from 70vh */
            overflow-y: auto;
            padding: 0 10px;
            min-width: 0;
            border-right: 1px solid var(--border-color);
            padding-right: 20px;
        }
        
        #all-expenses-list {
            margin: 5px 0; /* Reduced from 10px */
        }
        
        #all-expenses-list .expense-item:last-child {
            border-bottom: 1px solid var(--border-color);
        }
        
        #all-expenses-list .expense-item {
            padding: 8px 10px; /* Add compact padding */
        }
        
        #all-expenses-list .expense-date {
            margin-top: 2px; /* Compact date spacing */
        }
        
        #all-expenses-list .expense-notes {
            margin-top: 3px;
            line-height: 1.3;
        }
        
        .popup-expense-controls {
            margin: 8px 0; /* Reduced from 10px */
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .popup-expense-controls .search-box {
            width: 280px;
        }
        
        .filters-side-container {
            width: 280px;
            min-width: 280px;
            padding: 12px; /* Reduced from 15px */
            background-color: var(--bg-card);
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .filters-side-container h4 {
            margin: 0;
            color: var(--text-color);
            font-size: 15px; /* Reduced from 16px */
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 6px; /* Reduced from 8px */
            text-align: center;
            font-weight: 600;
        }
        
        #popup-advanced-filters {
            width: 100%;
            background-color: transparent;
            padding: 0;
            border: none;
            box-shadow: none;
            margin-top: 5px;
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
            margin: 0 0 8px 0; /* Reduced from 10px */
            font-style: italic;
            font-size: 12px; /* Reduced from 13px */
            color: var(--text-muted);
            text-align: center;
            padding: 3px; /* Reduced from 5px */
            background-color: var(--bg-light);
            border-radius: 4px;
        }
        
        .active-filters {
            margin-top: 5px;
            margin-bottom: 8px; /* Reduced from 10px */
            display: flex;
            flex-wrap: wrap;
            gap: 4px; /* Reduced from 5px */
        }

        #popup-custom-date-container.show {
            display: block;
        }

        #popup-custom-date-container {
            display: none;
        }

        .filters-side-container .filter-row {
            margin-bottom: 10px; /* Reduced from 18px */
            background-color: var(--bg-element);
            padding: 8px 10px; /* Reduced from 12px */
            border-radius: 6px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
            border: 1px solid var(--border-color);
        }
        
        .filters-side-container .filter-actions {
            margin-top: 12px; /* Reduced from 20px */
            display: flex;
            justify-content: space-between;
            gap: 8px; /* Reduced from 10px */
        }
        
        #popup-advanced-filters .filter-group select,
        #popup-advanced-filters .filter-group input {
            background-color: var(--bg-input);
            border: 1px solid var(--border-color);
            width: 100%;
            padding: 6px 8px; /* Reduced from 8px 10px */
            border-radius: 5px;
            font-size: 13px;
            color: var(--text-color);
            transition: border-color 0.2s, box-shadow 0.2s;
            -webkit-appearance: auto; /* Ensure native appearance on all browsers */
            appearance: auto;
        }
        
        /* Style for dropdown options to respect dark mode */
        #popup-advanced-filters .filter-group select option {
            background-color: var(--bg-input);
            color: var(--text-color);
            padding: 8px;
        }
        
        /* Ensure dropdown arrow is visible in dark mode */
        #popup-advanced-filters .filter-group select::-ms-expand {
            display: block;
            color: var(--text-color);
        }
        
        #popup-advanced-filters .filter-group select:focus,
        #popup-advanced-filters .filter-group input:focus {
            border-color: #80bdff;
            outline: 0;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.15);
        }

        #popup-advanced-filters .filter-group {
            margin-bottom: 8px; /* Reduced from 12px */
        }

        #popup-advanced-filters label {
            display: block;
            margin-bottom: 4px; /* Reduced from 6px */
            font-weight: 500;
            font-size: 13px;
            color: var(--text-color);
        }

        .amount-range-inputs {
            display: flex;
            gap: 8px; /* Reduced from 10px */
        }

        .amount-range-inputs .amount-input {
            flex: 1;
        }
        
        .amount-range-inputs .amount-input label,
        .date-range-inputs .date-input label {
            font-size: 12px;
            font-weight: normal;
            color: var(--text-muted);
            margin-bottom: 2px; /* Reduced from 3px */
        }

        .date-range-inputs {
            display: flex;
            gap: 8px; /* Reduced from 10px */
        }

        .date-range-inputs .date-input {
            flex: 1;
        }

        .filter-tag {
            display: inline-flex;
            align-items: center;
            background-color: var(--tag-bg, #e9f2ff);
            border: 1px solid var(--tag-border, #c6dfff);
            border-radius: 16px;
            padding: 2px 10px; /* Reduced from 4px 12px */
            margin: 0 4px 4px 0; /* Reduced from 5px */
            font-size: 11px; /* Reduced from 12px */
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .filter-tag:hover {
            background-color: var(--tag-bg-hover, #d9e8ff);
            border-color: var(--tag-border-hover, #b4d0ff);
        }

        .filter-tag-remove {
            background: none;
            border: none;
            color: var(--tag-remove-color, #6c8db8);
            cursor: pointer;
            font-size: 14px; /* Reduced from 16px */
            margin-left: 4px; /* Reduced from 6px */
            padding: 0 2px;
            transition: color 0.2s;
        }

        .filter-tag-remove:hover {
            color: var(--tag-remove-hover, #4a6d9c);
        }
        
        .filter-tag-label {
            font-weight: 500;
            color: var(--tag-text, #2c5282);
        }

        #popup-apply-filters, #popup-reset-filters {
            padding: 6px 12px; /* Reduced from 8px 15px */
            border-radius: 5px;
            font-size: 12px; /* Reduced from 13px */
        }
        
        #popup-apply-filters {
            background-color: #3182ce;
            border-color: #2b6cb0;
            flex: 2;
            font-weight: 500;
        }
        
        #popup-apply-filters:hover {
            background-color: #2b6cb0;
        }
        
        #popup-reset-filters {
            background-color: var(--bg-element);
            border-color: var(--border-color);
            color: var(--text-color);
            flex: 1;
        }
        
        #popup-reset-filters:hover {
            background-color: var(--bg-hover);
            color: var(--text-color);
        }

        .no-results {
            text-align: center;
            padding: 20px; /* Reduced from 30px 20px */
            color: var(--text-muted);
            background-color: var(--bg-light);
            border-radius: 8px;
            margin-top: 15px; /* Reduced from 20px */
        }
        
        .no-results p {
            margin-bottom: 12px; /* Reduced from 15px */
            font-size: 14px; /* Reduced from 15px */
            color: var(--text-color);
        }
        
        #popup-clear-all-filters {
            padding: 5px 12px; /* Reduced from 6px 15px */
            font-size: 12px; /* Reduced from 13px */
            background-color: var(--bg-element);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            border-radius: 5px;
            transition: all 0.2s;
        }
        
        #popup-clear-all-filters:hover {
            background-color: var(--bg-hover);
            color: var(--text-color);
        }
        
        /* Make modal header more compact */
        .modal-header {
            padding: 12px 15px; /* Add more compact padding */
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        /* Make modal footer more compact */
        .modal-footer {
            padding: 10px 15px;
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
        
        // Restructure the DOM - modified order for better visual presentation
        parent.insertBefore(contentLayout, expensesContainer);
        
        // Build the filter container in proper order
        filtersContainer.appendChild(filtersHeading);
        if (activeFiltersSection) filtersContainer.appendChild(activeFiltersSection);
        if (resultsSection) filtersContainer.appendChild(resultsSection);
        filtersContainer.appendChild(filterSection);
        
        // Add the containers to the layout in correct order (first expenses, then filters)
        contentLayout.appendChild(expensesContainer);
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
    const endDateStr = today.toISOString().split('T')[0];
    document.getElementById('popup-filter-date-end').value = endDateStr;
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    document.getElementById('popup-filter-date-start').value = startDateStr;
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
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `
        <span class="filter-tag-label">${label}</span>
        <button class="filter-tag-remove" title="Remove filter">×</button>
    `;
    
    // Add click event to remove button
    tag.querySelector('.filter-tag-remove').addEventListener('click', removeCallback);
    
    container.appendChild(tag);
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
