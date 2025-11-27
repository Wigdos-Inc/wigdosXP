/* Global Variables */

const taskbar = document.getElementsByTagName("footer")[0];
const desktop = document.getElementsByTagName("main")[0];

// --- Taskbar App Buttons Container ---
let appButtonsWrapper = document.createElement('div');
appButtonsWrapper.id = 'taskbar-app-buttons-wrapper';
appButtonsWrapper.classList.add('taskbar-app-buttons-wrapper');

let appButtonsContainer = document.createElement('div');
appButtonsContainer.id = 'taskbar-app-buttons';
appButtonsContainer.classList.add('taskbar-app-buttons');
appButtonsWrapper.appendChild(appButtonsContainer);

// Add scroll arrows container (right side)
const arrowsContainer = document.createElement('div');
arrowsContainer.id = 'taskbar-arrows-container';
arrowsContainer.classList.add('taskbar-arrows-container');
arrowsContainer.style.display = 'none'; // Hidden by default

const upArrow = document.createElement('div');
upArrow.id = 'taskbar-scroll-up';
upArrow.classList.add('taskbar-scroll-arrow');
upArrow.innerHTML = '▲';
upArrow.onclick = () => scrollTaskbarRow(-1);

const downArrow = document.createElement('div');
downArrow.id = 'taskbar-scroll-down';
downArrow.classList.add('taskbar-scroll-arrow');
downArrow.innerHTML = '▼';
downArrow.onclick = () => scrollTaskbarRow(1);

arrowsContainer.appendChild(upArrow);
arrowsContainer.appendChild(downArrow);

// Insert wrapper and arrows before the clock
const clockBtn = document.getElementById("ts_btn");
if (clockBtn && clockBtn.parentNode === taskbar) {
    taskbar.insertBefore(appButtonsWrapper, clockBtn);
    taskbar.insertBefore(arrowsContainer, clockBtn);
} else {
    taskbar.appendChild(appButtonsWrapper);
    taskbar.appendChild(arrowsContainer);
}

// Track current visible row
let currentRow = 0;
let totalRows = 1;

// Calculate how many buttons fit per row and organize into rows
function organizeTaskbarRows() {
    const buttons = Array.from(appButtonsContainer.children);
    if (buttons.length === 0) {
        arrowsContainer.style.display = 'none';
        return;
    }

    // Get available width (wrapper width minus padding)
    const wrapperWidth = appButtonsWrapper.offsetWidth;
    if (wrapperWidth === 0) {
        // Element not rendered yet, try again soon
        setTimeout(() => organizeTaskbarRows(), 100);
        return;
    }
    
    // Calculate button width dynamically from first button if available
    let buttonWidth = 180; // Fallback default
    if (buttons.length > 0) {
        const firstBtn = buttons[0];
        const btnRect = firstBtn.getBoundingClientRect();
        const btnStyles = window.getComputedStyle(firstBtn);
        const marginRight = parseInt(btnStyles.marginRight) || 0;
        const marginLeft = parseInt(btnStyles.marginLeft) || 0;
        buttonWidth = btnRect.width + marginRight + marginLeft;
        
        // Use fallback if calculated width seems invalid
        if (buttonWidth < 50 || buttonWidth > 500) {
            buttonWidth = 180;
        }
    }
    
    const buttonsPerRow = Math.max(1, Math.floor(wrapperWidth / buttonWidth));
    
    totalRows = Math.ceil(buttons.length / buttonsPerRow);
    
    // Show/hide arrows based on row count
    if (totalRows > 1) {
        arrowsContainer.style.display = 'flex';
    } else {
        arrowsContainer.style.display = 'none';
        currentRow = 0;
    }
    
    // Ensure current row is valid
    if (currentRow >= totalRows) {
        currentRow = totalRows - 1;
    }
    
    // Show/hide buttons based on current row
    buttons.forEach((btn, index) => {
        const btnRow = Math.floor(index / buttonsPerRow);
        if (btnRow === currentRow) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });
    
    // Update arrow states
    updateArrowStates();
}

// Navigate between rows
function scrollTaskbarRow(direction) {
    const newRow = currentRow + direction;
    
    // Bounds check
    if (newRow < 0 || newRow >= totalRows) {
        return; // Can't go beyond first or last row
    }
    
    currentRow = newRow;
    organizeTaskbarRows();
}

// Update arrow button states (disabled appearance when at limits)
function updateArrowStates() {
    if (currentRow === 0) {
        upArrow.classList.add('disabled');
    } else {
        upArrow.classList.remove('disabled');
    }
    
    if (currentRow === totalRows - 1) {
        downArrow.classList.add('disabled');
    } else {
        downArrow.classList.remove('disabled');
    }
}

// Helper to create an app button in the taskbar
function createAppTaskbarButton(appWindow) {
    const btn = document.createElement('div');
    btn.classList.add('taskbar-app-btn');
    btn.dataset.appIndex = appWindow.index;

    // App icon
    const icon = document.createElement('img');
    icon.src = appWindow.app.icon.s;
    icon.classList.add('taskbar-app-btn-icon');
    btn.appendChild(icon);

    // App name
    const name = document.createElement('span');
    name.innerText = appWindow.app.name.l;
    name.classList.add('taskbar-app-btn-name');
    btn.appendChild(name);

    // Focus/restore on click
    btn.onclick = () => {
        if (window.windowManager && window.windowManager.bringToFront) {
            window.windowManager.bringToFront(appWindow);
        }
        if (appWindow.minimized && appWindow.restore) {
            appWindow.restore();
        }
    };

    if (appWindow.focus) {
        btn.classList.add('focused');
    }

    appButtonsContainer.appendChild(btn);
    appWindow._taskbarBtn = btn;

    // Reorganize rows after adding button
    setTimeout(() => organizeTaskbarRows(), 50);
}

// Remove app button from taskbar
function removeAppTaskbarButton(appWindow) {
    if (appWindow._taskbarBtn && appWindow._taskbarBtn.parentNode) {
        appWindow._taskbarBtn.parentNode.removeChild(appWindow._taskbarBtn);
        appWindow._taskbarBtn = null;
    }

    // Reorganize rows after removing button
    setTimeout(() => organizeTaskbarRows(), 50);
}

// Update all app buttons (e.g. on focus change)
function updateAppTaskbarButtons() {
    if (!window.windows || !window.windows.object) return;
    window.windows.object.forEach(appWin => {
        if (appWin && appWin._taskbarBtn) {
            if (appWin.focus) {
                appWin._taskbarBtn.classList.add('focused');
            } else {
                appWin._taskbarBtn.classList.remove('focused');
            }
        }
    });
}

