contentBox = document.getElementById("appMain");

// File system structure
const fileSystem = {
    'Desktop': {
        type: 'folder',
        icon: 'assets/images/icons/32x/files.png',
        children: () => {
            // Show all apps that can be on desktop
            const apps = {};
            if (window.applications) {
                Object.keys(window.applications).forEach(key => {
                    const app = window.applications[key];
                    apps[app.name.d] = {
                        type: 'app',
                        icon: app.icon.s,
                        appKey: key,
                        app: app
                    };
                });
            }
            return apps;
        }
    },
    'Programs': {
        type: 'folder',
        icon: 'assets/images/icons/32x/files.png',
        children: {
            'Browsers': {
                type: 'folder',
                icon: 'assets/images/icons/32x/files.png',
                children: {
                    'WiggleSearch': { type: 'app', appKey: 'rBrowser' },
                    'WigleFari': { type: 'app', appKey: 'fBrowser' }
                }
            },
            'Games': {
                type: 'folder',
                icon: 'assets/images/icons/32x/files.png',
                children: {
                    'FNAF': {
                        type: 'folder',
                        icon: 'assets/images/icons/32x/files.png',
                        children: {
                            'FNAF 1': { type: 'app', appKey: 'feddy1' },
                            'FNAF 2': { type: 'app', appKey: 'feddy2' },
                            'FNAF 3': { type: 'app', appKey: 'feddy3' },
                            'FNAF 4': { type: 'app', appKey: 'feddy4' },
                            'FNAF World': { type: 'app', appKey: 'feddyWorld' },
                            'FNAF PS': { type: 'app', appKey: 'feddyPS' },
                            'FNAF UCN': { type: 'app', appKey: 'feddyUCN' }
                        }
                    },
                    'Other Games': {
                        type: 'folder',
                        icon: 'assets/images/icons/32x/files.png',
                        children: {
                            'Undertale': { type: 'app', appKey: 'ut' },
                            'Deltarune': { type: 'app', appKey: 'dt' },
                            'Super Mario 64': { type: 'app', appKey: 'sm64' },
                            'Half-Life': { type: 'app', appKey: 'hlf' },
                            'Super Jeff': { type: 'app', appKey: 'jeff' },
                            'PokeHub': { type: 'app', appKey: 'pHub' },
                            'Breakout': { type: 'app', appKey: 'breakout' },
                            'Sublimator': { type: 'app', appKey: 'sublimator' }
                        }
                    },
                    'Wigsplosionator': { type: 'app', appKey: 'bombs' },
                    'Singular Upgrading': { type: 'app', appKey: 'su' }
                }
            },
            'Built-in': {
                type: 'folder',
                icon: 'assets/images/icons/32x/files.png',
                children: {
                    'Notepad': { type: 'app', appKey: 'notes' },
                    'Recycling Bin': { type: 'app', appKey: 'bin' },
                    'File Explorer': { type: 'app', appKey: 'files' },
                    'GameSpot': { type: 'app', appKey: 'gspot' }
                }
            }
        }
    }
};

// Current path tracking
let currentPath = [];
let currentFolder = fileSystem;

// Navigation and rendering
function renderFiles() {
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
    
    // Render folder contents
    Object.keys(contents).forEach(name => {
        const item = contents[name];
        
        if (item.type === 'folder') {
            createFileItem({
                name: name,
                icon: item.icon || 'assets/images/icons/32x/files.png',
                action: () => navigateInto(name, item)
            });
        } else if (item.type === 'app') {
            const app = item.app || (window.applications && window.applications[item.appKey]);
            if (app) {
                createFileItem({
                    name: name,
                    icon: item.icon || app.icon.s,
                    action: () => {
                        console.log(`[Files] Opening app: ${app.name.s}`);
                        startApp(app);
                    },
                    isApp: true,
                    app: app
                });
            }
        }
    });
    
    updateAddressBar();
}

function navigateInto(name, folder) {
    currentPath.push({ name: name, folder: currentFolder });
    currentFolder = folder;
    renderFiles();
}

function navigateUp() {
    if (currentPath.length > 0) {
        const prev = currentPath.pop();
        currentFolder = prev.folder;
        renderFiles();
    }
}

function updateAddressBar() {
    const topBar = document.getElementById('topBar');
    const path = currentPath.length === 0 ? 'My Computer' : 'My Computer\\' + currentPath.map(p => p.name).join('\\');
    topBar.innerHTML = `<div style="padding: 5px; background-color: #fff; border-bottom: 1px solid #ccc; font-family: 'Tahoma', sans-serif; font-size: 11px;">📁 ${path}</div>`;
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

    // Add drag functionality for apps
    if (config.isApp && config.app) {
        filesItem.addEventListener('dragstart', (event) => {
            event.dataTransfer.effectAllowed = 'copy';
            event.dataTransfer.setData('text/plain', config.app.name.s);
            event.dataTransfer.setData('wigdos/app', JSON.stringify({
                appKey: config.app.name.s,
                appName: config.app.name.d,
                source: 'fileExplorer'
            }));
            
            // Create drag preview
            if (window.createDragPreview) {
                window.createDragPreview(config.app, event);
            }
            
            console.log(`[Files] Started dragging: ${config.app.name.d}`);
        });

        filesItem.addEventListener('dragend', (event) => {
            if (window.removeDragPreview) {
                window.removeDragPreview();
            }
        });
    }

    filesItems.push(item);
}

// Global variables
let filesItems = [];
let prevItem;

// Initialize file explorer
renderFiles();