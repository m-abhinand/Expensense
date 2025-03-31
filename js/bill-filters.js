/**
 * Bill filtering, sorting, and search functionality
 */

// Initialize filtering when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBillFilters();
});

// Current tab filter
let currentTabFilter = 'all';

// Initialize bill filters
function initBillFilters() {
    // Set up category filter listener
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    // Set up status filter listener
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Set up sort listener
    const sortSelect = document.getElementById('sort-bills');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    // Set up tab filters
    setupTabFilters();
    
    // Set up search functionality
    initSearchFunctionality();
}

// Setup tab filters
function setupTabFilters() {
    const tabButtons = document.querySelectorAll('.bills-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active tab
            tabButtons.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            // Set current tab filter
            currentTabFilter = this.dataset.tab;
            
            // Apply filters
            applyFilters();
        });
    });
}

// Initialize search functionality
function initSearchFunctionality() {
    const searchInput = document.getElementById('bill-search');
    const clearButton = document.getElementById('clear-search');
    
    if (searchInput && clearButton) {
        // Search as you type
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Show/hide clear button
            if (query.length > 0) {
                searchInput.parentElement.classList.add('has-value');
            } else {
                searchInput.parentElement.classList.remove('has-value');
            }
            
            // Apply filters with search
            applyFilters();
        });
        
        // Clear search
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.parentElement.classList.remove('has-value');
            applyFilters();
        });
    }
}

// Apply all filters and sorting
function applyFilters() {
    if (!window.billManager) return;
    
    // Get all bills
    let bills = window.billManager.getAllBills();
    
    // Apply tab filter
    if (currentTabFilter === 'recurring') {
        bills = bills.filter(bill => bill.isRecurring === true && bill.status !== 'paid');
    } else if (currentTabFilter === 'onetime') {
        bills = bills.filter(bill => bill.isRecurring === false);
    }
    
    // Apply category filter
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter && categoryFilter.value !== 'all') {
        bills = bills.filter(bill => bill.category === categoryFilter.value);
    }
    
    // Apply status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter && statusFilter.value !== 'all') {
        bills = bills.filter(bill => bill.status === statusFilter.value);
    }
    
    // Apply search
    const searchInput = document.getElementById('bill-search');
    if (searchInput && searchInput.value.trim() !== '') {
        const searchQuery = searchInput.value.trim().toLowerCase();
        bills = bills.filter(bill => {
            return bill.name.toLowerCase().includes(searchQuery) || 
                   bill.category.toLowerCase().includes(searchQuery) ||
                   bill.notes.toLowerCase().includes(searchQuery);
        });
    }
    
    // Apply sorting
    const sortSelect = document.getElementById('sort-bills');
    if (sortSelect) {
        const sortValue = sortSelect.value;
        
        switch (sortValue) {
            case 'date-asc':
                bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                break;
            case 'date-desc':
                bills.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
                break;
            case 'amount-asc':
                bills.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                bills.sort((a, b) => b.amount - a.amount);
                break;
            case 'name-asc':
                bills.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                bills.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
    }
    
    // If we're in the "all" tab, separate current month and future bills
    if (currentTabFilter === 'all') {
        renderBillsWithFutureSection(bills);
    } else {
        // Render filtered and sorted bills normally for other tabs
        renderFilteredBills(bills);
    }
}

