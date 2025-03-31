/**
 * Bills management functionality
 */

class Bill {
    constructor(name, amount, category, dueDate, frequency, reminder, notes = '', isRecurring = true) {
        this.id = Date.now().toString();
        this.name = name;
        this.amount = parseFloat(amount);
        this.category = category;
        this.dueDate = dueDate;
        this.frequency = frequency;
        this.reminder = parseInt(reminder);
        this.notes = notes;
        this.status = 'pending';
        this.createdAt = new Date().toISOString();
        this.payments = [];
        this.isRecurring = isRecurring; // New property to distinguish one-time bills
    }
}

class BillManager {
    constructor() {
        this.bills = [];
        try {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) {
                console.error('No user found in localStorage');
                window.location.href = 'index.html'; // Redirect to login
                return;
            }
            this.currentUser = JSON.parse(userStr);
            if (!this.currentUser || !this.currentUser.email) {
                console.error('Invalid user data in localStorage');
                window.location.href = 'index.html'; // Redirect to login
                return;
            }
            console.log('BillManager initialized with user:', this.currentUser.email);
            this.loadBills();
        } catch (err) {
            console.error('Error initializing BillManager:', err);
            this.currentUser = null;
        }
    }

    loadBills() {
        if (!this.currentUser || !this.currentUser.email) {
            console.error('No valid current user found when loading bills');
            return;
        }
        
        try {
            const billsStr = localStorage.getItem(`bills_${this.currentUser.email}`); // Use user-specific key
            console.log('Raw bills data from localStorage:', billsStr);
            
            if (billsStr && billsStr !== 'undefined' && billsStr !== 'null') {
                try {
                    this.bills = JSON.parse(billsStr);
                    if (!Array.isArray(this.bills)) {
                        console.error('Invalid bills data in localStorage, resetting');
                        this.bills = [];
                    }
                } catch (e) {
                    console.error('Error parsing bills JSON:', e);
                    this.bills = [];
                }
            } else {
                this.bills = [];
            }
            
            console.log(`Loaded ${this.bills.length} bills for user ${this.currentUser.email}`);
            
            // Validate each bill
            this.bills = this.bills.filter(bill => {
                if (!bill || !bill.id || !bill.name || !bill.dueDate) {
                    console.warn('Filtered out invalid bill:', bill);
                    return false;
                }
                return true;
            });
            
            // Debug: List loaded bills
            this.bills.forEach((bill, index) => {
                console.log(`Bill ${index + 1}:`, bill.name, bill.amount, bill.dueDate, bill.isRecurring ? 'Recurring' : 'One-time');
            });
        } catch (err) {
            console.error('Error loading bills:', err);
            this.bills = [];
        }
    }

    saveBills() {
        if (!this.currentUser || !this.currentUser.email) {
            console.error('No valid current user found when saving bills');
            return;
        }
        
        try {
            // Validate bills array
            if (!Array.isArray(this.bills)) {
                console.error('Bills is not an array, resetting');
                this.bills = [];
            }
            
            // Direct save to user-specific key
            const saveStr = JSON.stringify(this.bills);
            localStorage.setItem(`bills_${this.currentUser.email}`, saveStr);
            
            console.log(`Saved ${this.bills.length} bills for user ${this.currentUser.email}`);
            
            // Verify save was successful
            const verifyStr = localStorage.getItem(`bills_${this.currentUser.email}`);
            if (!verifyStr || verifyStr !== saveStr) {
                console.error('Save verification failed - localStorage.getItem does not match what was set');
            }
            
            // Debug: List saved bills
            this.bills.forEach((bill, index) => {
                console.log(`Saved Bill ${index + 1}:`, bill.name, bill.amount, bill.dueDate, bill.isRecurring ? 'Recurring' : 'One-time');
            });
        } catch (err) {
            console.error('Error saving bills:', err);
        }
        document.dispatchEvent(new Event('billsUpdated'));
    }

    addBill(name, amount, category, dueDate, frequency, reminder, notes, isRecurring = true) {
        const bill = new Bill(name, amount, category, dueDate, frequency, reminder, notes, isRecurring);
        this.bills.push(bill);
        this.saveBills();
        return bill;
    }

    updateBill(id, updates) {
        const index = this.bills.findIndex(bill => bill.id === id);
        if (index === -1) return null;

        this.bills[index] = { ...this.bills[index], ...updates };
        this.saveBills();
        return this.bills[index];
    }

    deleteBill(id) {
        const index = this.bills.findIndex(bill => bill.id === id);
        if (index === -1) return false;

        this.bills.splice(index, 1);
        this.saveBills();
        return true;
    }

    getBill(id) {
        return this.bills.find(bill => bill.id === id);
    }

    getAllBills() {
        return this.bills;
    }

    markBillAsPaid(id, paymentDate, amount) {
        const bill = this.getBill(id);
        if (!bill) return false;

        const payment = {
            id: Date.now().toString(),
            date: paymentDate,
            amount: parseFloat(amount)
        };

        bill.payments.push(payment);
        bill.status = 'paid';
        
        // Add expense entry for the paid bill
        if (window.expenseManager) {
            // Create an expense entry with the bill's category (or 'bills' if no matching category)
            let expenseCategory = 'other'; // Default category
            
            // Map bill categories to expense categories
            const categoryMap = {
                'utilities': 'utilities',
                'rent': 'housing',
                'insurance': 'other',
                'subscription': 'entertainment',
                'phone': 'utilities',
                'other': 'other'
            };
            
            expenseCategory = categoryMap[bill.category] || 'other';
            
            // Add the expense with bill name in notes
            window.expenseManager.addExpense(
                parseFloat(amount),
                expenseCategory,
                paymentDate,
                `Payment for bill: ${bill.name}`
            );
            
            // Dispatch event to update dashboard charts and data
            document.dispatchEvent(new Event('expensesUpdated'));
        }
        
        // Only create next bill if this is a recurring bill
        if (bill.isRecurring) {
            // Calculate next due date based on frequency
            const dueDate = new Date(bill.dueDate);
            
            switch(bill.frequency) {
                case 'monthly':
                    dueDate.setMonth(dueDate.getMonth() + 1);
                    break;
                case 'weekly':
                    dueDate.setDate(dueDate.getDate() + 7);
                    break;
                case 'yearly':
                    dueDate.setFullYear(dueDate.getFullYear() + 1);
                    break;
                case 'quarterly':
                    dueDate.setMonth(dueDate.getMonth() + 3);
                    break;
                case 'biweekly':
                    dueDate.setDate(dueDate.getDate() + 14);
                    break;
                default:
                    // For one-time bills or unknown frequency, don't create next bill
                    this.saveBills();
                    return true;
            }
            
            // Create a new bill entry for the next payment cycle
            const nextBill = { 
                ...bill,
                id: Date.now().toString(),
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'pending',
                payments: [],
                createdAt: new Date().toISOString()
            };
            
            this.bills.push(nextBill);
        }
        
        this.saveBills();
        return true;
    }

    getBillsDueOn(date) {
        // Create a date string in YYYY-MM-DD format without timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        return this.bills.filter(bill => {
            return bill.dueDate === dateStr && bill.status !== 'paid';
        });
    }

    getUpcomingBills(days = 30) {
        const today = new Date();
        const future = new Date();
        future.setDate(today.getDate() + days);

        return this.bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate >= today && dueDate <= future && bill.status !== 'paid';
        });
    }

    getBillsDueThisWeek() {
        const today = new Date();
        const endOfWeek = new Date();
        endOfWeek.setDate(today.getDate() + 7);

        return this.bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate >= today && dueDate <= endOfWeek && bill.status !== 'paid';
        });
    }

    calculateMonthlyTotal() {
        return this.bills.reduce((total, bill) => {
            // Only count bills that are pending or haven't been paid this month
            if (bill.status === 'paid') return total;
            
            switch (bill.frequency) {
                case 'monthly':
                    return total + bill.amount;
                case 'yearly':
                    return total + (bill.amount / 12);
                case 'quarterly':
                    return total + (bill.amount / 3);
                case 'weekly':
                    return total + (bill.amount * 4.33);
                case 'biweekly':
                    return total + (bill.amount * 2.17);
                default:
                    return total;
            }
        }, 0);
    }

    checkForOverdueBills() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let changed = false;
        
        this.bills.forEach(bill => {
            if (bill.status === 'pending') {
                const dueDate = new Date(bill.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                
                if (dueDate < today) {
                    bill.status = 'overdue';
                    changed = true;
                }
            }
        });
        
        if (changed) {
            this.saveBills();
        }
        
        return changed;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Create a single global instance of the bill manager
    window.billManager = new BillManager();
    
    // Initialize expense manager if not already initialized
    if (!window.expenseManager && typeof ExpenseManager !== 'undefined') {
        window.expenseManager = new ExpenseManager();
    }
    
    // Initialize UI first to ensure event listeners are attached
    initUI();
    
    // Update summary data
    updateSummary();
    
    // Render bills list
    renderBillsList();
    
    // Render calendar with bills
    renderCalendar(currentDate);
    
    // Check for overdue bills
    window.billManager.checkForOverdueBills();

    // Set default date for payment form
    document.getElementById('payment-date').valueAsDate = new Date();
    
    // Add currency change listener to update modals if currency is changed on another page
    window.addEventListener('storage', function(e) {
        if (e.key === 'userCurrency') {
            // Update any open modals with new currency
            updateCurrencySymbolInModal('#bill-modal');
            updateCurrencySymbolInModal('#mark-paid-modal');
        }
    });
    
    console.log('Bills page initialization complete');
});

