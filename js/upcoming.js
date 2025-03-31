/**
 * Upcoming bills expansion functionality
 */

// Initialize upcoming bills view when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initUpcomingBillsView();
});

// Initialize upcoming bills view
function initUpcomingBillsView() {
    const upcomingBillsCard = document.getElementById('upcoming-bills-card');
    
    if (upcomingBillsCard) {
        upcomingBillsCard.addEventListener('click', function() {
            showUpcomingBills();
        });
        // Add visual indication that the card is clickable
        upcomingBillsCard.classList.add('clickable');
    }
}

// Show upcoming bills
function showUpcomingBills() {
    const modal = document.getElementById('bills-details-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const titleElement = document.getElementById('bills-details-title');
    const billsListElement = document.getElementById('bills-details-list');
    
    // Clear previous content
    billsListElement.innerHTML = '';
    
    // Set the title for upcoming bills
    titleElement.textContent = 'Upcoming Bills (Next 30 Days)';
    
    // Get upcoming bills for the next 30 days
    const bills = window.billManager.getUpcomingBills(30);
    if (!bills.length) {
        billsListElement.innerHTML = '<div class="empty-state">No upcoming bills in the next 30 days.</div>';
        openModal();
        return;
    }
    
    // Sort bills by due date (closest first)
    const sortedBills = bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Group bills by month
    const groupedBills = {};
    sortedBills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        const monthYear = dueDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        
        if (!groupedBills[monthYear]) {
            groupedBills[monthYear] = [];
        }
        
        groupedBills[monthYear].push(bill);
    });
    
    // Create sections for each month
    Object.keys(groupedBills).forEach(monthYear => {
        const monthSection = document.createElement('div');
        monthSection.className = 'bills-month-section';
        
        const monthHeader = document.createElement('h3');
        monthHeader.className = 'bills-month-header';
        monthHeader.textContent = monthYear;
        
        monthSection.appendChild(monthHeader);
        
        // Add bills for this month
        groupedBills[monthYear].forEach(bill => {
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
            
            monthSection.appendChild(billElement);
        });
        
        billsListElement.appendChild(monthSection);
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
            
            .bills-month-header {
                font-size: 16px;
                font-weight: 600;
                margin: 20px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid var(--border-color);
                color: var(--primary-color);
            }
            
            .bills-month-header:first-child {
                margin-top: 0;
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