// Render bills with a collapsible future section (for All Bills tab)
function renderBillsWithFutureSection(bills) {
    const billsList = document.getElementById('bills-list');
    const emptyState = document.getElementById('empty-state');
    
    // Clear current list (except empty state)
    Array.from(billsList.children).forEach(child => {
        if (!child.id || child.id !== 'empty-state') {
            child.remove();
        }
    });
    
    if (bills.length === 0) {
        emptyState.querySelector('h3').textContent = 'No Bills Added';
        emptyState.querySelector('p').textContent = 'Start by adding your bills and payments.';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Separate current month bills from future bills
    const currentMonthBills = [];
    const futureBills = [];
    
    bills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
            currentMonthBills.push(bill);
        } else if (dueDate > today) {
            futureBills.push(bill);
        } else {
            // Past bills still go into current month view for visibility
            currentMonthBills.push(bill);
        }
    });
    
    // Add filter results summary if needed
    const allBills = window.billManager.getAllBills();
    if (bills.length < allBills.length) {
        const summary = document.createElement('div');
        summary.className = 'filter-results-summary';
        summary.innerHTML = `
            <div class="filter-summary">Showing ${bills.length} of ${allBills.length} bills</div>
            <button id="reset-filters" class="btn btn-sm btn-outline">Reset</button>
        `;
        
        // Add event listener to reset button
        summary.querySelector('#reset-filters').addEventListener('click', resetFilters);
        
        billsList.appendChild(summary);
    }
    
    // Render current month bills
    currentMonthBills.forEach(bill => {
        const billElement = createBillElement(bill);
        billsList.appendChild(billElement);
    });
    
    // Only create future bills section if there are future bills
    if (futureBills.length > 0) {
        // Create future bills collapsible section
        const futureBillsSection = document.createElement('div');
        futureBillsSection.className = 'future-bills-section';
        
        // Create header for future bills section
        const futureBillsHeader = document.createElement('div');
        futureBillsHeader.className = 'future-bills-header';
        futureBillsHeader.innerHTML = `
            <div class="future-bills-title">
                <span class="future-bills-icon">📅</span>
                <span>Future Bills (${futureBills.length})</span>
            </div>
            <button class="future-bills-toggle">
                <span class="toggle-icon">▼</span>
            </button>
        `;
        
        // Create container for future bills
        const futureBillsContainer = document.createElement('div');
        futureBillsContainer.className = 'future-bills-container';
        futureBillsContainer.style.display = 'none'; // Hidden by default
        
        // Add future bills to container
        futureBills.forEach(bill => {
            const billElement = createBillElement(bill);
            futureBillsContainer.appendChild(billElement);
        });
        
        // Add click event to toggle future bills visibility
        futureBillsHeader.addEventListener('click', () => {
            const isVisible = futureBillsContainer.style.display !== 'none';
            futureBillsContainer.style.display = isVisible ? 'none' : 'block';
            
            // Update toggle icon
            const toggleIcon = futureBillsHeader.querySelector('.toggle-icon');
            toggleIcon.textContent = isVisible ? '▼' : '▲';
            
            // Toggle active class for styling
            futureBillsHeader.classList.toggle('active', !isVisible);
        });
        
        // Append all elements to the section
        futureBillsSection.appendChild(futureBillsHeader);
        futureBillsSection.appendChild(futureBillsContainer);
        
        // Add the section to the bills list
        billsList.appendChild(futureBillsSection);
    }
}

// Render filtered bills
function renderFilteredBills(bills) {
    const billsList = document.getElementById('bills-list');
    const emptyState = document.getElementById('empty-state');
    
    // Clear current list (except empty state)
    Array.from(billsList.children).forEach(child => {
        if (!child.id || child.id !== 'empty-state') {
            child.remove();
        }
    });
    
    if (bills.length === 0) {
        // Show empty state based on current tab
        let emptyTitle = 'No Bills Added';
        let emptyMessage = 'Start by adding your bills and payments.';
        
        if (currentTabFilter === 'recurring') {
            emptyTitle = 'No Recurring Bills';
            emptyMessage = 'Recurring bills will appear here once added.';
        } else if (currentTabFilter === 'onetime') {
            emptyTitle = 'No One-time Bills';
            emptyMessage = 'One-time bills will appear here once added.';
        }
        
        emptyState.querySelector('h3').textContent = emptyTitle;
        emptyState.querySelector('p').textContent = emptyMessage;
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Add filter results summary
    const allBills = window.billManager.getAllBills();
    if (bills.length < allBills.length) {
        const summary = document.createElement('div');
        summary.className = 'filter-results-summary';
        summary.innerHTML = `
            <div class="filter-summary">Showing ${bills.length} of ${allBills.length} bills</div>
            <button id="reset-filters" class="btn btn-sm btn-outline">Reset</button>
        `;
        
        // Add event listener to reset button
        summary.querySelector('#reset-filters').addEventListener('click', resetFilters);
        
        billsList.appendChild(summary);
    }
    
    // Render each bill
    bills.forEach(bill => {
        const billElement = createBillElement(bill);
        billsList.appendChild(billElement);
    });
}

// Reset all filters
function resetFilters() {
    // Reset category filter
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        categoryFilter.value = 'all';
    }
    
    // Reset status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.value = 'all';
    }
    
    // Reset sort
    const sortSelect = document.getElementById('sort-bills');
    if (sortSelect) {
        sortSelect.value = 'date-desc';
    }
    
    // Reset search
    const searchInput = document.getElementById('bill-search');
    if (searchInput) {
        searchInput.value = '';
        searchInput.parentElement.classList.remove('has-value');
    }
    
    // Rerender bills
    renderBillsList();
}

// Hook into the original bill render function to apply filters
const originalRenderBillsList = window.renderBillsList;

// Override the original function to apply filters
window.renderBillsList = function() {
    // Check if filters are active
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    const searchInput = document.getElementById('bill-search');
    
    const filtersActive = (categoryFilter && categoryFilter.value !== 'all') ||
                          (statusFilter && statusFilter.value !== 'all') ||
                          (searchInput && searchInput.value.trim() !== '');
    
    // If filters are active, apply them
    if (filtersActive) {
        applyFilters();
    } else {
        // Otherwise use the original function
        originalRenderBillsList.apply(this, arguments);
    }
};