// Recalculate on window resize with debouncing to improve performance
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        organizeTaskbarRows();
    }, 150); // Wait 150ms after resize stops
});

// Make functions globally accessible so AppWindow can call them
window.taskbarFunctions = {
    createButton: createAppTaskbarButton,
    removeButton: removeAppTaskbarButton,
    updateButtons: updateAppTaskbarButtons
};

console.debug('[Taskbar] Functions ready and exported globally');
/* Firebase Status Indicator */
(function() {
    const statusIcon = document.getElementById('firebase_status');
    const statusTooltip = document.getElementById('firebase_status_tooltip');
    
    if (!statusIcon || !statusTooltip) return;

    let isConnected = false;
    let checkInterval;

    function updateStatus(connected, message) {
        isConnected = connected;
        
        if (connected) {
            statusIcon.className = 'connected';
            statusTooltip.textContent = message || 'Firebase: Connected';
            statusIcon.style.filter = 'hue-rotate(90deg)'; // Green tint
        } else {
            statusIcon.className = 'disconnected';
            statusTooltip.textContent = message || 'Firebase: Disconnected';
            statusIcon.style.filter = 'grayscale(100%) brightness(0.7)';
        }
    }

    function checkFirebaseStatus() {
        try {
            // Check if Firebase is initialized
            if (window.firebaseAPI && window.firebaseAPI.db) {
                // Firebase is initialized
                const user = window.getUser ? window.getUser() : 'guest';
                if (user && user !== 'guest') {
                    updateStatus(true, `Firebase: Connected (${user})`);
                } else {
                    updateStatus(false, 'Firebase: Guest mode (offline)');
                }
            } else {
                updateStatus(false, 'Firebase: Not initialized');
            }
        } catch (e) {
            updateStatus(false, 'Firebase: Error');
            console.error('[Firebase Status]', e);
        }
    }

    // Show tooltip on hover
    statusIcon.addEventListener('mouseenter', () => {
        statusTooltip.style.display = 'block';
    });

    statusIcon.addEventListener('mouseleave', () => {
        statusTooltip.style.display = 'none';
    });

    // Click to recheck
    statusIcon.addEventListener('click', () => {
        statusTooltip.textContent = 'Checking...';
        statusTooltip.style.display = 'block';
        setTimeout(() => {
            checkFirebaseStatus();
        }, 500);
    });

    // Initial check after a delay to let Firebase initialize
    setTimeout(() => {
        checkFirebaseStatus();
        // Check periodically (every 30 seconds)
        checkInterval = setInterval(checkFirebaseStatus, 30000);
    }, 2000);

    console.debug('[Firebase Status] Monitor initialized');
})();


/* HTML Setup */

// Store Start Menu Button
const smBtnBox = document.getElementById("sm_btn");


// Quick Access Icon Functionality
// Quick Access (Pinned) Icons - rendered from saved pinned list
const qaIconBox = document.getElementById("qa_iconBox");

function renderPinnedIcons(){
    if (!qaIconBox) return;
    qaIconBox.innerHTML = '';

    // Get pinned apps from layout storage (use localStorage for all users including guest)
    let pinned = [];
    if (localStorage.getItem("layout")) {
        try {
            let layout = JSON.parse(localStorage.getItem("layout"));
            
            // Handle old format migration
            if (Array.isArray(layout)) {
                layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], initialized: true };
                localStorage.setItem("layout", JSON.stringify(layout));
            }
            
            if (layout.taskbarPinned && Array.isArray(layout.taskbarPinned)) {
                pinned = layout.taskbarPinned;
            } else {
                // First time - set defaults only if not initialized
                if (!layout.initialized) {
                    pinned = ['notes','files'];
                    layout.taskbarPinned = pinned;
                    layout.initialized = true;
                } else {
                    // Initialized but no pinned apps - respect that choice
                    pinned = [];
                    layout.taskbarPinned = pinned;
                }
                localStorage.setItem("layout", JSON.stringify(layout));
            }
        } catch (e) {
            console.error('[Taskbar] Error loading pinned apps:', e);
            pinned = ['notes','files'];
        }
    } else {
        // No saved layout - use defaults
        pinned = ['notes','files'];
    }
    console.debug('[Taskbar] renderPinnedIcons -> pinned list', pinned);

    pinned.forEach(id => {
        try {
            const app = applications[id];
            if (!app) return;
            const el = document.createElement('div');
            el.classList.add('qa_icon');
            // store app id so context menu / settings can reference it
            el.dataset.app = app.name.s;
            // Clear any background-image CSS (old method) and use an img that fills the slot
            el.style.backgroundImage = 'none';
            const img = el.appendChild(document.createElement('img'));
            img.src = app.icon ? (app.icon.s || app.icon.l || '') : '';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.display = 'block';
            el.onclick = () => startApp(app);
            
            // Enable dragging
            el.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click only
                    window.userBox = {
                        app: app,
                        source: 'taskbarPinned'
                    };
                    console.debug('[Taskbar] Drag START from pinned taskbar app', app.name.s);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            
            qaIconBox.appendChild(el);
        } catch (e) { console.error('renderPinnedIcons error', e); }
    });
}

// Make available to settings UI
window.taskbarReloadPinned = renderPinnedIcons;

// Initial render: ensure we have `applications` and a saved layout (or wait for layout change)
function scheduleInitialPinnedRender() {
    // If applications are ready and layout exists, render now
    if (window.applications && localStorage.getItem('layout')) {
        try { renderPinnedIcons(); } catch (e) { console.error('[Taskbar] initial render failed', e); }
        return;
    }

    // Otherwise wait for either 'layout-changed' (e.g. login/DB load) or for apps-ready + dbReady
    let appsReady = !!window.applications;
    let dbReady = !!window.firebaseAPI;

    const tryRenderIfReady = () => {
        if (appsReady && (dbReady || localStorage.getItem('layout'))) {
            try { renderPinnedIcons(); } catch (e) { console.error('[Taskbar] deferred render failed', e); }
            return true;
        }
        return false;
    };

    // If apps not ready, listen for apps-ready
    if (!appsReady) {
        window.addEventListener('apps-ready', () => { appsReady = true; tryRenderIfReady(); }, { once: true });
    }

    // If firebase not ready, listen for dbReady (fired by firebaseconfig.js)
    if (!dbReady) {
        window.addEventListener('dbReady', () => { dbReady = true; tryRenderIfReady(); }, { once: true });
    }

    // Also listen for layout-changed which indicates lifecycle/login saved or loaded layout
    window.addEventListener('layout-changed', () => { tryRenderIfReady(); }, { once: true });

    // Fallback: after 3s, render if apps are ready (avoid blocking forever)
    setTimeout(() => {
        if (window.applications) {
            try { renderPinnedIcons(); } catch (e) { console.error('[Taskbar] fallback render failed', e); }
        }
    }, 3000);
}

