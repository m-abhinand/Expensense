/**
 * Dashboard Charts and Data Visualization
 */

// Chart colors
const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC249', '#EA5F89', '#00C9A7', '#C4B8DC'
];

// Dark mode chart options
const darkModeChartOptions = {
    color: '#e1e1e1',
    borderColor: '#333',
    gridColor: '#333'
};

// Light mode chart options
const lightModeChartOptions = {
    color: '#333',
    borderColor: '#ddd',
    gridColor: '#ddd'
};

// Get current chart theme options
function getChartThemeOptions() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? darkModeChartOptions : lightModeChartOptions;
}

// Update charts for theme
function updateChartsForTheme(theme) {
    // Update charts if they exist
    if (window.categoryChart) {
        updateChartTheme(window.categoryChart, theme);
    }
    
    if (window.trendChart) {
        updateChartTheme(window.trendChart, theme);
    }
}

// Update a specific chart for the theme
function updateChartTheme(chart, theme) {
    const options = theme === 'dark' ? darkModeChartOptions : lightModeChartOptions;
    
    // Update grid lines
    if (chart.options.scales && chart.options.scales.y) {
        chart.options.scales.y.grid.color = options.gridColor;
        chart.options.scales.y.ticks.color = options.color;
    }
    
    if (chart.options.scales && chart.options.scales.x) {
        chart.options.scales.x.grid.color = options.gridColor;
        chart.options.scales.x.ticks.color = options.color;
    }
    
    // Update legend text color
    if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = options.color;
    }
    
    // Update tooltip styling
    if (chart.options.plugins && chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        chart.options.plugins.tooltip.titleColor = theme === 'dark' ? '#fff' : '#000';
        chart.options.plugins.tooltip.bodyColor = theme === 'dark' ? '#ddd' : '#333';
    }
    
    chart.update();
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure expense data is loaded
    setTimeout(() => {
        updateSummary();
        initCategoryChart();
        initTrendChart();
        updateCategoryBreakdown();
        
        // Setup filter for expense list
        setupExpenseFilter();
    }, 100);
    
    // Update charts when budgets are updated
    document.addEventListener('budgetsUpdated', function() {
        initTrendChart(); // Update to show budget lines
    });
});

// Update expense summary
function updateSummary() {
    const expenses = expenseManager.getAllExpenses();
    
    // Calculate total expenses
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('total-expenses').textContent = formatCurrency(total);
    
    // This month's expenses
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
    });
    
    const monthTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('month-expenses').textContent = formatCurrency(monthTotal);
    
    // This week's expenses
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfWeek;
    });
    
    const weekTotal = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('week-expenses').textContent = formatCurrency(weekTotal);
    
    // Average daily expense (for this month)
    let avgDaily = 0;
    if (monthlyExpenses.length > 0) {
        // Get the number of days in the current month with expenses
        const uniqueDays = new Set(monthlyExpenses.map(expense => 
            new Date(expense.date).getDate()
        ));
        
        avgDaily = monthTotal / uniqueDays.size;
    }
    
    document.getElementById('avg-expenses').textContent = formatCurrency(avgDaily);
    
    // Add a subtle animation to the summary cards
    animateSummaryCards();
}

// Initialize category chart (pie chart)
function initCategoryChart() {
    const expenses = expenseManager.getAllExpenses();
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Group expenses by category
    const categoryData = {};
    expenses.forEach(expense => {
        if (categoryData[expense.category]) {
            categoryData[expense.category] += expense.amount;
        } else {
            categoryData[expense.category] = expense.amount;
        }
    });
    
    // Convert to arrays for Chart.js
    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    const categoryLabels = categories.map(category => getCategoryName(category));
    
    // Get theme options
    const themeOptions = getChartThemeOptions();
    
    // Create the chart
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map((_, i) => chartColors[i % chartColors.length]),
                borderColor: 'white',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        color: themeOptions.color
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 
                        'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 
                        '#fff' : '#000',
                    bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 
                        '#ddd' : '#333'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        }
    });
}

