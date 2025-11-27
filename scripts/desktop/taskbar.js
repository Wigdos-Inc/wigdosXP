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
    const wrapperWidth = appButtonsWrapper.offsetWidth - 20; // Account for padding
    
    // Estimate button width (adjust based on your styling)
    const buttonWidth = 180; // Approximate width including margin/gap
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

// Recalculate on window resize
window.addEventListener('resize', () => {
    organizeTaskbarRows();
});

// Make functions globally accessible so AppWindow can call them
window.taskbarFunctions = {
    createButton: createAppTaskbarButton,
    removeButton: removeAppTaskbarButton,
    updateButtons: updateAppTaskbarButtons
};

console.log('[Taskbar] Functions ready and exported globally');


/* HTML Setup */

// Store Start Menu Button
const smBtnBox = document.getElementById("sm_btn");


// Quick Access Icon Functionality
document.getElementById("qa_icon1").onclick = () => startApp(applications.notes);
document.getElementById("qa_icon2").onclick = () => startApp(applications.files);

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
    if (type == "tbClock") tsBtn.innerHTML = `${cTime.hours}:${cTime.minutes}`;
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
let smActive;
smBtnBox.addEventListener("click", (event) => {

    if (!smActive) {
        
        smActive = true;

        const startMenu = desktop.appendChild(document.createElement("div"));
        startMenu.id = "smBox";
        startMenu.style.opacity = 1;


        // Header
        const smHeader = startMenu.appendChild(document.createElement("div")); smHeader.id = "smHeader";

        const headerImg = smHeader.appendChild(document.createElement("img"));
        headerImg.src = "assets/images/icons/user/guest.png";

        const headerText = smHeader.appendChild(document.createElement("p"));
        headerText.innerHTML = `<strong>${getUser()}</strong>`;

        // Search Bar
        const searchContainer = startMenu.appendChild(document.createElement("div"));
        searchContainer.id = "smSearchContainer";
        searchContainer.style.cssText = `
            padding: 6px 12px;
            background: linear-gradient(180deg, #fff 0%, #f0f0f0 100%);
            border-bottom: 2px solid #0055aa;
            position: relative;
        `;

        const searchInput = searchContainer.appendChild(document.createElement("input"));
        searchInput.type = "text";
        searchInput.id = "smSearchInput";
        searchInput.placeholder = "Search programs...";
        searchInput.style.cssText = `
            width: 100%;
            padding: 4px 8px;
            border: 2px inset #ddd;
            font-family: 'Tahoma', sans-serif;
            font-size: 11px;
            box-sizing: border-box;
            background: white;
        `;

        // Search results dropdown - append to search container instead
        const searchResults = searchContainer.appendChild(document.createElement("div"));
        searchResults.id = "smSearchResults";
        searchResults.style.cssText = `
            display: none;
            max-height: 120px;
            overflow-y: auto;
            background: white;
            border: 2px solid #0055aa;
            border-top: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10000;
            box-shadow: 2px 2px 4px rgba(255, 255, 255, 1);
        `;

        // Search functionality
        const searchableApps = [
            { name: "WiggleSearch", displayName: "WiggleSearch", app: applications.rBrowser, keywords: ["wigglesearch", "search", "browser", "wiggle"] },
            { name: "Wiglefari", displayName: "Wiglefari", app: applications.fBrowser, keywords: ["wiglefari", "browser", "safari"] },
            { name: "File Explorer", displayName: "File Explorer", app: applications.files, keywords: ["file", "explorer", "files"] },
            { name: "GameSpot", displayName: "GameSpot", app: applications.gspot, keywords: ["gamespot", "games"] },
            { name: "Recycling Bin", displayName: "Recycling Bin", app: applications.bin, keywords: ["bin", "recycle", "trash"] },
            { name: "Singular Upgrading", displayName: "Singular Upgrading", app: applications.su, keywords: ["su", "singular", "upgrading"] },
        ];

        searchInput.addEventListener("input", function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length === 0) {
                searchResults.style.display = "none";
                searchResults.innerHTML = "";
                return;
            }

            const matches = searchableApps.filter(appItem => {
                return appItem.name.toLowerCase().includes(query) ||
                       appItem.displayName.toLowerCase().includes(query) ||
                       appItem.keywords.some(keyword => keyword.includes(query));
            });

            if (matches.length === 0) {
                searchResults.style.display = "none";
                searchResults.innerHTML = "";
                return;
            }

            searchResults.innerHTML = "";
            searchResults.style.display = "block";

            matches.forEach(match => {
                const resultItem = searchResults.appendChild(document.createElement("div"));
                resultItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    color: white;
                `;

                if (match.app) {
                    const icon = resultItem.appendChild(document.createElement("img"));
                    icon.src = match.app.icon.s;
                    icon.style.cssText = "width: 16px; height: 16px;";
                }

                const text = resultItem.appendChild(document.createElement("span"));
                text.textContent = match.displayName;
                text.style.cssText = "font-size: 12px; font-family: 'Tahoma', sans-serif; color: inherit;";

                resultItem.addEventListener("mouseenter", function() {
                    this.style.background = "#0055aa";
                    this.style.color = "white";
                });

                resultItem.addEventListener("mouseleave", function() {
                    this.style.background = "white";
                    this.style.color = "white";
                });

                resultItem.addEventListener("click", function() {
                    if (match.app) {
                        startApp(match.app);
                        smActive = false;
                        document.getElementById("smBox").remove();
                    } else {
                        alert(`${match.displayName} is coming soon!`);
                    }
                });
            });
        });

        // Clear search when clicking outside
        searchInput.addEventListener("blur", function() {
            setTimeout(() => {
                searchResults.style.display = "none";
            }, 200);
        });


        // Main
        const smMain = startMenu.appendChild(document.createElement("div")); smMain.id = "smMain";

        const smLeftHalf = {
            element: smMain.appendChild(document.createElement("div")),
            images : 
            [
                "assets/images/icons/32x/rBrowser.png",
                "assets/images/icons/32x/fBrowser.png"
            ],
            titles : ["WiggleSearch", "Wiglefari"],
            actions:
            [
                () => startApp(applications.rBrowser),
                () => startApp(applications.fBrowser)
            ]
        }
        smLeftHalf.element.classList.add("smHalf"); smLeftHalf.element.id = "smLeftHalf";
        for (let i=0; i < 2; i++) {

            const item = smLeftHalf.element.appendChild(document.createElement("div")); item.classList.add("smLeftItem");
            const itemImg = item.appendChild(document.createElement("img")); itemImg.classList.add("smItemImg");
            itemImg.src = smLeftHalf.images[i];
            
            const itemText = item.appendChild(document.createElement("p")); itemText.classList.add("smItmText");
            itemText.innerHTML = smLeftHalf.titles[i];

            item.onclick = smLeftHalf.actions[i];
        }

        
        const smRightHalf = {
            element: smMain.appendChild(document.createElement("div")),
            images : 
            [
                "assets/images/icons/32x/files.png",
                "assets/images/icons/32x/notes.png"
            ],
            titles : ["File Explorer", "Notepad"],
            actions:
            [
                () => startApp(applications.notes),
                () => startApp(applications.files)
            ]
        }
        smRightHalf.element.classList.add("smHalf"); smRightHalf.element.id = "smRightHalf";
        for (let i=0; i < 2; i++) {

            const item = smRightHalf.element.appendChild(document.createElement("div")); item.classList.add("smRightItem");
            const itemImg = item.appendChild(document.createElement("img")); itemImg.classList.add("smItemImg");
            itemImg.src = smRightHalf.images[i];
            
            const itemText = item.appendChild(document.createElement("p")); itemText.classList.add("smItmText");
            itemText.innerHTML = smRightHalf.titles[i];

            item.onclick = smRightHalf.actions[i];
        }


        // Footer
        const smFooter = startMenu.appendChild(document.createElement("div")); smFooter.id = "smFooter";

        smFooter.appendChild(document.createElement("div"));
        const smFooterRight = smFooter.appendChild(document.createElement("div")); smFooterRight.id = "smFooterRight";

        const restartBox = smFooterRight.appendChild(document.createElement("div")); restartBox.classList.add("powerOptionBox");
        const restartBtn = restartBox.appendChild(document.createElement("img")); restartBtn.id = "restartBtn";
        restartBtn.src = "assets/images/icons/32x/restart.png";
        const restartText = restartBox.appendChild(document.createElement("p"));
        restartText.innerHTML = "Restart"

        const powerBox = smFooterRight.appendChild(document.createElement("div")); powerBox.classList.add("powerOptionBox");
        const powerBtn = powerBox.appendChild(document.createElement("img")); powerBtn.id = "powerBtn";
        powerBtn.src = "assets/images/icons/32x/power.png";
        const powerText = powerBox.appendChild(document.createElement("p"));
        powerText.innerHTML = "Power Off"

        // Functions
        restartBtn.onclick = () => power.stage1(false);
        powerBtn.onclick = () => power.stage1(true);

    }
    else if (smActive && smBtnBox.contains(event.target)) {
        smActive = false;
        document.getElementById("smBox").remove();
    }
    else if (smActive && document.getElementById("restartBtn").contains(event.target)) power(false);
    else if (smActive && document.getElementById("powerBtn").contains(event.target)) power(true);
});

document.addEventListener("mousedown", (event) => {

    if (smActive && !document.getElementById("smBox").contains(event.target) && !smBtnBox.contains(event.target)) {

        smActive = false;
        document.getElementById("smBox").remove();

    }
});