scheduleInitialPinnedRender();

// Listen for layout changes (from login, DB load, or other modules)
window.addEventListener('layout-changed', () => {
    try {
        renderPinnedIcons();
        if (smActive && window.refreshStartMenu) window.refreshStartMenu();
    } catch (e) { console.error('[Taskbar] layout-changed handler error', e); }
});

// Global functions for pinned apps
window.getPinnedApps = function() {
    let pinned = [];
    try {
        if (localStorage.getItem("layout")) {
            let layout = JSON.parse(localStorage.getItem("layout"));
            // Handle old format migration
            if (Array.isArray(layout)) {
                layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], initialized: true };
                localStorage.setItem("layout", JSON.stringify(layout));
            }

            if (layout.taskbarPinned && Array.isArray(layout.taskbarPinned)) {
                pinned = layout.taskbarPinned;
            } else {
                // First time - set defaults only if not initialized
                if (!layout.initialized) {
                    pinned = ['notes','files'];
                    layout.taskbarPinned = pinned;
                    layout.initialized = true;
                } else {
                    // Initialized but no pinned apps - respect that choice
                    pinned = [];
                    layout.taskbarPinned = pinned;
                }
                localStorage.setItem("layout", JSON.stringify(layout));
            }
        } else {
            pinned = ['notes','files'];
        }
    } catch (e) {
        console.error('[Taskbar] Error loading pinned apps:', e);
        pinned = ['notes','files'];
    }
    console.debug('[Taskbar] getPinnedApps -> pinned list', pinned);
    return pinned;
}

window.setPinnedApps = function(pinned) {
    try {
        let layout = {};
        if (localStorage.getItem("layout")) {
            layout = JSON.parse(localStorage.getItem("layout"));
        }
        if (Array.isArray(layout)) {
            layout = { desktopGrid: layout, taskbarPinned: pinned, initialized: true };
        } else {
            layout.taskbarPinned = pinned;
        }
        localStorage.setItem("layout", JSON.stringify(layout));
    } catch (e) {
        console.error('[Taskbar] setPinnedApps error:', e);
    }
    // Refresh the pinned icons
    renderPinnedIcons();
    // Mark layout dirty so autosave or explicit logout/power actions will persist it
    try { window.layoutDirty = true; } catch (e) { /* noop */ }
}

const tsBtn = document.getElementById("ts_btn");


/* Time Stuff */

const baseClock = setInterval(() => update("tbClock"), 1000);

function update(type) {

    // Store the Current Time
    const cDate = new Date;
    const cTime = {
        hours  : (cDate.getHours() < 10 ? "0" : "") + cDate.getHours(),
        minutes: (cDate.getMinutes() < 10 ? "0" : "") + cDate.getMinutes()
    }

    // Display the Current Time
    if (type == "tbClock") {
        const clockSpan = document.getElementById("ts_clock");
        if (clockSpan) clockSpan.textContent = `${cTime.hours}:${cTime.minutes}`;
    }
}
update("tbClock");