// Initialize trend chart (bar chart) with budget lines
function initTrendChart() {
    const expenses = expenseManager.getAllExpenses();
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // Get last 6 months
    const labels = [];
    const data = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get monthly budget if set
    const monthlyBudget = budgetManager.getBudget('monthly');
    const monthlyBudgetAmount = monthlyBudget ? monthlyBudget.amount : null;
    
    // Calculate weekly budget as a comparable monthly value
    const weeklyBudget = budgetManager.getBudget('weekly');
    const weeklyBudgetMonthly = weeklyBudget ? (weeklyBudget.amount * 4.33) : null; // Average weeks in a month
    
    for (let i = 5; i >= 0; i--) {
        // Calculate month and year
        let month = currentMonth - i;
        let year = currentYear;
        
        if (month < 0) {
            month += 12;
            year -= 1;
        }
        
        // Month label (e.g., "Jan 2023")
        labels.push(`${monthNames[month]} ${year}`);
        
        // Calculate total for this month
        const monthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        });
        
        const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        data.push(monthTotal);
    }
    
    const datasets = [
        {
            label: 'Monthly Expenses',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            order: 2
        }
    ];
    
    // Add budget lines if budgets are set
    if (monthlyBudgetAmount) {
        datasets.push({
            label: 'Monthly Budget',
            data: Array(labels.length).fill(monthlyBudgetAmount),
            type: 'line',
            borderColor: 'rgba(39, 174, 96, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0,
            order: 0
        });
    }
    
    if (weeklyBudgetMonthly) {
        datasets.push({
            label: 'Weekly Budget (Monthly Equivalent)',
            data: Array(labels.length).fill(weeklyBudgetMonthly),
            type: 'line',
            borderColor: 'rgba(243, 156, 18, 0.8)',
            borderWidth: 2,
            borderDash: [2, 2],
            pointRadius: 0,
            fill: false,
            tension: 0,
            order: 1
        });
    }
    
    // Get theme options
    const themeOptions = getChartThemeOptions();
    
    // Add theme options to chart config
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        // Extract currency symbol from the formatted currency string
                        return formatCurrency(value).replace(/[0-9.,]/g, '').trim() + value;
                    },
                    color: themeOptions.color
                },
                grid: {
                    color: themeOptions.gridColor
                }
            },
            x: {
                ticks: {
                    color: themeOptions.color
                },
                grid: {
                    color: themeOptions.gridColor
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: themeOptions.color
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        return formatCurrency(context.raw);
                    }
                },
                backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 
                    'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 
                    '#fff' : '#000',
                bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 
                    '#ddd' : '#333'
            }
        },
        animation: {
            duration: 1500,
            easing: 'easeOutQuart'
        }
    };
    
    // Create the chart
    if (window.trendChart) {
        window.trendChart.destroy();
    }
    
    window.trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

