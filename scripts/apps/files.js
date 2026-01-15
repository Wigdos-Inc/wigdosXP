contentBox = document.getElementById("appMain");

// Get applications from parent window if available
function getApplications() {
    // Check parent window first (if opened in iframe/window)
    if (window.parent && window.parent !== window && window.parent.applications) {
        return window.parent.applications;
    }
    // Check opener window (if opened as popup)
    if (window.opener && window.opener.applications) {
        return window.opener.applications;
    }
    // Check current window
    if (window.applications) {
        return window.applications;
    }
    return null;
}

// Navigation history
let navHistory = [];
let navHistoryIndex = -1;

// Search state
let searchQuery = '';

// File system structure
const fileSystem = {
    'Desktop': {
        type: 'folder',
        icon: 'assets/images/icons/32x/files.png',
        children: () => {
            // Show actual apps currently on desktop
            const apps = {};
            const targetWindow = window.parent && window.parent !== window ? window.parent : window;
            
            console.debug('[Files] Getting desktop icons from:', targetWindow.dkGridArray ? 'parent window' : 'current window');
            
            if (targetWindow.dkGridArray) {
                targetWindow.dkGridArray.forEach(row => {
                    row.forEach(box => {
                        if (box.filled && box.app) {
                            const app = box.app;
                            const name = app.name.d;
                            console.debug('[Files] Found desktop app:', name);
                            apps[name] = {
                                type: 'app',
                                icon: app.icon.s,
                                appKey: app.name.s,
                                app: app
                            };
                        }
                    });
                });
            }
            console.debug('[Files] Desktop folder has', Object.keys(apps).length, 'items');
            return apps;
        }
    },
    'Programs': {
        type: 'folder',
        icon: 'assets/images/icons/32x/files.png',
        children: () => {
            // Dynamically build programs folder from applications object
            const applications = getApplications();
            console.debug('[Files] Building Programs folder, found applications:', applications ? Object.keys(applications).length : 0);
            
            if (!applications) return {};
            
            const folders = {
                'All Programs': {
                    type: 'folder',
                    icon: 'assets/images/icons/32x/files.png',
                    children: () => {
                        const allApps = {};
                        Object.keys(applications).forEach(key => {
                            const app = applications[key];
                            allApps[app.name.d] = {
                                type: 'app',
                                icon: app.icon.s,
                                appKey: key,
                                app: app
                            };
                        });
                        return allApps;
                    }
                }
            };
            
            // Organize by series/category
            const categorized = {};
            Object.keys(applications).forEach(key => {
                const app = applications[key];
                if (app.series) {
                    if (!categorized[app.series]) {
                        categorized[app.series] = [];
                    }
                    categorized[app.series].push({ key, app });
                }
            });
            
            // Add categorized folders
            Object.keys(categorized).forEach(series => {
                const seriesApps = {};
                categorized[series].forEach(({ key, app }) => {
                    seriesApps[app.name.d] = {
                        type: 'app',
                        icon: app.icon.s,
                        appKey: key,
                        app: app
                    };
                });
                folders[series] = {
                    type: 'folder',
                    icon: 'assets/images/icons/32x/files.png',
                    children: seriesApps
                };
            });
            
            return folders;
        }
    }
};

// Current path tracking
let currentPath = [];
let currentFolder = fileSystem;

