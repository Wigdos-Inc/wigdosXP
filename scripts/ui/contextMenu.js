(function(){
    // Simple custom context menu for WigdosXP
    const MENU_ID = 'custom-context-menu';
    let menu = document.getElementById(MENU_ID);
    let disabled = localStorage.getItem('wigdos_custom_context_disabled') === 'true';
    const DEBUG = localStorage.getItem('wigdos_context_debug') === 'true';

    function dlog(...args){ if (DEBUG) console.debug('[CMENU]', ...args); }
    function derror(...args){ if (DEBUG) console.error('[CMENU]', ...args); }

    // === Helper Functions ===
    
    /**
     * Get desktop grid array safely
     */
    function getDesktopGrid() {
        return (typeof dkGridArray !== 'undefined') ? dkGridArray : window.dkGridArray;
    }

    /**
     * Get applications object safely
     */
    function getApplications() {
        return (typeof applications !== 'undefined') ? applications : window.applications;
    }

    /**
     * Get pinned apps from layout storage (per user)
     */
    function getPinnedApps() {
        try {
            if (localStorage.getItem("layout") && window.getUser && window.getUser() != "guest") {
                let layout = JSON.parse(localStorage.getItem("layout"));
                
                // Handle old format migration
                if (Array.isArray(layout)) {
                    layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], initialized: true };
                    localStorage.setItem("layout", JSON.stringify(layout));
                }
                
                if (layout.taskbarPinned && Array.isArray(layout.taskbarPinned)) {
                    return layout.taskbarPinned;
                }
            }
            return ['notes', 'files']; // defaults
        } catch (e) {
            derror('Failed to get pinned apps', e);
            return ['notes', 'files'];
        }
    }

    /**
     * Set pinned apps in layout storage (per user)
     */
    function setPinnedApps(pinned) {
        try {
            if (localStorage.getItem("layout") && window.getUser && window.getUser() != "guest") {
                let layout = JSON.parse(localStorage.getItem("layout"));
                
                // Handle old format migration
                if (Array.isArray(layout)) {
                    layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], initialized: true };
                }
                
                layout.taskbarPinned = pinned;
                localStorage.setItem("layout", JSON.stringify(layout));
                if (window.taskbarReloadPinned) window.taskbarReloadPinned();
            } else {
                // Guest user - don't save
                derror('Cannot save taskbar pins for guest user');
            }
        } catch (e) {
            derror('Failed to set pinned apps', e);
        }
    }

    /**
     * Show user-friendly error message
     */
    function showUserError(message) {
        if (window.showError) {
            window.showError(message);
        } else {
            alert(message); // Fallback
        }
    }

    /**
     * Show user-friendly success message
     */
    function showUserSuccess(message) {
        if (window.showSuccess) {
            window.showSuccess(message);
        }
    }

    // === Validation on Load ===
    
    function validateDependencies() {
        const missing = [];
        
        if (!getApplications()) {
            missing.push('applications object');
        }
        
        if (!getDesktopGrid()) {
            missing.push('desktop grid (dkGridArray)');
        }
        
        if (missing.length > 0) {
            console.warn('[Context Menu] Missing dependencies:', missing.join(', '));
            console.warn('[Context Menu] Some features may not work correctly');
        }
        
        return missing.length === 0;
    }

    function createMenuContainer(){
        if (menu) return menu;
        menu = document.createElement('div');
        menu.id = MENU_ID;
        menu.className = MENU_ID;
        // Let CSS handle all styling instead of inline styles
        document.body.appendChild(menu);
        dlog('Created menu container', MENU_ID);
        return menu;
    }

    function clearMenu(){
        if (!menu) return;
        menu.innerHTML = '';
    }

    function addItem(label, action, opts = {}){
        const item = document.createElement('div');
        item.className = 'context-item';
        item.tabIndex = opts.disabled ? -1 : 0; // Make focusable for keyboard nav
        item.setAttribute('role', 'menuitem');
        if (opts.disabled) item.classList.add('disabled');

        if (opts.icon) {
            const img = document.createElement('img');
            img.src = opts.icon;
            img.classList.add('icon');
            item.appendChild(img);
        }

        const text = document.createElement('span');
        text.textContent = label;
        item.appendChild(text);

        if (!opts.disabled) {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                dlog('Menu item clicked:', label, 'opts=', opts);
                try {
                    action();
                } catch (err) {
                    derror('Context action error for', label, err);
                }
                // hide after action so actions that alter DOM (rename/attach) run while
                // the current selection state is still intact.
                try { hideMenu(); } catch(e) { derror('hideMenu error', e); }
            });
        } else {
            dlog('Created disabled menu item:', label);
        }

        menu.appendChild(item);
    }

    function addSeparator(){
        const sep = document.createElement('div');
        sep.className = 'context-sep';
        menu.appendChild(sep);
    }

    function showMenu(x, y){
        createMenuContainer();

        // Place the menu immediately at the cursor so it appears where the user clicked.
        // Then use requestAnimationFrame to measure and adjust to prevent overflow.
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';

        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

            let newX = x;
            let newY = y;

            if (newX + rect.width > vw) newX = vw - rect.width - 8;
            if (newY + rect.height > vh) newY = vh - rect.height - 8;
            if (newX < 4) newX = 4;
            if (newY < 4) newY = 4;

            menu.style.left = newX + 'px';
            menu.style.top = newY + 'px';
        });
    }

    function hideMenu(){
        if (!menu) return;
        menu.style.display = 'none';
        hideSubmenu();
    }

    // Global submenu reference
    let submenuElement = null;
    let submenuTimeout = null;

    function hideSubmenu() {
        if (submenuElement) {
            submenuElement.style.display = 'none';
        }
    }

    function showAppSubmenu(parentItem, clickedBoxEl) {
        dlog('showAppSubmenu called', { clickedBoxEl });
        
        // Create submenu if it doesn't exist
        if (!submenuElement) {
            submenuElement = document.createElement('div');
            submenuElement.id = 'context-submenu-apps';
            submenuElement.className = 'context-submenu';
            document.body.appendChild(submenuElement);
        }

        // Build app list
        const appsSource = getApplications();
        const apps = appsSource ? Object.keys(appsSource).map(k => appsSource[k]).sort((a,b) => a.name.l.localeCompare(b.name.l)) : [];
        
        submenuElement.innerHTML = '';
        
        if (!apps || apps.length === 0) {
            const item = submenuElement.appendChild(document.createElement('div'));
            item.className = 'context-item disabled';
            item.textContent = 'No apps available';
        } else {
            apps.forEach(app => {
                const item = submenuElement.appendChild(document.createElement('div'));
                item.className = 'context-item';
                
                // Icon
                if (app.icon) {
                    const img = document.createElement('img');
                    img.src = app.icon.s || app.icon.l || '';
                    img.className = 'icon';
                    item.appendChild(img);
                }
                
                // Label
                const label = document.createElement('span');
                label.textContent = app.name.l;
                item.appendChild(label);
                
                // Click handler
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    try {
                        dlog('Add app clicked from submenu', app.name.s);
                        const grid = getDesktopGrid();
                        
                        if (!grid) {
                            showUserError('Desktop grid not ready');
                            return;
                        }
                        
                        // If clickedBoxEl provided, attach there
                        if (clickedBoxEl && clickedBoxEl.id) {
                            const parts = clickedBoxEl.id.split('-').map(n => parseInt(n));
                            if (parts.length === 2 && grid[parts[0]] && grid[parts[0]][parts[1]]) {
                                const boxInst = grid[parts[0]][parts[1]];
                                if (!boxInst.filled) {
                                    boxInst.attach(app);
                                    showUserSuccess(`${app.name.l} added to desktop`);
                                    dlog('Attached app to clicked box', clickedBoxEl.id, app.name.s);
                                } else {
                                    showUserError('Selected box is already filled');
                                }
                                hideMenu();
                                hideSubmenu();
                                return;
                            }
                        }

                        // Find first empty box
                        let placed = false;
                        for (let r=0; r < grid.length && !placed; r++) {
                            for (let c=0; c < grid[r].length && !placed; c++) {
                                const b = grid[r][c];
                                if (!b.filled) {
                                    b.attach(app);
                                    placed = true;
                                    showUserSuccess(`${app.name.l} added to desktop`);
                                    dlog('Attached app to first empty box', `${r}-${c}`, app.name.s);
                                }
                            }
                        }
                        
                        if (!placed) {
                            showUserError('No empty desktop slots available');
                        }

                        hideMenu();
                        hideSubmenu();
                        // Ask desktop to save/update if available
                        try { if (window.desktopFill) window.desktopFill('update'); } catch(e){ derror('desktopFill update error', e); }
                    } catch (e) {
                        derror('Add app action error', e);
                    }
                });
            });
        }

        // Position submenu next to parent item
        const parentRect = parentItem.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        
        submenuElement.style.display = 'block';
        
        // Position to the right of the menu
        let left = menuRect.right;
        let top = parentRect.top;
        
        // Check if submenu would go off screen
        requestAnimationFrame(() => {
            const subRect = submenuElement.getBoundingClientRect();
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            
            // If goes off right, show on left side instead
            if (left + subRect.width > vw) {
                left = menuRect.left - subRect.width;
            }
            
            // If goes off bottom, adjust up
            if (top + subRect.height > vh) {
                top = vh - subRect.height - 8;
            }
            
            if (top < 4) top = 4;
            if (left < 4) left = 4;
            
            submenuElement.style.left = left + 'px';
            submenuElement.style.top = top + 'px';
        });
    }

    // Build menu items depending on target
    function buildMenuForTarget(target, event){
    createMenuContainer();
    clearMenu();
    dlog('buildMenuForTarget start', { target, tag: target.tagName, classes: target.className });

        // If default context menus are re-enabled, show fallback
        if (disabled) {
            addItem('Enable custom menu', () => {
                localStorage.setItem('wigdos_custom_context_disabled','false');
                disabled = false;
            });
            return;
        }

        // Desktop icon
        const boxEl = target.closest('.dk-grid-box');
        if (boxEl && boxEl.classList.contains('filled')) {
            const id = boxEl.id || '';
            const parts = id.split('-').map(n => parseInt(n));
            let boxInstance;
            const grid = getDesktopGrid();
            
            if (parts.length === 2 && grid && grid[parts[0]] && grid[parts[0]][parts[1]]) {
                boxInstance = grid[parts[0]][parts[1]];
            }
            dlog('Desktop box clicked (filled)', { id, boxInstance });

            addItem('Open', () => {
                try {
                    dlog('Action: Open', boxInstance && boxInstance.app && boxInstance.app.name);
                    if (!boxInstance) {
                        showUserError('Unable to open: Desktop icon not found');
                        return;
                    }
                    if (!boxInstance.app) {
                        showUserError('Unable to open: Application data missing');
                        return;
                    }
                    startApp(boxInstance.app);
                    dlog('Successfully opened app', boxInstance.app.name.s);
                } catch (e) {
                    derror('Open app error', e);
                    showUserError(`Failed to open application: ${e.message}`);
                }
            }, { icon: boxEl.querySelector('img') ? boxEl.querySelector('img').src : null });

            addItem('Rename', () => {
                try {
                    dlog('Action: Rename', boxInstance);
                    if (!boxInstance) {
                        showUserError('Unable to rename: Desktop icon not found');
                        return;
                    }

                    // Force the DKGridBox inline rename flow by ensuring select.count > 1
                    if (!boxInstance.select) boxInstance.select = { count: 0, change: false };
                    boxInstance.select.count = Math.max(boxInstance.select.count || 0, 2);
                    boxInstance.change(true);
                    dlog('Invoked inline rename', boxInstance.pos);
                } catch (e) {
                    derror('Rename error', e);
                    showUserError(`Failed to rename: ${e.message}`);
                }
            }, { icon: null });

            addItem('Remove from desktop', () => {
                try {
                    dlog('Action: Remove from desktop', boxInstance);
                    if (!boxInstance) {
                        showUserError('Unable to remove: Desktop icon not found');
                        return;
                    }

                    const appName = boxInstance.app && boxInstance.app.name ? boxInstance.app.name.l : 'App';
                    
                    // Clear selection state and remove active class BEFORE detaching
                    if (boxInstance.select) {
                        boxInstance.select.active = false;
                        boxInstance.select.count = 0;
                        boxInstance.select.change = false;
                    }
                    boxInstance.element.classList.remove('activeBox');
                    
                    // Call the standard detach (updates UI and saves to localStorage)
                    boxInstance.detach();
                    
                    showUserSuccess(`${appName} removed from desktop`);
                    dlog('Successfully removed app from desktop');
                } catch(e){ 
                    derror('Remove error', e);
                    showUserError(`Failed to remove from desktop: ${e.message}`);
                }
            }, { icon: null });

            // Pin/Unpin to taskbar (quick launch)
            try {
                const pinnedList = getPinnedApps();
                const appId = (boxInstance && boxInstance.app && boxInstance.app.name && boxInstance.app.name.s) ? boxInstance.app.name.s : null;
                const appName = boxInstance && boxInstance.app && boxInstance.app.name ? boxInstance.app.name.l : 'App';
                dlog('Pinned list for this user:', pinnedList, 'detected appId:', appId);
                
                if (appId) {
                    if (!pinnedList.includes(appId)) {
                        addItem('Pin to taskbar', () => {
                            try {
                                dlog('Action: Pin to taskbar', appId);
                                const arr = getPinnedApps();
                                if (!arr.includes(appId)) arr.push(appId);
                                setPinnedApps(arr);
                                showUserSuccess(`${appName} pinned to taskbar`);
                            } catch (e) {
                                derror('Pin error', e);
                                showUserError(`Failed to pin to taskbar: ${e.message}`);
                            }
                        });
                    } else {
                        addItem('Unpin from taskbar', () => {
                            try {
                                dlog('Action: Unpin from taskbar', appId);
                                const arr = getPinnedApps();
                                const i = arr.indexOf(appId);
                                if (i >= 0) arr.splice(i, 1);
                                setPinnedApps(arr);
                                showUserSuccess(`${appName} unpinned from taskbar`);
                            } catch (e) {
                                derror('Unpin error', e);
                                showUserError(`Failed to unpin from taskbar: ${e.message}`);
                            }
                        });
                    }
                }
            } catch(e) {
                derror('Pinned menu build error', e);
            }

            // Pin/Unpin to Start Menu
            try {
                const appId = (boxInstance && boxInstance.app && boxInstance.app.name && boxInstance.app.name.s) ? boxInstance.app.name.s : null;
                const appName = boxInstance && boxInstance.app && boxInstance.app.name ? boxInstance.app.name.l : 'App';
                
                if (appId && window.getStartMenuPinned) {
                    const startMenuPinned = window.getStartMenuPinned();
                    
                    if (!startMenuPinned.includes(appId)) {
                        addItem('Pin to Start Menu', () => {
                            try {
                                dlog('Action: Pin to Start Menu', appId);
                                const arr = window.getStartMenuPinned();
                                if (!arr.includes(appId)) arr.push(appId);
                                window.setStartMenuPinned(arr);
                                showUserSuccess(`${appName} pinned to Start Menu`);
                            } catch (e) {
                                derror('Pin to Start Menu error', e);
                                showUserError(`Failed to pin to Start Menu: ${e.message}`);
                            }
                        });
                    } else {
                        addItem('Unpin from Start Menu', () => {
                            try {
                                dlog('Action: Unpin from Start Menu', appId);
                                const arr = window.getStartMenuPinned();
                                const i = arr.indexOf(appId);
                                if (i >= 0) arr.splice(i, 1);
                                window.setStartMenuPinned(arr);
                                showUserSuccess(`${appName} unpinned from Start Menu`);
                            } catch (e) {
                                derror('Unpin from Start Menu error', e);
                                showUserError(`Failed to unpin from Start Menu: ${e.message}`);
                            }
                        });
                    }
                }
            } catch(e) {
                derror('Start Menu pin menu build error', e);
            }

            addSeparator();
            addItem('Refresh desktop', () => location.reload());
            return;
        }

        // Taskbar app button
        const tbBtn = target.closest('.taskbar-app-btn');
        if (tbBtn) {
            const idx = parseInt(tbBtn.dataset.appIndex);
            const appWin = (window.windows && Array.isArray(window.windows.object)) ? window.windows.object[idx] : null;

            addItem('Restore', () => { try { dlog('Action: Restore', idx); if (appWin && appWin.restore) appWin.restore(); else derror('Restore failed: appWin missing'); } catch(e){ derror(e); } });
            addItem('Minimize', () => { try { dlog('Action: Minimize', idx); if (appWin && appWin.minimize) appWin.minimize(); else derror('Minimize failed: appWin missing'); } catch(e){ derror(e); } });
            addItem('Close', () => { try { dlog('Action: Close', idx); if (appWin && appWin.close) appWin.close(); else derror('Close failed: appWin missing'); } catch(e){ derror(e); } });
            addSeparator();
            addItem('Taskbar settings...', () => { try { if (window.openTaskbarSettings) window.openTaskbarSettings(); else alert('Taskbar settings not available.'); } catch(e){ console.error(e); } });
            return;
        }

        // Empty desktop box or main area -> offer Add App
        const emptyBox = target.closest('.dk-grid-box');
        const clickedOnMain = target.closest('main') && !target.closest('footer') && !target.closest('#smBox');
        if ((emptyBox && !emptyBox.classList.contains('filled')) || clickedOnMain) {
            const appItem = menu.appendChild(document.createElement('div'));
            appItem.className = 'context-item context-item-submenu';
            appItem.setAttribute('role', 'menuitem');
            appItem.tabIndex = 0;
            
            const text = document.createElement('span');
            text.textContent = 'Add app to desktop';
            appItem.appendChild(text);
            
            const arrow = document.createElement('span');
            arrow.className = 'submenu-arrow';
            arrow.textContent = '▶';
            appItem.appendChild(arrow);
            
            // Show submenu on hover
            appItem.addEventListener('mouseenter', () => {
                clearTimeout(submenuTimeout);
                showAppSubmenu(appItem, emptyBox);
            });
            
            appItem.addEventListener('mouseleave', (e) => {
                // Only hide if not moving to submenu
                submenuTimeout = setTimeout(() => {
                    if (submenuElement && !submenuElement.matches(':hover') && !appItem.matches(':hover')) {
                        hideSubmenu();
                    }
                }, 200);
            });
            
            addSeparator();
            addItem('Refresh', () => location.reload());
            return;
        }

        // Pinned quick-access icon (qa_icon) right-click
        const qa = target.closest('.qa_icon');
        if (qa) {
            const appId = qa.dataset && qa.dataset.app ? qa.dataset.app : null;
            if (appId) {
                addItem('Unpin from taskbar', () => {
                    try {
                        dlog('Action: Unpin from taskbar (qa_icon)', appId);
                        const arr = getPinnedApps();
                        const idx = arr.indexOf(appId);
                        if (idx >= 0) arr.splice(idx, 1);
                        setPinnedApps(arr);
                        showUserSuccess('App unpinned from taskbar');
                    } catch (e) { 
                        derror('Unpin error', e);
                        showUserError(`Failed to unpin: ${e.message}`);
                    }
                });
            }
            return;
        }

        // Start menu / other UI specific
        const sm = target.closest('#smBox');
        if (sm) {
            // If right-clicking a Start Menu app item, offer Pin/Unpin actions
            const smItem = target.closest('.smLeftItem, .smRightItem');
            if (smItem) {
                const appId = smItem.dataset && smItem.dataset.appKey ? smItem.dataset.appKey : null;
                const appName = (appId && window.applications && window.applications[appId] && window.applications[appId].name) ? window.applications[appId].name.l : (smItem.textContent || 'App');

                if (appId && window.getStartMenuPinned && window.setStartMenuPinned) {
                    try {
                        const startPinned = window.getStartMenuPinned();
                        if (startPinned.includes(appId)) {
                            addItem('Unpin from Start Menu', () => {
                                try {
                                    dlog('Action: Unpin from Start Menu (SM item)', appId);
                                    const arr = window.getStartMenuPinned();
                                    const i = arr.indexOf(appId);
                                    if (i >= 0) arr.splice(i, 1);
                                    window.setStartMenuPinned(arr);
                                    showUserSuccess(`${appName} unpinned from Start Menu`);
                                } catch (e) { derror('Unpin SM item error', e); showUserError(`Failed to unpin from Start Menu: ${e.message}`); }
                            });
                        } else {
                            addItem('Pin to Start Menu', () => {
                                try {
                                    dlog('Action: Pin to Start Menu (SM item)', appId);
                                    const arr = window.getStartMenuPinned();
                                    if (!arr.includes(appId)) arr.push(appId);
                                    window.setStartMenuPinned(arr);
                                    showUserSuccess(`${appName} pinned to Start Menu`);
                                } catch (e) { derror('Pin SM item error', e); showUserError(`Failed to pin to Start Menu: ${e.message}`); }
                            });
                        }
                    } catch (e) { derror('Start Menu item pin menu build error', e); }
                }
            }

            addItem('Refresh', () => location.reload());
            return;
        }

        // Generic page menu
        addItem('Refresh', () => location.reload());
        addItem('Toggle context debug', () => {
            try {
                const cur = localStorage.getItem('wigdos_context_debug') === 'true';
                localStorage.setItem('wigdos_context_debug', (!cur).toString());
                alert('Context menu debug set to: ' + (!cur));
            } catch(e){ console.error(e); }
        });
    }

    // Document listeners
    // Use capture phase so our handler runs before other potential handlers and
    // prevent the native menu reliably for supported targets.
    document.addEventListener('contextmenu', (event) => {
        // Allow context menu for form inputs to preserve UX
        const formEl = event.target.closest('input, textarea');
        if (formEl) return; // fallback to browser default

        if (localStorage.getItem('wigdos_custom_context_disabled') === 'true') return; // let native menu appear
        // Prevent other handlers and the native menu
        try { event.stopPropagation(); } catch (e) {}
        try { event.preventDefault(); } catch (e) {}

        try {
            buildMenuForTarget(event.target, event);
            showMenu(event.clientX, event.clientY);
        } catch (e) { console.error('Failed to show custom context menu', e); }
    }, { capture: true });

    document.addEventListener('mousedown', (event) => {
        if (menu && !menu.contains(event.target) && (!submenuElement || !submenuElement.contains(event.target))) {
            hideMenu();
        }
    });

    window.addEventListener('blur', hideMenu);
    window.addEventListener('resize', hideMenu);
    
    // Keep submenu open when hovering over it
    document.addEventListener('mouseover', (event) => {
        if (submenuElement && submenuElement.contains(event.target)) {
            clearTimeout(submenuTimeout);
        }
    });
    
    // Keyboard support for context menu
    document.addEventListener('keydown', (e) => {
        if (!menu || menu.style.display === 'none') return;
        
        if (e.key === 'Escape') {
            hideMenu();
            e.preventDefault();
            return;
        }
        
        // Arrow key navigation
        const items = Array.from(menu.querySelectorAll('.context-item:not(.disabled)'));
        if (items.length === 0) return;
        
        const focused = document.activeElement;
        const currentIndex = items.indexOf(focused);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[prevIndex].focus();
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            e.preventDefault();
            items[currentIndex].click();
        }
    });

    // Initialize
    createMenuContainer();
    
    // Validate dependencies
    setTimeout(() => {
        validateDependencies();
    }, 1000);
    
    // Context menu exposes internal helpers only; do NOT overwrite global pinned helpers
    // (taskbar.js provides global getPinnedApps/setPinnedApps used by the rest of the UI)
    console.debug('[Context Menu] Initialized with keyboard support and validation');
})();