tsBtn.addEventListener("click", () => {

    // Expanded Time Stuff - Clock and Badges Panel
    if (document.getElementById("clockBadgePanel")) {
        // If panel already exists, remove it
        document.getElementById("clockBadgePanel").remove();
        return;
    }

    const panel = desktop.appendChild(document.createElement("div"));
    panel.id = "clockBadgePanel";
    panel.style.opacity = 1;

    // Header with live clock
    const header = panel.appendChild(document.createElement("div"));
    header.id = "cbHeader";

    const clockDisplay = header.appendChild(document.createElement("div"));
    clockDisplay.id = "cbClockDisplay";
    
    // Update clock display function
    function updateClockDisplay() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        clockDisplay.innerHTML = `
            <div class="cb-time">${hours}:${minutes}:${seconds}</div>
            <div class="cb-date">${date}</div>
        `;
    }
    
    // Update immediately and set interval
    updateClockDisplay();
    const clockInterval = setInterval(updateClockDisplay, 1000);

    // Main content area with two columns
    const mainContent = panel.appendChild(document.createElement("div"));
    mainContent.id = "cbMainContent";

    // Left column - Calendar
    const leftColumn = mainContent.appendChild(document.createElement("div"));
    leftColumn.id = "cbLeftColumn";

    const calendarTitle = leftColumn.appendChild(document.createElement("div"));
    calendarTitle.className = "cb-section-title";
    calendarTitle.textContent = "DATE";

    const calendarContainer = leftColumn.appendChild(document.createElement("div"));
    calendarContainer.id = "cbCalendar";

    // State for calendar navigation
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const today = new Date();

    // Generate calendar
    function generateCalendar() {
        calendarContainer.innerHTML = ""; // Clear previous calendar

        // Month/Year header
        const calHeader = calendarContainer.appendChild(document.createElement("div"));
        calHeader.className = "cb-cal-header";
        
        const monthYear = calHeader.appendChild(document.createElement("div"));
        monthYear.className = "cb-cal-month-year";
        
        const monthSelect = document.createElement("select");
        monthSelect.className = "cb-cal-select cb-cal-month-select";
        monthSelect.id = "cbMonthSelect";
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        months.forEach((monthName, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = monthName;
            if (index === currentMonth) option.selected = true;
            monthSelect.appendChild(option);
        });
        
        const yearInput = document.createElement("input");
        yearInput.type = "number";
        yearInput.className = "cb-cal-select cb-cal-year-input";
        yearInput.id = "cbYearInput";
        yearInput.value = currentYear;
        yearInput.min = "1900";
        yearInput.max = "2100";
        
        monthYear.appendChild(monthSelect);
        monthYear.appendChild(yearInput);

        // Add change listeners
        monthSelect.addEventListener("change", function() {
            currentMonth = parseInt(this.value);
            generateCalendar();
        });

        yearInput.addEventListener("change", function() {
            currentYear = parseInt(this.value);
            if (currentYear < 1900) currentYear = 1900;
            if (currentYear > 2100) currentYear = 2100;
            this.value = currentYear;
            generateCalendar();
        });

        // Day headers
        const dayHeaders = calendarContainer.appendChild(document.createElement("div"));
        dayHeaders.className = "cb-cal-days-header";
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
            const dayHeader = dayHeaders.appendChild(document.createElement("div"));
            dayHeader.className = "cb-cal-day-name";
            dayHeader.textContent = day;
        });

        // Days grid
        const daysGrid = calendarContainer.appendChild(document.createElement("div"));
        daysGrid.className = "cb-cal-days-grid";

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = daysGrid.appendChild(document.createElement("div"));
            emptyCell.className = "cb-cal-day cb-cal-day-empty";
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = daysGrid.appendChild(document.createElement("div"));
            dayCell.className = "cb-cal-day";
            
            // Highlight today if viewing current month/year
            if (day === today.getDate() && 
                currentMonth === today.getMonth() && 
                currentYear === today.getFullYear()) {
                dayCell.classList.add("cb-cal-day-today");
            }
            
            // Check for holidays
            const holiday = getHoliday(currentMonth, day, currentYear);
            if (holiday) {
                dayCell.classList.add("cb-cal-day-holiday");
                dayCell.title = holiday;
                
                // Create holiday label
                const holidayLabel = document.createElement("div");
                holidayLabel.className = "cb-cal-holiday-label";
                holidayLabel.textContent = holiday;
                dayCell.appendChild(holidayLabel);
            }
            
            // Create day number element
            const dayNumber = document.createElement("div");
            dayNumber.className = "cb-cal-day-number";
            dayNumber.textContent = day;
            dayCell.insertBefore(dayNumber, dayCell.firstChild);
        }
    }

    // Holiday detection function
    function getHoliday(month, day, year) {
        // Fixed date holidays
        const fixedHolidays = {
            '0-1': "New Year's Day",
            '1-14': "Valentine's Day",
            '2-17': "St. Patrick's Day",
            '3-1': "April Fools' Day",
            '3-22': "Earth Day",
            '4-5': "Cinco de Mayo",
            '5-14': "Flag Day",
            '6-4': "Independence Day",
            '9-31': "Halloween",
            '10-11': "Veterans Day",
            '11-25': "Christmas Day",
            '11-31': "New Year's Eve"
        };

        const key = `${month}-${day}`;
        if (fixedHolidays[key]) {
            return fixedHolidays[key];
        }

        // Floating holidays (based on day of week)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const nthDayOfWeek = (day, dayOfWeek, n) => {
            const firstOccurrence = (7 + dayOfWeek - firstDayOfMonth) % 7 + 1;
            return firstOccurrence + (n - 1) * 7 === day;
        };

        // Martin Luther King Jr. Day - 3rd Monday in January
        if (month === 0 && nthDayOfWeek(day, 1, 3)) return "Martin Luther King Jr. Day";
        
        // Presidents' Day - 3rd Monday in February
        if (month === 1 && nthDayOfWeek(day, 1, 3)) return "Presidents' Day";
        
        // Memorial Day - Last Monday in May
        const lastMondayMay = new Date(year, 5, 0);
        lastMondayMay.setDate(lastMondayMay.getDate() - (lastMondayMay.getDay() + 6) % 7);
        if (month === 4 && day === lastMondayMay.getDate()) return "Memorial Day";
        
        // Labor Day - 1st Monday in September
        if (month === 8 && nthDayOfWeek(day, 1, 1)) return "Labor Day";
        
        // Columbus Day - 2nd Monday in October
        if (month === 9 && nthDayOfWeek(day, 1, 2)) return "Columbus Day";
        
        // Thanksgiving - 4th Thursday in November
        if (month === 10 && nthDayOfWeek(day, 4, 4)) return "Thanksgiving Day";
        
        // Mother's Day - 2nd Sunday in May
        if (month === 4 && nthDayOfWeek(day, 0, 2)) return "Mother's Day";
        
        // Father's Day - 3rd Sunday in June
        if (month === 5 && nthDayOfWeek(day, 0, 3)) return "Father's Day";

        // Easter calculation (simplified - Meeus/Jones/Butcher algorithm)
        const easterDate = calculateEaster(year);
        if (month === easterDate.month && day === easterDate.day) return "Easter Sunday";

        return null;
    }

    function calculateEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return { month, day };
    }

    generateCalendar();

    // Timezone info
    const timezoneInfo = leftColumn.appendChild(document.createElement("div"));
    timezoneInfo.className = "cb-timezone-info";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timezoneInfo.textContent = `Current time zone: ${timezone}`;

    // Right column - Badges
    const rightColumn = mainContent.appendChild(document.createElement("div"));
    rightColumn.id = "cbRightColumn";

    const badgesTitle = rightColumn.appendChild(document.createElement("div"));
    badgesTitle.className = "cb-section-title";
    badgesTitle.textContent = "ACHIEVEMENTS";

    const badgesList = rightColumn.appendChild(document.createElement("div"));
    badgesList.id = "cbBadgesList";

    // Get user badges from centralized AchievementsDB
    async function loadAndDisplayBadges() {
        // Wait for AchievementsDB to be ready if it's not already
        if (!window.AchievementsDB) {
            console.log('Taskbar: Waiting for AchievementsDB to be ready...');
            await new Promise((resolve) => {
                // Check if it becomes available
                const checkInterval = setInterval(() => {
                    if (window.AchievementsDB) {
                        clearInterval(checkInterval);
                        console.log('Taskbar: AchievementsDB is now available');
                        resolve();
                    }
                }, 50);
                
                // Also listen for the ready event
                window.addEventListener('achievementsSystemReady', () => {
                    clearInterval(checkInterval);
                    console.log('Taskbar: achievementsSystemReady event received');
                    resolve();
                }, { once: true });
                
                // Timeout fallback
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('Taskbar: Timeout waiting for AchievementsDB');
                    resolve();
                }, 3000);
            });
        }
        
        // Load achievements configuration from JSON
        let badgeCategories = {};
        try {
            const response = await fetch('/scripts/global/achievements.json?t=' + Date.now());
            const achievementsData = await response.json();
            badgeCategories = achievementsData.categories;
        } catch (error) {
            console.error('Error loading achievements config:', error);
            return;
        }
        
        let userBadges = [];
        
        // Get current username to display in console
        const username = window.getUser ? window.getUser() : 'guest';
        
        // Load badges using centralized AchievementsDB module
        if (window.AchievementsDB) {
            try {
                userBadges = await window.AchievementsDB.loadAchievements();
                console.log('Taskbar: Loaded', userBadges.length, 'badges for user:', username, userBadges);
            } catch (error) {
                console.error('Error loading badges via AchievementsDB:', error);
            }
        } else {
            console.warn('AchievementsDB not available - badges will not be displayed');
        }

        // Display categories
        Object.keys(badgeCategories).forEach(categoryKey => {
            const category = badgeCategories[categoryKey];
            
            // Create category header
            const categoryHeader = badgesList.appendChild(document.createElement("div"));
            categoryHeader.className = "cb-badge-category-header";
            categoryHeader.innerHTML = `<span class="cb-category-arrow">▼</span> ${category.name}`;
            
            // Create category content container
            const categoryContent = badgesList.appendChild(document.createElement("div"));
            categoryContent.className = "cb-badge-category-content";
            
            // Toggle category visibility on click
            categoryHeader.addEventListener('click', function() {
                const arrow = this.querySelector('.cb-category-arrow');
                if (categoryContent.style.display === 'none') {
                    categoryContent.style.display = 'flex';
                    arrow.textContent = '▼';
                } else {
                    categoryContent.style.display = 'none';
                    arrow.textContent = '▶';
                }
            });
            
            // Display badges in this category
            Object.keys(category.badges).forEach(badgeId => {
                const badgeInfo = category.badges[badgeId];
                const isEarned = userBadges.includes(badgeId);
                const isImpossible = badgeId === 'winesweeper_impossible';

                const badgeItem = categoryContent.appendChild(document.createElement("div"));
                badgeItem.className = isEarned ? 'cb-badge-item cb-badge-earned' : 'cb-badge-item cb-badge-locked';

                const badgeIcon = badgeItem.appendChild(document.createElement("div"));
                badgeIcon.className = "cb-badge-icon";
                
                const img = badgeIcon.appendChild(document.createElement("img"));
                img.src = badgeInfo.icon;
                img.alt = badgeInfo.name;
                if (isEarned && isImpossible) {
                    img.className = "cb-badge-img-sparkle";
                }
                if (!isEarned) {
                    img.style.filter = "grayscale(100%) brightness(0.5)";
                }

                const badgeInfo_div = badgeItem.appendChild(document.createElement("div"));
                badgeInfo_div.className = "cb-badge-info";

                const badgeName = badgeInfo_div.appendChild(document.createElement("div"));
                badgeName.className = "cb-badge-name";
                badgeName.textContent = isEarned ? badgeInfo.name : `🔒 ${badgeInfo.name}`;
                badgeName.style.color = isEarned ? badgeInfo.color : '#888';

                const badgeDesc = badgeInfo_div.appendChild(document.createElement("div"));
                badgeDesc.className = "cb-badge-desc";
                badgeDesc.textContent = isEarned ? badgeInfo.description : 'Locked - Hover to see requirements';

                // Add tooltip on hover
                const tooltip = badgeItem.appendChild(document.createElement("div"));
                tooltip.className = "cb-badge-tooltip";
                tooltip.textContent = badgeInfo.description;

                badgeItem.addEventListener("mouseenter", function() {
                    const rect = this.getBoundingClientRect();
                    tooltip.style.display = "block";
                    
                    // Position tooltip above the badge if there's space, otherwise below
                    if (rect.top > 50) {
                        tooltip.style.bottom = "100%";
                        tooltip.style.top = "auto";
                    } else {
                        tooltip.style.top = "100%";
                        tooltip.style.bottom = "auto";
                    }
                });

                badgeItem.addEventListener("mouseleave", function() {
                    tooltip.style.display = "none";
                });
            });
        });
    }

    // Load and display badges
    loadAndDisplayBadges();
    
    // Listen for achievement updates and refresh display
    const refreshHandler = (event) => {
        console.log('Taskbar: Achievement saved event received, refreshing badges...');
        // Clear and reload badges
        badgesList.innerHTML = '';
        loadAndDisplayBadges();
    };
    window.addEventListener('achievementSaved', refreshHandler);

    // Close panel when clicking outside
    setTimeout(() => {
        const closePanel = (e) => {
            if (!panel.contains(e.target) && e.target !== tsBtn) {
                panel.remove();
                clearInterval(clockInterval);
                document.removeEventListener("click", closePanel);
                window.removeEventListener('achievementSaved', refreshHandler);
            }
        };
        document.addEventListener("click", closePanel);
    }, 100);
});