// Navigation and rendering
function renderFiles(addToHistory = true) {
    contentBox.innerHTML = '';
    filesItems = [];
    
    // Get current folder contents
    let contents = currentFolder;
    if (typeof currentFolder.children === 'function') {
        contents = currentFolder.children();
    } else if (currentFolder.children) {
        contents = currentFolder.children;
    }
    
    // Add "Back" button if not at root
    if (currentPath.length > 0) {
        createFileItem({
            name: '.. (Back)',
            icon: 'assets/images/icons/32x/files.png',
            action: () => navigateUp()
        });
    }
    
    // Render folder contents (with search filter)
    Object.keys(contents).forEach(name => {
        const item = contents[name];
        
        // Filter by search query
        if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return;
        }
        
        if (item.type === 'folder') {
            createFileItem({
                name: name,
                icon: item.icon || 'assets/images/icons/32x/files.png',
                action: () => navigateInto(name, item),
                isFolder: true,
                folder: item
            });
        } else if (item.type === 'app') {
            const applications = getApplications();
            const app = item.app || (applications && applications[item.appKey]);
            if (app) {
                createFileItem({
                    name: name,
                    icon: item.icon || app.icon.s,
                    action: () => {
                        console.log(`[Files] Opening app: ${app.name.s}`);
                        // Use parent window's startApp if available
                        if (window.parent && window.parent !== window && window.parent.startApp) {
                            window.parent.startApp(app);
                        } else if (window.opener && window.opener.startApp) {
                            window.opener.startApp(app);
                        } else if (window.startApp) {
                            startApp(app);
                        } else {
                            console.error('[Files] startApp function not found');
                        }
                    },
                    isApp: true,
                    app: app
                });
            } else {
                // App not loaded yet, show placeholder
                console.warn(`[Files] App not found: ${item.appKey}`);
                createFileItem({
                    name: name,
                    icon: item.icon || 'assets/images/icons/32x/files.png',
                    action: () => {
                        console.error(`[Files] Cannot open app: ${item.appKey} not loaded`);
                    },
                    isApp: false,
                    app: null
                });
            }
        }
    });
    
    updateAddressBar();
    updateStatusBar();
    
    // Add to navigation history
    if (addToHistory) {
        navHistory = navHistory.slice(0, navHistoryIndex + 1);
        navHistory.push({ path: [...currentPath], folder: currentFolder });
        navHistoryIndex = navHistory.length - 1;
        updateNavigationButtons();
    }
}

function navigateInto(name, folder) {
    currentPath.push({ name: name, folder: currentFolder });
    currentFolder = folder;
    searchQuery = ''; // Clear search when navigating
    updateSearchInput();
    renderFiles();
}

function navigateUp() {
    if (currentPath.length > 0) {
        const prev = currentPath.pop();
        currentFolder = prev.folder;
        searchQuery = ''; // Clear search when navigating
        updateSearchInput();
        renderFiles();
    }
}

function navigateBack() {
    if (navHistoryIndex > 0) {
        navHistoryIndex--;
        const state = navHistory[navHistoryIndex];
        currentPath = [...state.path];
        currentFolder = state.folder;
        searchQuery = '';
        updateSearchInput();
        renderFiles(false);
        updateNavigationButtons();
    }
}

function navigateForward() {
    if (navHistoryIndex < navHistory.length - 1) {
        navHistoryIndex++;
        const state = navHistory[navHistoryIndex];
        currentPath = [...state.path];
        currentFolder = state.folder;
        searchQuery = '';
        updateSearchInput();
        renderFiles(false);
        updateNavigationButtons();
    }
}

function navigateToPath(index) {
    if (index < 0) {
        // Navigate to root
        currentPath = [];
        currentFolder = fileSystem;
    } else if (index < currentPath.length) {
        // Navigate to specific path segment
        currentPath = currentPath.slice(0, index + 1);
        currentFolder = currentPath[index].folder;
        // Navigate into the folder
        const folder = currentPath.pop();
        currentFolder = folder.folder;
        const target = currentPath.length === 0 ? fileSystem : currentPath[currentPath.length - 1].folder;
        let contents = typeof target.children === 'function' ? target.children() : target.children;
        if (folder.name && contents[folder.name]) {
            navigateInto(folder.name, contents[folder.name]);
            return;
        }
    }
    searchQuery = '';
    updateSearchInput();
    renderFiles();
}

