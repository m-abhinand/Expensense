/**
 * Export functionality for expense data
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the export buttons
    initializeExport();
    
    // Initialize the reset functionality
    initializeReset();
});

// Initialize export functionality
function initializeExport() {
    const csvButton = document.getElementById('export-csv');
    const pdfButton = document.getElementById('export-pdf');
    
    if (csvButton) {
        csvButton.addEventListener('click', function() {
            exportToCSV();
            animateExport(this);
        });
    }
    
    if (pdfButton) {
        pdfButton.addEventListener('click', function() {
            exportToPDF();
            animateExport(this);
        });
    }
}

// Animate the export button when clicked
function animateExport(button) {
    button.classList.add('downloading');
    setTimeout(() => {
        button.classList.remove('downloading');
        button.classList.add('success-pulse');
        setTimeout(() => {
            button.classList.remove('success-pulse');
        }, 500);
    }, 1000);
}

// Export expense data to CSV
function exportToCSV() {
    // Get user data
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get all expenses
    const expenses = expenseManager.getAllExpenses();
    if (expenses.length === 0) {
        showMessage('No expense data to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Date,Category,Amount,Notes\n';
    
    // Add expense rows
    expenses.forEach(expense => {
        const date = formatDate(expense.date);
        const category = getCategoryName(expense.category);
        const amount = expense.amount.toFixed(2);
        // Escape notes to handle commas and quotes
        const notes = expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : '';
        
        csvContent += `${date},${category},${amount},${notes}\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `expense-data-${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Expense data exported to CSV successfully!', 'success');
}

// Export expense data to PDF
function exportToPDF() {
    // Make sure jsPDF is loaded
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
        showMessage('PDF export library not loaded properly', 'error');
        return;
    }
    
    // Get user data
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get all expenses
    const expenses = expenseManager.getAllExpenses();
    if (expenses.length === 0) {
        showMessage('No expense data to export', 'warning');
        return;
    }
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    const username = currentUser.fullname || currentUser.email;
    doc.setFontSize(22);
    doc.text('Expense Report', 105, 20, { align: 'center' });
    
    // Add user info
    doc.setFontSize(12);
    doc.text(`User: ${username}`, 105, 30, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 36, { align: 'center' });
    
    // Add summary
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    doc.setFontSize(14);
    doc.text('Expense Summary', 14, 50);
    doc.setFontSize(12);
    doc.text(`Total Expenses: ${formatCurrency(total)}`, 14, 58);
    
    // Get category totals
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += expense.amount;
    });
    
    // Add category breakdown
    let yPos = 66;
    doc.text('Category Breakdown:', 14, yPos);
    yPos += 8;
    
    Object.entries(categoryTotals).forEach(([category, total]) => {
        const categoryName = getCategoryName(category);
        doc.text(`${categoryName}: ${formatCurrency(total)}`, 20, yPos);
        yPos += 6;
    });
    
    // Add expense table
    const tableData = [];
    expenses.forEach(expense => {
        tableData.push([
            formatDate(expense.date),
            getCategoryName(expense.category),
            formatCurrency(expense.amount),
            expense.notes || ''
        ]);
    });
    
    doc.setFontSize(14);
    doc.text('Detailed Expenses', 14, yPos + 8);
    
    // Create the table
    doc.autoTable({
        startY: yPos + 15,
        head: [['Date', 'Category', 'Amount', 'Notes']],
        body: tableData,
        headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap'
        },
        columnStyles: {
            0: { cellWidth: 30 },  // Date
            1: { cellWidth: 40 },  // Category
            2: { cellWidth: 30 },  // Amount
            3: { cellWidth: 'auto' }  // Notes
        }
    });
    
    // Save the PDF
    const filename = `expense-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    
    showMessage('Expense data exported to PDF successfully!', 'success');
}

// Initialize reset functionality
function initializeReset() {
    const resetButton = document.getElementById('reset-data');
    const confirmResetButton = document.getElementById('confirm-reset');
    const cancelResetButtons = document.querySelectorAll('.cancel-reset, #reset-confirmation-modal .close-modal');
    const modal = document.getElementById('reset-confirmation-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Show confirmation modal
            modal.classList.add('active');
            backdrop.classList.add('active');
        });
    }
    
    // Cancel reset
    cancelResetButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.remove('active');
            backdrop.classList.remove('active');
        });
    });
    
    // Confirm reset
    if (confirmResetButton) {
        confirmResetButton.addEventListener('click', function() {
            resetUserData();
            modal.classList.remove('active');
            backdrop.classList.remove('active');
        });
    }
}

// Reset all user data
function resetUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userEmail = currentUser.email;
    
    // Clear expenses
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '{}');
    if (allExpenses[userEmail]) {
        allExpenses[userEmail] = [];
        localStorage.setItem('expenses', JSON.stringify(allExpenses));
    }
    
    // Clear budgets
    const allBudgets = JSON.parse(localStorage.getItem('budgets') || '{}');
    if (allBudgets[userEmail]) {
        allBudgets[userEmail] = {};
        localStorage.setItem('budgets', JSON.stringify(allBudgets));
    }
    
    // Show success message with animation
    showResetSuccessMessage();
    
    // Reload expense data and refresh UI
    if (expenseManager) {
        expenseManager.loadExpenses();
    }
    
    if (budgetManager) {
        budgetManager.loadBudgets();
    }
    
    // Update UI
    renderExpenseList();
    updateBudgetDisplays();
    updateCharts();
}

// Show a success message for data reset with animation
function showResetSuccessMessage() {
    // Create a custom message element
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message message-success reset-success';
    messageContainer.innerHTML = `
        <div class="message-content">
            <div class="message-icon">✅</div>
            <div class="message-text">
                <strong>Data Reset Complete</strong>
                <p>All your expense data has been reset successfully.</p>
            </div>
            <button class="close-message">×</button>
        </div>
    `;
    
    document.body.appendChild(messageContainer);
    
    setTimeout(() => {
        messageContainer.classList.add('message-show');
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        messageContainer.classList.remove('message-show');
        setTimeout(() => {
            if (messageContainer.parentNode) {
                messageContainer.parentNode.removeChild(messageContainer);
            }
        }, 300);
    }, 4000);
    
    // Add close button functionality
    const closeBtn = messageContainer.querySelector('.close-message');
    closeBtn.addEventListener('click', () => {
        messageContainer.classList.remove('message-show');
        setTimeout(() => {
            if (messageContainer.parentNode) {
                messageContainer.parentNode.removeChild(messageContainer);
            }
        }, 300);
    });
}

// Test export functions
function testExportFunctions() {
    console.log('Testing export to CSV...');
    try {
        exportToCSV();
        console.log('CSV export test successful');
    } catch (error) {
        console.error('CSV export test failed:', error);
    }
    
    console.log('Testing export to PDF...');
    try {
        exportToPDF();
        console.log('PDF export test successful');
    } catch (error) {
        console.error('PDF export test failed:', error);
    }
}