/* Start Menu */
let smActive = false;
let allApps = []; // Cache all apps for search
const SM_DEBUG = localStorage.getItem('wigdos_startmenu_debug') === 'true';

// Expose smActive globally so desktop.js can check it
Object.defineProperty(window, 'smActive', {
    get: () => smActive,
    set: (value) => { smActive = value; }
});

function smLog(...args) {
    if (SM_DEBUG) console.debug('[StartMenu]', ...args);
}

// Debug toggle info
console.debug('[StartMenu] Debug logging is', SM_DEBUG ? 'ENABLED' : 'DISABLED');
console.debug('[StartMenu] To enable debug: localStorage.setItem("wigdos_startmenu_debug", "true") then refresh');
console.debug('[StartMenu] To disable debug: localStorage.setItem("wigdos_startmenu_debug", "false") then refresh');

// Helper functions for Start Menu data
function getStartMenuPinned() {
    try {
        if (localStorage.getItem("layout")) {
            let layout = JSON.parse(localStorage.getItem("layout"));
            if (Array.isArray(layout)) {
                smLog('Migrating old layout format to new format');
                layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], startMenuPinned: [], recentApps: [], initialized: true };
                localStorage.setItem("layout", JSON.stringify(layout));
            }
            if (!layout.startMenuPinned) {
                smLog('startMenuPinned missing, initializing to empty array');
                layout.startMenuPinned = [];
            }
            smLog('getStartMenuPinned:', layout.startMenuPinned);
            return layout.startMenuPinned;
        }
        smLog('No layout or guest user, returning empty array');
        return [];
    } catch(e) { 
        console.error('[StartMenu] getStartMenuPinned error:', e);
        return []; 
    }
}