function updateAddressBar() {
    const topBar = document.getElementById('topBar');
    topBar.innerHTML = `
        <div class="files-toolbar">
            <div class="files-nav-buttons">
                <button id="backBtn" class="nav-btn" title="Back">◄</button>
                <button id="forwardBtn" class="nav-btn" title="Forward">►</button>
                <button id="upBtn" class="nav-btn" title="Up">▲</button>
            </div>
            <div class="files-breadcrumb" id="breadcrumb"></div>
            <div class="files-search">
                <input type="text" id="searchInput" placeholder="Search..." value="${searchQuery}">
            </div>
        </div>
    `;
    
    // Update breadcrumb
    updateBreadcrumb();
    
    // Add event listeners
    document.getElementById('backBtn').addEventListener('click', navigateBack);
    document.getElementById('forwardBtn').addEventListener('click', navigateForward);
    document.getElementById('upBtn').addEventListener('click', navigateUp);
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderFiles(false);
    });
    
    updateNavigationButtons();
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    let crumbs = '<span class="crumb" data-index="-1">My Computer</span>';
    
    currentPath.forEach((p, index) => {
        crumbs += ` <span class="crumb-separator">›</span> <span class="crumb" data-index="${index}">${p.name}</span>`;
    });
    
    breadcrumb.innerHTML = crumbs;
    
    // Add click handlers to breadcrumbs
    document.querySelectorAll('.crumb').forEach(crumb => {
        crumb.addEventListener('click', () => {
            const index = parseInt(crumb.dataset.index);
            navigateToPath(index);
        });
    });
}

function updateNavigationButtons() {
    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const upBtn = document.getElementById('upBtn');
    
    if (backBtn) backBtn.disabled = navHistoryIndex <= 0;
    if (forwardBtn) forwardBtn.disabled = navHistoryIndex >= navHistory.length - 1;
    if (upBtn) upBtn.disabled = currentPath.length === 0;
}

function updateSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = searchQuery;
    }
}

function updateStatusBar() {
    const bottomBar = document.getElementById('bottomBar');
    const itemCount = filesItems.length - (currentPath.length > 0 ? 1 : 0); // Exclude back button
    const itemText = itemCount === 1 ? 'item' : 'items';
    bottomBar.innerHTML = `<div class="files-status">${itemCount} ${itemText}${searchQuery ? ' (filtered)' : ''}</div>`;
}

