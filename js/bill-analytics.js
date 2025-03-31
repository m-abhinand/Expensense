/**
 * Bill Analytics functionality
 */

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBillAnalytics();
});

// Initialize bill analytics
function initBillAnalytics() {
    updateAnalyticsPeriod();
    initPaymentTrendChart();
    
    // Set up period change listener
    const periodSelect = document.getElementById('analytics-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            updateAnalyticsPeriod();
        });
    }
}

// Update analytics based on selected period
function updateAnalyticsPeriod() {
    const periodSelect = document.getElementById('analytics-period');
    const months = parseInt(periodSelect.value);
    
    // Update chart
    updatePaymentTrendChart(months);
    
    // Update stats
    updateAnalyticsStats(months);
}

// Initialize payment trend chart
function initPaymentTrendChart() {
    const ctx = document.getElementById('payment-trend-chart').getContext('2d');
    
    // Get current theme
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e1e1e1' : '#333333';
    const gridColor = isDarkMode ? '#444444' : '#dddddd';
    
    // Create the chart
    window.paymentTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Paid Bills',
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Overdue Bills',
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            // Replace hardcoded $ with formatCurrency
                            return formatCurrency(value).replace(/[0-9.,]/g, '').trim() + value;
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
    
    // Initial update
    updatePaymentTrendChart(6); // Default 6 months
}

// Update payment trend chart with data
function updatePaymentTrendChart(months) {
    if (!window.paymentTrendChart || !window.billManager) return;
    
    // Get bills for analysis
    const bills = window.billManager.getAllBills();
    if (!bills.length) return;
    
    // Get date range
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - months);
    
    // Prepare data structure for months
    const labels = [];
    const paidData = [];
    const overdueData = [];
    
    // Generate labels and initialize data arrays
    for (let i = 0; i < months; i++) {
        const monthDate = new Date(startDate);
        monthDate.setMonth(startDate.getMonth() + i);
        const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        labels.push(monthLabel);
        paidData.push(0);
        overdueData.push(0);
    }
    
    // Categorize and sum bills by month
    bills.forEach(bill => {
        const billDate = new Date(bill.dueDate);
        
        // Skip bills outside the range
        if (billDate < startDate || billDate > now) return;
        
        // Calculate month index
        const monthDiff = (billDate.getFullYear() - startDate.getFullYear()) * 12 
                         + (billDate.getMonth() - startDate.getMonth());
        
        if (monthDiff >= 0 && monthDiff < months) {
            if (bill.status === 'paid') {
                paidData[monthDiff] += bill.amount;
            } else if (bill.status === 'overdue') {
                overdueData[monthDiff] += bill.amount;
            }
        }
    });
    
    // Update chart data
    window.paymentTrendChart.data.labels = labels;
    window.paymentTrendChart.data.datasets[0].data = paidData;
    window.paymentTrendChart.data.datasets[1].data = overdueData;
    
    // Update chart
    window.paymentTrendChart.update();
}

// Update analytics statistics
function updateAnalyticsStats(months) {
    if (!window.billManager) return;
    
    // Get bills for analysis
    const bills = window.billManager.getAllBills();
    if (!bills.length) return;
    
    // Get date range
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - months);
    
    // Filter bills in the date range
    const billsInRange = bills.filter(bill => {
        const billDate = new Date(bill.dueDate);
        return billDate >= startDate && billDate <= now;
    });
    
    // Calculate average monthly spending
    const totalAmount = billsInRange.reduce((sum, bill) => sum + bill.amount, 0);
    const avgMonthly = totalAmount / months;
    
    // Count late payments
    const latePayments = billsInRange.filter(bill => bill.status === 'overdue').length;
    
    // Find highest spending category
    const categorySpending = {};
    billsInRange.forEach(bill => {
        if (!categorySpending[bill.category]) {
            categorySpending[bill.category] = 0;
        }
        categorySpending[bill.category] += bill.amount;
    });
    
    let highestCategory = null;
    let highestAmount = 0;
    
    Object.entries(categorySpending).forEach(([category, amount]) => {
        if (amount > highestAmount) {
            highestAmount = amount;
            highestCategory = category;
        }
    });
    
    // Update UI
    document.getElementById('avg-monthly').textContent = formatCurrency(avgMonthly);
    document.getElementById('late-payment-count').textContent = latePayments;
    document.getElementById('highest-category').textContent = highestCategory ? 
        getCategoryName(highestCategory) : '-';
}

// Theme change listener to update chart colors
document.addEventListener('themeChanged', function(e) {
    if (window.paymentTrendChart) {
        const isDarkMode = e.detail.theme === 'dark';
        const textColor = isDarkMode ? '#e1e1e1' : '#333333';
        const gridColor = isDarkMode ? '#444444' : '#dddddd';
        
        // Update chart colors
        window.paymentTrendChart.options.scales.y.ticks.color = textColor;
        window.paymentTrendChart.options.scales.y.grid.color = gridColor;
        window.paymentTrendChart.options.scales.x.ticks.color = textColor;
        window.paymentTrendChart.options.scales.x.grid.color = gridColor;
        window.paymentTrendChart.options.plugins.legend.labels.color = textColor;
        
        // Update the chart
        window.paymentTrendChart.update();
    }
});