function setStartMenuPinned(arr) {
    try {
        // Ensure a layout object exists and migrate older formats if needed
        let layout = {};
        if (localStorage.getItem("layout")) {
            try {
                layout = JSON.parse(localStorage.getItem("layout")) || {};
            } catch (e) {
                smLog('Failed to parse existing layout, recreating');
                layout = {};
            }
        }

        if (Array.isArray(layout)) {
            smLog('Migrating layout during setStartMenuPinned');
            layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], startMenuPinned: [], recentApps: [], initialized: true };
        }

        // Set the start menu pinned array
        layout.startMenuPinned = Array.isArray(arr) ? arr : [];
        smLog('setStartMenuPinned:', layout.startMenuPinned);
        localStorage.setItem("layout", JSON.stringify(layout));

        // Mark layout dirty so autosave or explicit logout/power actions will persist it
        try { window.layoutDirty = true; } catch (e) { /* noop */ }

        if (smActive && window.refreshStartMenu) {
            window.refreshStartMenu();
        }
        // Notify other modules that layout changed
        try { window.dispatchEvent(new Event('layout-changed')); } catch (e) { /* noop */ }
    } catch(e) { console.error('[StartMenu] setStartMenuPinned error:', e); }
}

function getRecentApps() {
    try {
        if (localStorage.getItem("layout")) {
            let layout = JSON.parse(localStorage.getItem("layout"));
            if (Array.isArray(layout)) {
                smLog('Migrating layout during getRecentApps');
                layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], startMenuPinned: [], recentApps: [], initialized: true };
                localStorage.setItem("layout", JSON.stringify(layout));
            }
            if (!layout.recentApps) {
                smLog('recentApps missing, initializing to empty array');
                layout.recentApps = [];
            }
            smLog('getRecentApps:', layout.recentApps);
            return layout.recentApps;
        }
        smLog('No layout or guest user, returning empty recent apps');
        return [];
    } catch(e) { 
        console.error('[StartMenu] getRecentApps error:', e);
        return []; 
    }
}

function addRecentApp(appId) {
    try {
        if (window.getUser && window.getUser() === "guest") {
            smLog('Guest user, not tracking recent app');
            return;
        }
        
        let layout = JSON.parse(localStorage.getItem("layout") || "{}");
        if (Array.isArray(layout)) {
            smLog('Migrating layout during addRecentApp');
            layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], startMenuPinned: [], recentApps: [], initialized: true };
        }
        if (!layout.recentApps) layout.recentApps = [];
        
        // Remove if already exists
        const idx = layout.recentApps.indexOf(appId);
        if (idx >= 0) {
            smLog('App already in recent, moving to front:', appId);
            layout.recentApps.splice(idx, 1);
        }
        
        // Add to front
        layout.recentApps.unshift(appId);
        smLog('Added to recent apps:', appId, 'Total:', layout.recentApps.length);
        
        // Keep only last 10
        if (layout.recentApps.length > 10) {
            layout.recentApps = layout.recentApps.slice(0, 10);
            smLog('Trimmed recent apps to 10');
        }
        
        localStorage.setItem("layout", JSON.stringify(layout));
    } catch(e) { console.error('[StartMenu] addRecentApp error:', e); }
}

// Expose for global use
window.addRecentApp = addRecentApp;
window.getStartMenuPinned = getStartMenuPinned;
window.setStartMenuPinned = setStartMenuPinned;
window.getRecentApps = getRecentApps;