function createFileItem(config) {
    const filesItem = contentBox.appendChild(document.createElement("div"));
    filesItem.classList.add("filesItem");

    // Make items draggable if they're apps
    if (config.isApp && config.app) {
        filesItem.draggable = true;
        filesItem.dataset.appKey = config.app.name.s;
    }

    // Create and Assign Content to Box
    let item = {
        parent: filesItem,
        image : filesItem.appendChild(document.createElement("img")),
        text  : filesItem.appendChild(document.createElement("p")),
        action: config.action,
        isApp: config.isApp || false,
        app: config.app || null,

        select: {
            count : 0,
            change: false,
            old   : undefined
        },

        change: function(type) {
            // Only allow renaming for apps, not folders or back button
            if (!this.isApp) return;

            if (type && !this.select.change && this.select.count > 1) {

                this.select.change = true;

                // Store Previous Name
                this.select.old = this.text.innerHTML;
                this.text.remove();

                // Create Input Field for Renaming
                this.text = filesItem.appendChild(document.createElement("input"));
                this.text.type = "text";
                this.text.class = "appInput";
                this.text.value = this.select.old;

                // Renaming Finalizes when Pressing Enter
                this.text.addEventListener("keydown", (event) => {

                    if (event.key === "Enter") this.change(false);
                });

            }
            else if (!type && this.select.change) {

                let value = (this.text.value == "") ? this.select.old : this.text.value;

                this.text.remove();
                this.select.change = false;
                this.select.old = undefined;
                this.select.count = 0;

                this.text = filesItem.appendChild(document.createElement("p"));
                this.text.innerHTML = value;

            }
        }
    }
    item.image.src = config.icon;
    item.text.innerHTML = config.name;

        
    // Renaming and Activation Detection
    let prevClick = {};
    filesItem.addEventListener("click", (event) => {

        if (prevItem && !prevItem.parent.contains(event.target)) {
            prevItem.select.count = 0;
            prevItem.parent.classList.remove("filesItemSelected");
        }
            
        filesItem.classList.add("filesItemSelected");
        prevItem = item;

        // Renaming (only for apps)
        item.select.count++;
        if (event.target.tagName == "P" && item.isApp) item.change(true);

        // Activation (double-click)
        const cTime = Date.now();
        const pTime = prevClick[config.name];

        if (pTime && (cTime - pTime) < 500 && event.target !== item.text) {
            item.action();
        }

        prevClick[config.name] = cTime;
    });

    document.addEventListener("mousedown", (event) => {

        if (event.target !== item.text) item.change(false);
        if (prevItem && event.target !== prevItem.parent) prevItem.parent.classList.remove("filesItemSelected"); 
    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Enter") item.change(false);
    });

    // Add drag functionality - use EXACT same system as desktop/start menu
    if (config.isApp && config.app) {
        console.debug('[Files] Setting up drag for app:', config.app.name.d);
        // Use desktop's custom mouse drag (no setTimeout, immediate on mousedown)
        filesItem.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                console.debug('[Files] Mousedown on app:', config.app.name.d);
                // Store start position for drag detection
                dragStartPos = { x: e.clientX, y: e.clientY };
                isDragging = false;
                
                // Access parent window's userBox (same as start menu does)
                const targetWindow = window.parent && window.parent !== window ? window.parent : window;
                console.debug('[Files] Setting userBox on:', targetWindow === window ? 'current window' : 'parent window');
                targetWindow.userBox = {
                    app: config.app,
                    source: 'fileExplorer'
                };
                console.debug('[Files] ✅ Set userBox for app', config.app.name.d);
                e.preventDefault();
                e.stopPropagation();
            }
        });
    } else if (config.isFolder) {
        console.debug('[Files] Setting up drag for folder:', config.name);
        // Folders can be dragged to create shortcuts
        filesItem.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                console.debug('[Files] Mousedown on folder:', config.name);
                dragStartPos = { x: e.clientX, y: e.clientY };
                isDragging = false;
                
                const targetWindow = window.parent && window.parent !== window ? window.parent : window;
                console.debug('[Files] Setting userBox on:', targetWindow === window ? 'current window' : 'parent window');
                targetWindow.userBox = {
                    folder: config.folder,
                    folderName: config.name,
                    folderPath: [...currentPath, { name: config.name }],
                    source: 'fileExplorer'
                };
                console.debug('[Files] ✅ Set userBox for folder', config.name);
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    filesItems.push(item);
}

// Global variables
let filesItems = [];
let prevItem;
let selectedIndex = -1;
let dragStartPos = null;
let isDragging = false;

// Bridge mousemove events to parent window for drag preview
document.addEventListener('mousemove', (event) => {
    const targetWindow = window.parent && window.parent !== window ? window.parent : window;
    
    // Check if we should start dragging (mouse moved more than 5px)
    if (dragStartPos && !isDragging) {
        const dx = event.clientX - dragStartPos.x;
        const dy = event.clientY - dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            isDragging = true;
            console.debug('[Files] Drag motion detected, distance:', distance);
        }
    }
    
    // If there's an active drag from file explorer, trigger parent's mousemove
    if (targetWindow.userBox && targetWindow.userBox.source === 'fileExplorer' && isDragging) {
        // Calculate absolute coordinates relative to parent window
        const rect = window.frameElement ? window.frameElement.getBoundingClientRect() : { left: 0, top: 0 };
        const parentEvent = new MouseEvent('mousemove', {
            clientX: rect.left + event.clientX,
            clientY: rect.top + event.clientY,
            bubbles: true,
            cancelable: true
        });
        targetWindow.document.dispatchEvent(parentEvent);
    }
});