// Update category breakdown section
function updateCategoryBreakdown() {
    const expenses = expenseManager.getAllExpenses();
    const container = document.getElementById('categories-breakdown');
    container.innerHTML = '';
    
    // Calculate total
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group expenses by category
    const categoryData = {};
    expenses.forEach(expense => {
        if (categoryData[expense.category]) {
            categoryData[expense.category] += expense.amount;
        } else {
            categoryData[expense.category] = expense.amount;
        }
    });
    
    // Sort categories by amount (descending)
    const sortedCategories = Object.keys(categoryData).sort((a, b) => {
        return categoryData[b] - categoryData[a];
    });
    
    // Category icons (emoji for simplicity)
    const categoryIcons = {
        food: '🍔',
        transportation: '🚗',
        housing: '🏠',
        utilities: '💡',
        entertainment: '🎬',
        shopping: '🛍️',
        health: '🏥',
        travel: '✈️',
        education: '📚',
        other: '📎'
    };
    
    // Create category items
    sortedCategories.forEach((category, index) => {
        const amount = categoryData[category];
        const percent = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
        
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.style.borderLeftColor = chartColors[index % chartColors.length];
        
        // Add data attribute for the category - this is the key change
        categoryItem.setAttribute('data-category', category);
        
        const icon = categoryIcons[category] || '📊';
        
        categoryItem.innerHTML = `
            <div class="category-name">
                <span class="category-icon" style="background-color: ${chartColors[index % chartColors.length]}">
                    ${icon}
                </span>
                ${getCategoryName(category)}
            </div>
            <div class="category-info">
                <div class="category-amount">${formatCurrency(amount)}</div>
                <div class="category-percent">${percent}%</div>
            </div>
        `;
        
        // Add animation delay based on index
        categoryItem.style.animationDelay = `${index * 0.05}s`;
        
        container.appendChild(categoryItem);
    });
    
    // If no categories, show a message
    if (sortedCategories.length === 0) {
        container.innerHTML = '<p class="empty-state">No expense data to display.</p>';
    }
    
    // Dispatch an event to notify that categories have been updated
    document.dispatchEvent(new Event('categoryBreakdownUpdated'));
}

// Setup expense filter dropdown
function setupExpenseFilter() {
    const filterSelect = document.getElementById('expense-filter');
    
    filterSelect.addEventListener('change', function() {
        const filterValue = this.value;
        let filteredExpenses;
        
        switch(filterValue) {
            case 'month':
                filteredExpenses = filterExpensesByMonth();
                break;
            case 'week':
                filteredExpenses = filterExpensesByWeek();
                break;
            case 'day':
                filteredExpenses = filterExpensesByDay();
                break;
            default:
                filteredExpenses = expenseManager.getAllExpenses();
        }
        
        renderExpenseList(filteredExpenses);
    });
}

// Filter expenses by current month
function filterExpensesByMonth() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return expenseManager.getAllExpenses().filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === thisMonth && 
               expenseDate.getFullYear() === thisYear;
    });
}

// Filter expenses by current week
function filterExpensesByWeek() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return expenseManager.getAllExpenses().filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfWeek;
    });
}

// Filter expenses by current day
function filterExpensesByDay() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return expenseManager.getAllExpenses().filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseDay = new Date(
            expenseDate.getFullYear(), 
            expenseDate.getMonth(), 
            expenseDate.getDate()
        );
        return expenseDay.getTime() === today.getTime();
    });
}

// Animate summary cards with a subtle effect
function animateSummaryCards() {
    const cards = document.querySelectorAll('.summary-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'scale(1.03)';
            setTimeout(() => {
                card.style.transform = '';
            }, 300);
        }, index * 100);
    });
}

// Update all charts and summaries
function updateCharts() {
    updateSummary();
    initCategoryChart();
    initTrendChart();
    updateCategoryBreakdown();
}

// Add event listener to update charts when expenses change
document.addEventListener('expensesUpdated', updateCharts);

// Add event listener to update charts when theme changes
document.addEventListener('themeChanged', function(e) {
    if (window.categoryChart) {
        const isDarkMode = e.detail.theme === 'dark';
        const textColor = isDarkMode ? '#e1e1e1' : '#333333';
        
        window.categoryChart.options.plugins.legend.labels.color = textColor;
        window.categoryChart.update();
    }
    
    if (window.trendChart) {
        const isDarkMode = e.detail.theme === 'dark';
        const textColor = isDarkMode ? '#e1e1e1' : '#333333';
        const gridColor = isDarkMode ? '#444444' : '#dddddd';
        
        window.trendChart.options.scales.y.ticks.color = textColor;
        window.trendChart.options.scales.y.grid.color = gridColor;
        window.trendChart.options.scales.x.ticks.color = textColor;
        window.trendChart.options.scales.x.grid.color = gridColor;
        window.trendChart.options.plugins.legend.labels.color = textColor;
        
        window.trendChart.update();
    }
});