function createStartMenu() {
    const startMenu = desktop.appendChild(document.createElement("div"));
    startMenu.id = "smBox";
    startMenu.style.opacity = 1;

    // Header
    const smHeader = startMenu.appendChild(document.createElement("div")); 
    smHeader.id = "smHeader";

    const headerImg = smHeader.appendChild(document.createElement("img"));
    headerImg.src = "assets/images/icons/user/guest.png";

    const headerText = smHeader.appendChild(document.createElement("p"));
    const username = (typeof getUser === 'function') ? getUser() : (localStorage.getItem('username') || 'Guest');
    headerText.innerHTML = `<strong>${username}</strong>`;
    


    // Main
    const smMain = startMenu.appendChild(document.createElement("div")); 
    smMain.id = "smMain";

    const smLeftHalf = smMain.appendChild(document.createElement("div"));
    smLeftHalf.classList.add("smHalf"); 
    smLeftHalf.id = "smLeftHalf";

    // Left section title
    const leftTitle = smLeftHalf.appendChild(document.createElement("div"));
    leftTitle.classList.add("smSectionTitle");
    leftTitle.textContent = "Pinned";
    leftTitle.id = "smLeftTitle";

    const smRightHalf = smMain.appendChild(document.createElement("div"));
    smRightHalf.classList.add("smHalf"); 
    smRightHalf.id = "smRightHalf";

    // Right section title
    const rightTitle = smRightHalf.appendChild(document.createElement("div"));
    rightTitle.classList.add("smSectionTitle");
    rightTitle.textContent = "Recent";
    rightTitle.id = "smRightTitle";

    // Cache all apps (optimize by doing this once)
    if (allApps.length === 0 && window.applications) {
        allApps = Object.keys(window.applications).map(key => {
            const app = window.applications[key];
            return {
                id: key,
                name: app.name.l,
                icon: app.icon.s || app.icon.l || '',
                app: app
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Render apps based on search state
    function renderApps(filter = '') {
        smLog('renderApps called with filter:', filter);
        const leftTitle = document.getElementById("smLeftTitle");
        const rightTitle = document.getElementById("smRightTitle");
        
        // Clear previous content (keep titles)
        const leftItems = smLeftHalf.querySelectorAll('.smLeftItem, .smNoResults');
        leftItems.forEach(item => item.remove());
        const rightItems = smRightHalf.querySelectorAll('.smRightItem, .smNoResults');
        rightItems.forEach(item => item.remove());

        if (filter) {
            // SEARCH MODE: Hide titles and show only search results
            smLog('SEARCH MODE activated');
            leftTitle.style.display = 'none';
            rightTitle.style.display = 'none';

            // Normalize input and prepare tokens for broader matching
            const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
            const filterNorm = normalize(filter);
            const tokens = filterNorm.split(/\s+/).filter(Boolean);

            const filtered = allApps.filter(appData => {
                try {
                    // Build searchable fields: id, displayed name, various name forms, series
                    const nameLong = appData.name || '';
                    const id = appData.id || '';
                    const short = (appData.app && appData.app.name && appData.app.name.s) ? appData.app.name.s : '';
                    const medium = (appData.app && appData.app.name && appData.app.name.m) ? appData.app.name.m : '';
                    const series = (appData.app && appData.app.series) ? appData.app.series : '';

                    const combined = [id, nameLong, short, medium, series].join(' ');
                    const hay = normalize(combined);

                    // All tokens must match somewhere in the haystack
                    return tokens.every(tok => hay.includes(tok));
                } catch (e) { return false; }
            });
            smLog('Search results:', filtered.length, 'apps found');

            if (filtered.length === 0) {
                const noResults = smLeftHalf.appendChild(document.createElement("div"));
                noResults.classList.add("smNoResults");
                noResults.textContent = "No apps found";
                return;
            }

            const halfPoint = Math.ceil(filtered.length / 2);

            filtered.forEach((appData, index) => {
                const container = index < halfPoint ? smLeftHalf : smRightHalf;
                const item = container.appendChild(document.createElement("div"));
                item.classList.add(index < halfPoint ? "smLeftItem" : "smRightItem");
                
                // Set data attribute for reference
                item.dataset.appKey = appData.id;
                
                const itemImg = item.appendChild(document.createElement("img"));
                itemImg.classList.add("smItemImg");
                itemImg.src = appData.icon;
                itemImg.loading = "lazy";
                
                const itemText = item.appendChild(document.createElement("p"));
                itemText.classList.add("smItmText");
                itemText.textContent = appData.name;

                item.onclick = () => {
                    smLog('Opening app from search:', appData.id);
                    startApp(appData.app);
                    addRecentApp(appData.id);
                    closeStartMenu();
                };
                
                // Custom mouse drag system
                item.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Left click only
                        window.userBox = {
                            app: appData.app,
                            source: 'startMenu'
                        };
                        console.debug('[StartMenu] Drag START from search app', appData.id);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            });
        } else {
            // NORMAL MODE: Show pinned on left, recent on right
            smLog('NORMAL MODE activated');
            leftTitle.style.display = 'block';
            rightTitle.style.display = 'block';
            
            // LEFT: Pinned apps
            const pinnedIds = getStartMenuPinned();
            smLog('Pinned IDs:', pinnedIds);
            const pinnedApps = pinnedIds.map(id => allApps.find(a => a.id === id)).filter(a => a);
            smLog('Pinned apps resolved:', pinnedApps.length, pinnedApps.map(a => a.name));
            
            if (pinnedApps.length === 0) {
                const noPin = smLeftHalf.appendChild(document.createElement("div"));
                noPin.classList.add("smNoResults");
                noPin.textContent = "No pinned apps";
                smLog('Showing "No pinned apps" message');
            } else {
                pinnedApps.forEach(appData => {
                    const item = smLeftHalf.appendChild(document.createElement("div"));
                    item.classList.add("smLeftItem");
                    
                    // Set data attribute for reference
                    item.dataset.appKey = appData.id;
                    
                    const itemImg = item.appendChild(document.createElement("img"));
                    itemImg.classList.add("smItemImg");
                    itemImg.src = appData.icon;
                    itemImg.loading = "lazy";
                    
                    const itemText = item.appendChild(document.createElement("p"));
                    itemText.classList.add("smItmText");
                    itemText.textContent = appData.name;

                    item.onclick = () => {
                        smLog('Opening pinned app:', appData.id);
                        startApp(appData.app);
                        addRecentApp(appData.id);
                        closeStartMenu();
                    };
                    
                    // Custom mouse drag system
                    item.addEventListener('mousedown', (e) => {
                        if (e.button === 0) { // Left click only
                            window.userBox = {
                                app: appData.app,
                                source: 'startMenu'
                            };
                            console.debug('[StartMenu] Drag START from pinned app', appData.id);
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                });
                smLog('Rendered', pinnedApps.length, 'pinned apps');
            }
            
            // RIGHT: Recent apps
            const recentIds = getRecentApps();
            smLog('Recent IDs:', recentIds);
            const recentApps = recentIds.map(id => allApps.find(a => a.id === id)).filter(a => a);
            smLog('Recent apps resolved:', recentApps.length, recentApps.map(a => a.name));
            
            if (recentApps.length === 0) {
                const noRecent = smRightHalf.appendChild(document.createElement("div"));
                noRecent.classList.add("smNoResults");
                noRecent.textContent = "No recent apps";
                smLog('Showing "No recent apps" message');
            } else {
                recentApps.forEach(appData => {
                    const item = smRightHalf.appendChild(document.createElement("div"));
                    item.classList.add("smRightItem");
                    
                    // Set data attribute for reference
                    item.dataset.appKey = appData.id;
                    
                    const itemImg = item.appendChild(document.createElement("img"));
                    itemImg.classList.add("smItemImg");
                    itemImg.src = appData.icon;
                    itemImg.loading = "lazy";
                    
                    const itemText = item.appendChild(document.createElement("p"));
                    itemText.classList.add("smItmText");
                    itemText.textContent = appData.name;

                    item.onclick = () => {
                        smLog('Opening recent app:', appData.id);
                        startApp(appData.app);
                        addRecentApp(appData.id);
                        closeStartMenu();
                    };
                    
                    // Custom mouse drag system
                    item.addEventListener('mousedown', (e) => {
                        if (e.button === 0) { // Left click only
                            window.userBox = {
                                app: appData.app,
                                source: 'startMenu'
                            };
                            console.debug('[StartMenu] Drag START from recent app', appData.id);
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                });
                smLog('Rendered', recentApps.length, 'recent apps');
            }
        }
    }

    // Initial render
    renderApps();

    // Search Bar (above footer buttons)
    const searchContainer = startMenu.appendChild(document.createElement("div"));
    searchContainer.id = "smSearch";
    
    const searchInput = searchContainer.appendChild(document.createElement("input"));
    searchInput.type = "text";
    searchInput.id = "smSearchInput";
    searchInput.placeholder = "Search programs...";
    searchInput.autocomplete = "off";

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        smLog('Search input changed:', e.target.value);
        renderApps(e.target.value);
    });

    // Footer with power buttons
    const smFooter = startMenu.appendChild(document.createElement("div")); 
    smFooter.id = "smFooter";

    const smFooterLeft = smFooter.appendChild(document.createElement("div"));
    smFooterLeft.id = "smFooterLeft";

    // Log Off button
    const logoffBox = smFooterLeft.appendChild(document.createElement("div"));
    logoffBox.classList.add("powerOptionBox");
    const logoffBtn = logoffBox.appendChild(document.createElement("img"));
    logoffBtn.id = "logoffBtn";
    logoffBtn.src = "assets/images/icons/32x/power.png";
    logoffBtn.style.filter = "hue-rotate(180deg)";
    const logoffText = logoffBox.appendChild(document.createElement("p"));
    logoffText.innerHTML = "Log Off";

    const smFooterRight = smFooter.appendChild(document.createElement("div")); 
    smFooterRight.id = "smFooterRight";

    const restartBox = smFooterRight.appendChild(document.createElement("div")); 
    restartBox.classList.add("powerOptionBox");
    const restartBtn = restartBox.appendChild(document.createElement("img")); 
    restartBtn.id = "restartBtn";
    restartBtn.src = "assets/images/icons/32x/restart.png";
    const restartText = restartBox.appendChild(document.createElement("p"));
    restartText.innerHTML = "Restart";

    const powerBox = smFooterRight.appendChild(document.createElement("div")); 
    powerBox.classList.add("powerOptionBox");
    const powerBtn = powerBox.appendChild(document.createElement("img")); 
    powerBtn.id = "powerBtn";
    powerBtn.src = "assets/images/icons/32x/power.png";
    const powerText = powerBox.appendChild(document.createElement("p"));
    powerText.innerHTML = "Power Off";

    // Focus search on open
    setTimeout(() => searchInput.focus(), 100);

    // Functions
    logoffBtn.onclick = async () => {
        // Log out user but keep computer powered on
        smActive = false;
        closeStartMenu();
        
        // Check if accScreen function is available
        if (typeof window.accScreen !== 'function') {
            console.error('[Taskbar] accScreen function not found! Make sure lifecycle.js is loaded.');
            alert('Log off function not available. Please refresh the page.');
            return;
        }
        
        // Attempt to save layout to DB before showing logging out screen
        try {
            if (window.saveLayoutToDB && window.getUser && window.getUser() !== 'guest') {
                console.debug('[Taskbar] Saving layout to DB before logoff');
                await window.saveLayoutToDB();
                console.debug('[Taskbar] Layout save completed');
            }
        } catch (e) {
            console.error('[Taskbar] Failed to save layout before logoff', e);
        }

        // Show logging out screen
        const accBox = document.body.appendChild(document.createElement("div"));
        accBox.classList.add("accBox");
        accBox.style.zIndex = "9999";
        
        const cBox = window.accScreen(accBox);
        cBox[0].innerHTML = "<i><strong>goodbye</strong></i>";
        
        // Display current user info
        const boxInner = cBox[1].appendChild(document.createElement("div"));
        boxInner.id = "accBoxInner";
        boxInner.classList.add("specialFlex");
        
        const boxInnerLeft = boxInner.appendChild(document.createElement("div"));
        boxInnerLeft.id = "boxInnerLeft";
        const icon = boxInnerLeft.appendChild(document.createElement("img"));
        icon.id = "uIcon";
        icon.src = "assets/images/icons/user/guest.png";
        
        const boxInnerRight = boxInner.appendChild(document.createElement("div"));
        boxInnerRight.id = "boxInnerRight";
        const usernameElem = boxInnerRight.appendChild(document.createElement("p"));
        usernameElem.id = "pu";
        const username = (typeof getUser === 'function') ? getUser() : (localStorage.getItem('username') || 'Guest');
        usernameElem.innerHTML = `<strong>${username}</strong>`;
        
        const subtitle = boxInnerRight.appendChild(document.createElement("p"));
        subtitle.id = "ps";
        subtitle.innerHTML = "<i>Logging Out...</i>";
        
        // Wait 2 seconds then clear user session and reload
        setTimeout(() => {
            // Clear user-specific data but keep system state
            const poweredOn = localStorage.getItem("wigdos_powered_on");
            const wigdosDebug = localStorage.getItem("wigdos_startmenu_debug");
            
            // Clear everything
            localStorage.clear();
            sessionStorage.clear();
            
            // Restore system flags
            if (poweredOn) localStorage.setItem("wigdos_powered_on", poweredOn);
            if (wigdosDebug) localStorage.setItem("wigdos_startmenu_debug", wigdosDebug);
            
            // Reload to login screen
            window.location.reload();
        }, 2000);
    };
    // Make entire logoff box clickable (larger hit area)
    logoffBox.onclick = () => { try { logoffBtn.onclick(); } catch (e) { console.error(e); } };
    restartBtn.onclick = async () => {
        try { if (window.saveLayoutToDB && window.getUser && window.getUser() !== 'guest') await window.saveLayoutToDB(); } catch(e) { console.error('[Taskbar] Save on restart failed', e); }
        power.stage1(false);
    };
    restartBox.onclick = () => { try { restartBtn.onclick(); } catch (e) { console.error(e); } };
    powerBtn.onclick = async () => {
        try { if (window.saveLayoutToDB && window.getUser && window.getUser() !== 'guest') await window.saveLayoutToDB(); } catch(e) { console.error('[Taskbar] Save on poweroff failed', e); }
        power.stage1(true);
    };
    powerBox.onclick = () => { try { powerBtn.onclick(); } catch (e) { console.error(e); } };

    // Enable drag-and-drop onto Start Menu
    if (window.enableStartMenuDrop) {
        window.enableStartMenuDrop(startMenu);
    }

    // Expose refresh function globally so it can be called when pinning apps
    window.refreshStartMenu = function() {
        const searchInput = document.getElementById('smSearchInput');
        if (searchInput) {
            renderApps(searchInput.value);
        } else {
            renderApps('');
        }
    };

    return startMenu;
}

function closeStartMenu() {
    smActive = false;
    const menu = document.getElementById("smBox");
    if (menu) {
        // Disable drag-and-drop
        if (window.disableStartMenuDrop) {
            window.disableStartMenuDrop(menu);
        }
        menu.remove();
    }
}

// Expose createStartMenu globally for auto-open functionality
window.createStartMenu = createStartMenu;

// Add Start Menu button click handler (with safety check)
if (smBtnBox) {
    smBtnBox.addEventListener("click", (event) => {
        if (!smActive) {
            smActive = true;
            createStartMenu();
        }
        else if (smActive && smBtnBox.contains(event.target)) {
            closeStartMenu();
        }
    });
    
    // Auto-open Start Menu when dragging over the Start button
    smBtnBox.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (!smActive) {
            console.debug('[StartMenu] Auto-opening Start Menu for drag operation');
            smActive = true;
            createStartMenu();
        }
    });
} else {
    console.error('[StartMenu] Start Menu button (#sm_btn) not found!');
}

document.addEventListener("mousedown", (event) => {
    if (smActive) {
        const smBox = document.getElementById("smBox");
        // If the user clicked inside the custom context menu, do not auto-close the Start Menu
        const customMenu = document.getElementById('custom-context-menu');
        if (customMenu && customMenu.contains(event.target)) return;

        if (smBox && !smBox.contains(event.target) && (!smBtnBox || !smBtnBox.contains(event.target))) {
            closeStartMenu();
        }
    }
});