// Bridge mouseup events to parent window
document.addEventListener('mouseup', (event) => {
    const targetWindow = window.parent && window.parent !== window ? window.parent : window;
    
    // Only process if we were actually dragging (not just clicking)
    if (targetWindow.userBox && targetWindow.userBox.source === 'fileExplorer' && isDragging) {
        console.debug('[Files] Drag ended, forwarding mouseup to parent');
        // Calculate absolute coordinates relative to parent window
        const rect = window.frameElement ? window.frameElement.getBoundingClientRect() : { left: 0, top: 0 };
        const parentEvent = new MouseEvent('mouseup', {
            clientX: rect.left + event.clientX,
            clientY: rect.top + event.clientY,
            bubbles: true,
            cancelable: true
        });
        targetWindow.document.dispatchEvent(parentEvent);
    } else if (targetWindow.userBox && targetWindow.userBox.source === 'fileExplorer' && !isDragging) {
        // Was just a click, not a drag - clear userBox
        console.debug('[Files] Click without drag, clearing userBox');
        targetWindow.userBox = undefined;
    }
    
    // Reset drag state
    dragStartPos = null;
    isDragging = false;
});

// Keyboard navigation
document.addEventListener('keydown', (event) => {
    // Don't handle keyboard if typing in search
    if (event.target.id === 'searchInput') return;
    
    const itemCount = filesItems.length;
    if (itemCount === 0) return;
    
    switch(event.key) {
        case 'ArrowUp':
            event.preventDefault();
            selectedIndex = selectedIndex <= 0 ? itemCount - 1 : selectedIndex - 1;
            selectItemByIndex(selectedIndex);
            break;
        case 'ArrowDown':
            event.preventDefault();
            selectedIndex = selectedIndex >= itemCount - 1 ? 0 : selectedIndex + 1;
            selectItemByIndex(selectedIndex);
            break;
        case 'ArrowLeft':
            if (selectedIndex >= 5) {
                selectedIndex -= 5;
                selectItemByIndex(selectedIndex);
            }
            break;
        case 'ArrowRight':
            if (selectedIndex < itemCount - 5) {
                selectedIndex += 5;
                selectItemByIndex(selectedIndex);
            }
            break;
        case 'Enter':
            event.preventDefault();
            if (selectedIndex >= 0 && filesItems[selectedIndex]) {
                filesItems[selectedIndex].action();
            }
            break;
        case 'Backspace':
            event.preventDefault();
            if (currentPath.length > 0) {
                navigateUp();
            }
            break;
    }
});

function selectItemByIndex(index) {
    if (prevItem) {
        prevItem.parent.classList.remove('filesItemSelected');
    }
    if (index >= 0 && index < filesItems.length) {
        const item = filesItems[index];
        item.parent.classList.add('filesItemSelected');
        item.parent.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        prevItem = item;
        selectedIndex = index;
    }
}

// Initialize file explorer
function initializeFileExplorer() {
    // Check if we should navigate to a specific path
    const targetWindow = window.parent && window.parent !== window ? window.parent : window;
    const startPath = targetWindow.fileExplorerStartPath;
    
    if (startPath && startPath.length > 0) {
        console.debug('[Files] Navigating to start path:', startPath);
        // Clear the start path so it doesn't affect future opens
        targetWindow.fileExplorerStartPath = null;
        
        // Navigate through the path
        startPath.forEach(pathSegment => {
            const folderName = pathSegment.name;
            // Get current folder contents
            let contents = currentFolder;
            if (typeof currentFolder.children === 'function') {
                contents = currentFolder.children();
            } else if (currentFolder.children) {
                contents = currentFolder.children;
            }
            
            // Find and navigate into the folder
            if (contents[folderName]) {
                console.debug('[Files] Navigating into:', folderName);
                navigateInto(folderName, contents[folderName]);
            }
        });
    } else {
        // Normal initialization
        renderFiles();
    }
}

initializeFileExplorer();