// DOM Elements
let currentDate = new Date();
let selectedDate = null;
let currentBillId = null;

// Initialize UI elements and event listeners
function initUI() {
    console.log('Initializing UI elements and event listeners');
    
    // Menu toggle - Using setTimeout to ensure DOM is fully loaded
    setTimeout(function() {
        const menuToggle = document.getElementById('menu-toggle');
        const navSidebar = document.getElementById('nav-sidebar');
        const closeNav = document.getElementById('close-nav');
        const navOverlay = document.getElementById('nav-overlay');
        
        if (!menuToggle || !navSidebar || !closeNav || !navOverlay) {
            console.error('Navigation elements not found:', {
                menuToggle: !!menuToggle,
                navSidebar: !!navSidebar,
                closeNav: !!closeNav,
                navOverlay: !!navOverlay
            });
            return;
        }
        
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Menu toggle clicked');
            navSidebar.classList.add('active');
            navOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
        
        closeNav.addEventListener('click', function() {
            closeNavigation();
        });
        
        navOverlay.addEventListener('click', function() {
            closeNavigation();
        });
        
        function closeNavigation() {
            console.log('Closing navigation');
            navSidebar.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Enable scrolling
        }
    }, 100);
    
    // User dropdown functionality
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (profileBtn && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update theme icon
            const themeIcon = document.getElementById('theme-icon');
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            }
        });
        
        // Set initial theme icon
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
    
    // Set the username in the header
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const userName = document.getElementById('user-name');
        if (userName) {
            userName.textContent = currentUser.fullname || currentUser.email.split('@')[0];
        }
    }
    
    // Add Bill button
    const addBillBtn = document.getElementById('add-bill-btn');
    if (addBillBtn) {
        addBillBtn.addEventListener('click', openAddBillModal);
    }
    
    // Bill form submission
    const billForm = document.getElementById('bill-form');
    if (billForm) {
        billForm.addEventListener('submit', handleBillFormSubmit);
    }
    
    // Payment form submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentFormSubmit);
    }
    
    // Delete bill confirmation
    const confirmDeleteBtn = document.getElementById('confirm-delete-bill');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteBill);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-bill, .cancel-payment, .cancel-delete').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Modal backdrop
    const modalBackdrop = document.getElementById('modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeAllModals);
    }

    // Handle recurring checkbox toggle
    const recurringCheckbox = document.getElementById('bill-is-recurring');
    if (recurringCheckbox) {
        recurringCheckbox.addEventListener('change', function() {
            toggleFrequencyOptions(this.checked);
        });
    }
}

