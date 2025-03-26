/**
 * Category breakdown expand functionality
 * Allows users to click on a category to see all expenses in that category
 */

// Initialize category items click handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initCategoryItemsClickHandlers, 500); // Delay to ensure chart is loaded
    
    // Also listen for category updates to reattach listeners when categories are refreshed
    document.addEventListener('expensesUpdated', function() {
        setTimeout(initCategoryItemsClickHandlers, 500); // Wait for chart updates
    });
    
    // Listen for a specific event when category breakdown is updated
    document.addEventListener('categoryBreakdownUpdated', function() {
        setTimeout(initCategoryItemsClickHandlers, 300);
    });
});

// Initialize click handlers for category items
function initCategoryItemsClickHandlers() {
    const categoryItems = document.querySelectorAll('#categories-breakdown .category-item');
    console.log('Found category items:', categoryItems.length);
    
    categoryItems.forEach(item => {
        // Make it visually clickable
        item.classList.add('clickable');
        
        // Get the category value from data attribute (added in dashboard-charts.js)
        const categoryValue = item.getAttribute('data-category');
        
        // Remove any existing click events and add a new one
        item.removeEventListener('click', categoryClickHandler);
        item.addEventListener('click', categoryClickHandler);
        
        // Mark the item as initialized
        item.setAttribute('data-initialized', 'true');
    });
}

// Category click handler function
function categoryClickHandler(event) {
    const item = event.currentTarget;
    const categoryValue = item.getAttribute('data-category');
    
    console.log('Category clicked:', categoryValue);
    
    if (categoryValue) {
        openCategoryExpensesPopup(categoryValue);
    }
}

// Open a popup showing all expenses in the selected category
function openCategoryExpensesPopup(categoryValue) {
    // Get all expenses from expense manager
    const allExpenses = expenseManager.getAllExpenses();
    
    // Filter expenses by the selected category
    const filteredExpenses = allExpenses.filter(expense => expense.category === categoryValue);
    
    // Create modal for displaying category expenses
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'category-expenses-modal';
    
    // Get category name for display
    const categoryName = getCategoryName(categoryValue);
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${categoryName} Expenses</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="category-expenses-container">
                    <div class="expense-list" id="category-expenses-list">
                        <!-- Will be populated dynamically -->
                    </div>
                    <div class="no-results" id="category-no-expenses" style="display: none;">
                        <p>No expenses found in this category.</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="category-total">
                    Total: <span id="category-total-amount">${formatCurrency(calculateCategoryTotal(filteredExpenses))}</span>
                </div>
                <button class="btn btn-outline close-category-popup">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to the document
    document.body.appendChild(modal);
    
    // Show backdrop
    const modalBackdrop = document.getElementById('modal-backdrop');
    modalBackdrop.classList.add('active');
    
    // Populate expenses list
    const expensesList = modal.querySelector('#category-expenses-list');
    const noExpenses = modal.querySelector('#category-no-expenses');
    
    // Display message if no expenses
    if (filteredExpenses.length === 0) {
        noExpenses.style.display = 'block';
        return;
    }
    
    // Sort expenses by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add each expense to the list
    filteredExpenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item fade-in';
        expenseItem.dataset.id = expense.id;
        
        expenseItem.innerHTML = `
            <div class="expense-item-main">
                <div class="expense-header">
                    <span class="category-badge category-${expense.category}">${categoryName}</span>
                    <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="expense-date">${formatDate(new Date(expense.date))}</div>
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
            closeModal();
            openEditExpenseModal(expense.id);
        });
        
        deleteBtn.addEventListener('click', () => {
            closeModal();
            openDeleteExpenseModal(expense.id);
        });
        
        expensesList.appendChild(expenseItem);
    });
    
    // Add event listeners for closing the modal
    const closeButton = modal.querySelector('.close-modal');
    const closeButtonFooter = modal.querySelector('.close-category-popup');
    
    closeButton.addEventListener('click', closeModal);
    closeButtonFooter.addEventListener('click', closeModal);
    
    // Function to close the modal
    function closeModal() {
        modal.remove();
        modalBackdrop.classList.remove('active');
    }
    
    // Add style for the category total
    addCategoryModalStyles();
}

// Calculate total amount for the category
function calculateCategoryTotal(expenses) {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// Add styles for category expenses modal
function addCategoryModalStyles() {
    const styleId = 'category-modal-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .category-expenses-container {
                max-height: 60vh;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .category-total {
                font-size: 1.1rem;
                font-weight: 500;
                color: var(--text-color);
            }
            
            #category-total-amount {
                font-weight: 600;
                color: var(--primary-color);
            }
            
            .modal-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            #categories-breakdown .category-item.clickable {
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                position: relative;
            }
            
            #categories-breakdown .category-item.clickable:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border-left-width: 8px;
            }
            
            #categories-breakdown .category-item.clickable::after {
                content: "";
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 14px;
                opacity: 0.3;
                transition: opacity 0.2s ease;
            }
            
            #categories-breakdown .category-item.clickable:hover::after {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }
}
