/**
 * Due this week bills expansion functionality
 */

// Initialize due bills view when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDueBillsView();
});

// Initialize due bills view
function initDueBillsView() {
    const dueThisWeekCard = document.getElementById('due-this-week-card');
    
    if (dueThisWeekCard) {
        dueThisWeekCard.addEventListener('click', function() {
            showDueBills();
        });
        // Add visual indication that the card is clickable
        dueThisWeekCard.classList.add('clickable');
    }
}

// Show bills due this week
function showDueBills() {
    const modal = document.getElementById('bills-details-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const titleElement = document.getElementById('bills-details-title');
    const billsListElement = document.getElementById('bills-details-list');
    
    // Clear previous content
    billsListElement.innerHTML = '';
    
    // Set the title for due bills
    titleElement.textContent = 'Bills Due This Week';
    
    // Get bills due this week
    const bills = window.billManager.getBillsDueThisWeek();
    if (!bills.length) {
        billsListElement.innerHTML = '<div class="empty-state">No bills due this week.</div>';
        openModal();
        return;
    }
    
    // Sort bills by due date (closest first)
    const sortedBills = bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Create container for bills
    sortedBills.forEach(bill => {
        const billElement = document.createElement('div');
        billElement.className = 'bill-detail-item';
        
        // Format date properly
        const dueDate = new Date(bill.dueDate);
        const formattedDate = dueDate.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });

        billElement.innerHTML = `
            <div class="bill-detail-header">
                <div class="bill-detail-name-amount">
                    <span class="bill-detail-name">${bill.name}</span>
                    <span class="bill-detail-amount">${formatCurrency(bill.amount)}</span>
                </div>
                <div class="bill-category-badge category-${bill.category}">${getCategoryName(bill.category)}</div>
            </div>
            <div class="bill-detail-info">
                <div class="bill-detail-due">Due: ${formattedDate}</div>
                <div class="bill-status ${bill.status}">${bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}</div>
            </div>
            ${bill.notes ? `<div class="bill-detail-notes">${bill.notes}</div>` : ''}
        `;
        
        billsListElement.appendChild(billElement);
    });
    
    // Add styles for the modal content
    addBillsDetailStyles();
    
    // Open modal
    openModal();
    
    function openModal() {
        modal.classList.add('active');
        modalBackdrop.classList.add('active');
    }
}

// Add styles for the bills detail modal
function addBillsDetailStyles() {
    const styleId = 'bills-detail-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .bills-details-container {
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .bill-detail-item {
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                background-color: var(--bg-card);
                border-left: 4px solid var(--primary-color);
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            
            .bill-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            
            .bill-detail-name-amount {
                display: flex;
                flex-direction: column;
            }
            
            .bill-detail-name {
                font-weight: 600;
                font-size: 16px;
                color: var(--text-color);
            }
            
            .bill-detail-amount {
                font-weight: 500;
                font-size: 18px;
                color: var(--text-color);
                margin-top: 5px;
            }
            
            .bill-detail-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                color: var(--text-secondary);
            }
            
            .bill-detail-due {
                font-weight: 500;
            }
            
            .bill-detail-notes {
                margin-top: 10px;
                font-size: 14px;
                color: var(--text-secondary);
                font-style: italic;
                padding-top: 8px;
                border-top: 1px dashed var(--border-color);
            }
            
            .empty-state {
                text-align: center;
                padding: 30px;
                color: var(--text-secondary);
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }
}