// Update summary with totals
function updateSummary() {
    // Calculate monthly total
    const monthlyTotal = window.billManager.calculateMonthlyTotal();
    document.getElementById('total-bills').textContent = formatCurrency(monthlyTotal);
    
    // Calculate due this week
    const dueThisWeek = window.billManager.getBillsDueThisWeek();
    const dueThisWeekAmount = dueThisWeek.reduce((sum, bill) => sum + bill.amount, 0);
    document.getElementById('due-this-week').textContent = formatCurrency(dueThisWeekAmount);
    
    // Calculate upcoming bills (next 30 days)
    const upcomingBills = window.billManager.getUpcomingBills(30);
    const upcomingAmount = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
    document.getElementById('upcoming-bills').textContent = formatCurrency(upcomingAmount);
}

// Render bills list
function renderBillsList() {
    // Instead of directly rendering bills here, call applyFilters to respect tab selection
    if (typeof applyFilters === 'function') {
        applyFilters();
    } else {
        // Fallback for direct rendering if applyFilters isn't available
        const billsList = document.getElementById('bills-list');
        const emptyState = document.getElementById('empty-state');
        const bills = window.billManager.getAllBills();
        
        // Clear current list (except empty state)
        Array.from(billsList.children).forEach(child => {
            if (!child.id || child.id !== 'empty-state') {
                child.remove();
            }
        });
        
        if (bills.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Sort bills by due date (closest first)
        bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .forEach(bill => {
                const billElement = createBillElement(bill);
                billsList.appendChild(billElement);
            });
    }
    
    document.dispatchEvent(new Event('billsUpdated'));
}

// Create bill element
function createBillElement(bill) {
    const element = document.createElement('div');
    element.className = 'bill-item';
    element.dataset.id = bill.id;
    
    // Add a data attribute for recurring/one-time for potential styling
    element.dataset.type = bill.isRecurring ? 'recurring' : 'onetime';
    
    // Format date properly
    const dueDate = new Date(bill.dueDate);
    const formattedDate = dueDate.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
    
    // Get status class
    const statusClass = bill.status;
    
    // Create formatted frequency text
    let frequencyText = bill.isRecurring 
        ? bill.frequency.charAt(0).toUpperCase() + bill.frequency.slice(1)
        : 'One-time';
    
    element.innerHTML = `
        <div class="bill-header">
            <div class="bill-info">
                <div class="bill-name">${bill.name}</div>
                <div class="bill-amount">${formatCurrency(bill.amount)}</div>
                <div class="bill-details">
                    <span class="bill-category-badge category-${bill.category}">${getCategoryName(bill.category)}</span>
                    <span class="bill-status ${statusClass}">${bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}</span>
                    ${bill.isRecurring ? '<span class="bill-recurring-badge">Recurring</span>' : '<span class="bill-onetime-badge">One-time</span>'}
                </div>
            </div>
            <div class="bill-actions">
                <button class="btn btn-sm btn-outline edit-bill" title="Edit Bill">✏️</button>
                <button class="btn btn-sm btn-outline delete-bill" title="Delete Bill">🗑️</button>
                ${bill.status !== 'paid' ? `<button class="btn btn-sm btn-primary mark-paid-btn" title="Mark as Paid">✓</button>` : ''}
            </div>
        </div>
        <div class="bill-details">
            <div class="bill-due-date">
                <span>📅</span> Due: ${formattedDate}
            </div>
            <div class="bill-frequency">
                <span>🔄</span> ${frequencyText}
            </div>
        </div>
        ${bill.notes ? `<div class="bill-notes">${bill.notes}</div>` : ''}
    `;
    
    // Add event listeners
    const editBtn = element.querySelector('.edit-bill');
    const deleteBtn = element.querySelector('.delete-bill');
    const markPaidBtn = element.querySelector('.mark-paid-btn');
    
    editBtn.addEventListener('click', () => openEditBillModal(bill.id));
    deleteBtn.addEventListener('click', () => openDeleteBillModal(bill.id));
    
    if (markPaidBtn) {
        markPaidBtn.addEventListener('click', () => openMarkPaidModal(bill.id));
    }
    
    return element;
}

// Render calendar
function renderCalendar(date) {
    const calendarContainer = document.getElementById('calendar-container');
    
    // Clear container
    calendarContainer.innerHTML = '';
    
    // Create a new date object to avoid modifying the original date
    const displayDate = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // Create calendar header
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    
    const monthYear = displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    
    calendarHeader.innerHTML = `
        <h3>${monthYear}</h3>
        <div class="calendar-navigation">
            <button class="btn btn-sm btn-outline prev-month">◀</button>
            <button class="btn btn-sm btn-outline today-btn">Today</button>
            <button class="btn btn-sm btn-outline next-month">▶</button>
        </div>
    `;
    
    calendarContainer.appendChild(calendarHeader);
    
    // Add event listeners for navigation
    const prevMonthBtn = calendarHeader.querySelector('.prev-month');
    const nextMonthBtn = calendarHeader.querySelector('.next-month');
    const todayBtn = calendarHeader.querySelector('.today-btn');
    
    prevMonthBtn.addEventListener('click', () => {
        // Create a new date object, don't modify currentDate directly
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        currentDate = newDate;
        renderCalendar(currentDate);
    });
    
    todayBtn.addEventListener('click', () => {
        // Set calendar to current month
        currentDate = new Date();
        renderCalendar(currentDate);
        // Also reset any selected date
        selectedDate = null;
    });
    
    nextMonthBtn.addEventListener('click', () => {
        // Create a new date object, don't modify currentDate directly
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        currentDate = newDate;
        renderCalendar(currentDate);
    });
    
    // Create day labels
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabels = document.createElement('div');
    dayLabels.className = 'calendar-grid day-labels';
    
    daysOfWeek.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'day-label';
        dayLabel.textContent = day;
        dayLabels.appendChild(dayLabel);
    });
    
    calendarContainer.appendChild(dayLabels);
    
    // Create calendar grid
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // Get first day of month and number of days
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Get today for highlighting
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
        
        // Format date as YYYY-MM-DD to avoid timezone issues
        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const formattedDateStr = `${year}-${month}-${dayStr}`;
        
        // Check if this day has bills
        const dayBills = window.billManager.getBillsDueOn(dayDate);
        
        const calendarDay = document.createElement('div');
        calendarDay.className = 'calendar-day';
        calendarDay.textContent = day;
        calendarDay.dataset.date = formattedDateStr;
        
        // Add classes for styling
        if (dayBills.length > 0) {
            calendarDay.classList.add('has-bills');
            calendarDay.dataset.billCount = dayBills.length;
            calendarDay.title = `${dayBills.length} bill(s) due`;
            
            // Check for status - overdue has priority over pending
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            if (dayDate < currentDate) {
                calendarDay.classList.add('overdue');
            } else {
                calendarDay.classList.add('pending');
            }
        }
        
        // Add classes for styling
        if (dayBills.length > 0) {
            calendarDay.classList.add('has-bills');
            calendarDay.dataset.billCount = dayBills.length;
            calendarDay.title = `${dayBills.length} bill(s) due`;
            
            // Check if any bill is overdue
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (dayDate < currentDate) {
                calendarDay.classList.add('overdue');
            }
        }
        
        if (dayDate.getTime() === today.getTime()) {
            calendarDay.classList.add('today');
        }
        
        if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
            calendarDay.classList.add('selected');
        }
        
        // Add click listener to show bills for this day
        calendarDay.addEventListener('click', () => {
            // Deselect previous day
            const previousSelected = calendarGrid.querySelector('.calendar-day.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
            
            // Select this day
            calendarDay.classList.add('selected');
            selectedDate = dayDate;
            
            // Show bills for this day
            showBillsForDay(dayDate);
        });
        
        calendarGrid.appendChild(calendarDay);
    }
    
    calendarContainer.appendChild(calendarGrid);
}

