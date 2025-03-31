/**
 * Bill filtering, sorting, and search functionality
 */

// Initialize filtering when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBillFilters();
});

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
    
    // Set up search functionality
    initSearchFunctionality();
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
    
    // Render filtered and sorted bills
    renderFilteredBills(bills);
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
    
    // Show empty state if no bills
    if (bills.length === 0) {
        // Create a temporary empty state for filtered results
        const tempEmptyState = document.createElement('div');
        tempEmptyState.className = 'empty-state';
        tempEmptyState.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <h3>No Matching Bills</h3>
            <p>Try changing your filters or search terms.</p>
            <button id="reset-filters" class="btn btn-primary">Reset Filters</button>
        `;
        
        // Add event listener to reset button
        tempEmptyState.querySelector('#reset-filters').addEventListener('click', resetFilters);
        
        billsList.appendChild(tempEmptyState);
        emptyState.style.display = 'none';
        return;
    }
    
    // Hide empty state
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