// Show bills for a specific day
function showBillsForDay(date) {
    const bills = window.billManager.getBillsDueOn(date);
    const billsList = document.getElementById('bills-list');
    const emptyState = document.getElementById('empty-state');
    
    // Clear current list (except empty state)
    Array.from(billsList.children).forEach(child => {
        if (!child.id || child.id !== 'empty-state') {
            child.remove();
        }
    });
    
    if (bills.length === 0) {
        // Show temporary message
        const message = document.createElement('div');
        message.className = 'empty-state';
        message.innerHTML = `
            <p>No bills due on ${date.toLocaleDateString()}.</p>
            <button id="show-all-bills" class="btn btn-outline btn-sm">Show All Bills</button>
        `;
        
        message.querySelector('#show-all-bills').addEventListener('click', () => {
            renderBillsList();
        });
        
        billsList.appendChild(message);
        emptyState.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'date-filter-header';
        header.innerHTML = `
            <h3>Bills due on ${date.toLocaleDateString()}</h3>
            <button id="show-all-bills" class="btn btn-outline btn-sm">Show All</button>
        `;
        
        header.querySelector('#show-all-bills').addEventListener('click', () => {
            renderBillsList();
        });
        
        billsList.appendChild(header);
        
        // Add bills
        bills.forEach(bill => {
            const billElement = createBillElement(bill);
            billsList.appendChild(billElement);
        });
    }
}

// Open add bill modal
function openAddBillModal() {
    const modal = document.getElementById('bill-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('bill-modal-title');
    const billForm = document.getElementById('bill-form');
    
    // Set modal title
    modalTitle.textContent = 'Add New Bill';
    
    // Reset form
    billForm.reset();
    
    // Set default date (today)
    document.getElementById('bill-due-date').valueAsDate = new Date();
    
    // Reset bill ID
    document.getElementById('bill-id').value = '';
    
    // Set recurring checkbox to checked by default
    document.getElementById('bill-is-recurring').checked = true;
    toggleFrequencyOptions(true);
    
    // Update currency symbol
    updateCurrencySymbolInModal();
    
    // Show modal
    modal.classList.add('active');
    modalBackdrop.classList.add('active');
}

// Open edit bill modal
function openEditBillModal(id) {
    const bill = window.billManager.getBill(id);
    if (!bill) return;
    
    const modal = document.getElementById('bill-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('bill-modal-title');
    
    // Set modal title
    modalTitle.textContent = 'Edit Bill';
    
    // Set form values
    document.getElementById('bill-id').value = bill.id;
    document.getElementById('bill-name').value = bill.name;
    document.getElementById('bill-amount').value = bill.amount;
    document.getElementById('bill-category').value = bill.category;
    document.getElementById('bill-due-date').value = bill.dueDate;
    document.getElementById('bill-frequency').value = bill.frequency;
    document.getElementById('bill-reminder').value = bill.reminder;
    document.getElementById('bill-notes').value = bill.notes || '';
    document.getElementById('bill-is-recurring').checked = bill.isRecurring !== false; // Default to true if not specified
    
    // Update frequency options visibility
    toggleFrequencyOptions(bill.isRecurring !== false);
    
    // Update currency symbol
    updateCurrencySymbolInModal();
    
    // Show modal
    modal.classList.add('active');
    modalBackdrop.classList.add('active');
}

// Open delete bill modal
function openDeleteBillModal(id) {
    currentBillId = id;
    
    const modal = document.getElementById('delete-bill-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    
    modal.classList.add('active');
    modalBackdrop.classList.add('active');
}

// Open mark as paid modal
function openMarkPaidModal(id) {
    const bill = window.billManager.getBill(id);
    if (!bill) return;
    
    currentBillId = id;
    
    const modal = document.getElementById('mark-paid-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    
    // Set payment amount to bill amount by default
    document.getElementById('payment-bill-id').value = id;
    document.getElementById('payment-amount').value = bill.amount;
    
    // Set payment date to today
    document.getElementById('payment-date').valueAsDate = new Date();
    
    // Update currency symbol
    updateCurrencySymbolInModal('#mark-paid-modal');
    
    modal.classList.add('active');
    modalBackdrop.classList.add('active');
}

// Confirm delete bill
function confirmDeleteBill() {
    if (!currentBillId) return;
    
    window.billManager.deleteBill(currentBillId);
    currentBillId = null;
    
    closeAllModals();
    renderBillsList();
    renderCalendar(currentDate);
    updateSummary();
    
    showMessage('Bill deleted successfully', 'success');
}

// Handle bill form submit
function handleBillFormSubmit(event) {
    event.preventDefault();
    
    const billId = document.getElementById('bill-id').value;
    const name = document.getElementById('bill-name').value;
    const amount = document.getElementById('bill-amount').value;
    const category = document.getElementById('bill-category').value;
    const dueDate = document.getElementById('bill-due-date').value;
    const frequency = document.getElementById('bill-frequency').value;
    const reminder = document.getElementById('bill-reminder').value;
    const notes = document.getElementById('bill-notes').value;
    const isRecurring = document.getElementById('bill-is-recurring').checked;
    
    if (billId) {
        // Update existing bill
        window.billManager.updateBill(billId, {
            name,
            amount: parseFloat(amount),
            category,
            dueDate,
            frequency,
            reminder: parseInt(reminder),
            notes,
            isRecurring
        });
        
        showMessage('Bill updated successfully', 'success');
    } else {
        // Add new bill
        window.billManager.addBill(name, amount, category, dueDate, frequency, reminder, notes, isRecurring);
        showMessage('Bill added successfully', 'success');
    }
    
    closeAllModals();
    renderBillsList();
    renderCalendar(currentDate);
    updateSummary();
    // This event is already triggered via renderBillsList
}

// Handle payment form submit
function handlePaymentFormSubmit(event) {
    event.preventDefault();
    
    const billId = document.getElementById('payment-bill-id').value;
    const paymentDate = document.getElementById('payment-date').value;
    const amount = document.getElementById('payment-amount').value;
    
    if (window.billManager.markBillAsPaid(billId, paymentDate, amount)) {
        showMessage('Payment recorded successfully and added to expenses', 'success');
    } else {
        showMessage('Failed to record payment', 'error');
    }
    
    closeAllModals();
    renderBillsList();
    renderCalendar(currentDate);
    updateSummary();
    // This event is already triggered via renderBillsList
}

// Close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    
    modals.forEach(modal => modal.classList.remove('active'));
    modalBackdrop.classList.remove('active');
}

// Format currency
function formatCurrency(amount) {
    const currency = localStorage.getItem('userCurrency') || 'USD';
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Get category name from value
function getCategoryName(category) {
    const categories = {
        'utilities': 'Utilities',
        'rent': 'Rent/Mortgage',
        'insurance': 'Insurance',
        'subscription': 'Subscription',
        'phone': 'Phone/Internet',
        'other': 'Other'
    };
    
    return categories[category] || 'Other';
}

// Show message
function showMessage(message, type = 'info') {
    // Check if message container exists
    let messageContainer = document.getElementById('message-container');
    
    if (!messageContainer) {
        // Create message container
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        document.body.appendChild(messageContainer);
        
        // Add styles if not already in CSS
        const style = document.createElement('style');
        style.textContent = `
            #message-container {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 300px;
                z-index: 9999;
            }
            
            .message {
                padding: 12px 20px;
                margin-bottom: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                animation: slide-in 0.3s ease-out forwards;
            }
            
            .message.info {
                background-color: #e1f5fe;
                color: #0288d1;
                border-left: 4px solid #0288d1;
            }
            
            .message.success {
                background-color: #e8f5e9;
                color: #2e7d32;
                border-left: 4px solid #2e7d32;
            }
            
            .message.warning {
                background-color: #fff3e0;
                color: #f57c00;
                border-left: 4px solid #f57c00;
            }
            
            .message.error {
                background-color: #ffebee;
                color: #c62828;
                border-left: 4px solid #c62828;
            }
            
            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1); }
            }
            
            @keyframes fade-out {
                from { transform: translateX(0); opacity: 1); }
                to { transform: translateX(100%); opacity: 0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Add to container
    messageContainer.appendChild(messageElement);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageElement.style.animation = 'fade-out 0.3s ease-out forwards';
        setTimeout(() => {
            messageContainer.removeChild(messageElement);
        }, 300);
    }, 3000);
}

// Toggle frequency options based on recurring checkbox
function toggleFrequencyOptions(isRecurring) {
    const frequencyGroup = document.getElementById('frequency-group');
    if (frequencyGroup) {
        frequencyGroup.style.display = isRecurring ? 'block' : 'none';
    }
}

// Update currency symbol in modals
function updateCurrencySymbolInModal(modalSelector = '#bill-modal') {
    const currencySymbol = getCurrentCurrencySymbol();
    const inputIcons = document.querySelectorAll(`${modalSelector} .input-icon`);
    
    inputIcons.forEach(icon => {
        icon.textContent = currencySymbol;
    });
}

// Get current currency symbol based on user preference
function getCurrentCurrencySymbol() {
    const userCurrency = localStorage.getItem('userCurrency') || 'USD';
    const currencies = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': '$',
        'AUD': '$',
        'INR': '₹',
        'CNY': '¥'
    };
    
    return currencies[userCurrency] || '$';
}
