// Simple WindowManager
// Responsibilities:
// - Register and unregister AppWindow instances
// - Manage stacking order (z-index) centrally
// - Provide bringToFront API

const windowManager = (function(){
    const windows = [];
    let topZ = 10;
    const snapThreshold = 16; // px

    function register(appWindow) {
        if (!appWindow || typeof appWindow.index === 'undefined') return;
        // Avoid duplicate registration
        if (windows.find(w => w && w.index === appWindow.index)) return;
        windows.push(appWindow);
        // Ensure newly registered window is on top
        bringToFront(appWindow);
    }

    function unregister(appWindow) {
        const idx = windows.findIndex(w => w === appWindow || (w && w.index === appWindow.index));
        if (idx !== -1) windows.splice(idx, 1);
    }

    function bringToFront(appWindow) {
        topZ++;
        if (appWindow && appWindow.element) appWindow.element.style.zIndex = topZ;
        // Mark focused state for convenience
        windows.forEach(w => {
            if (!w || !w.element) return;
            if (w === appWindow) w.element.classList.add('focused');
            else w.element.classList.remove('focused');
        });
    }

    function getWindows() { return windows.slice(); }

    // Basic placeholder for global shortcuts integration
    function initGlobalShortcuts() {
        // Example: Alt+1..9 jump to app windows
        document.addEventListener('keydown', (e) => {
            // Alt+Number to focus nth window
            if (e.altKey) {
                const k = parseInt(e.key, 10);
                if (!isNaN(k)) {
                    const w = windows[k-1];
                    if (w) bringToFront(w);
                    return;
                }
            }

            // Arrow keys to nudge focused window (when not typing into an input)
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

            const focused = windows.find(w => w && w.element && w.element.classList.contains('focused'));
            if (!focused) return;

            const step = e.shiftKey ? 50 : 10;
            if (e.key === 'ArrowLeft') { nudgeWindow(focused, -step, 0); e.preventDefault(); }
            if (e.key === 'ArrowRight') { nudgeWindow(focused, step, 0); e.preventDefault(); }
            if (e.key === 'ArrowUp') { nudgeWindow(focused, 0, -step); e.preventDefault(); }
            if (e.key === 'ArrowDown') { nudgeWindow(focused, 0, step); e.preventDefault(); }
        });
    }

    function nudgeWindow(appWindow, dx, dy) {
        if (!appWindow || !appWindow.element) return;
        try {
            const rect = appWindow.element.getBoundingClientRect();
            const curLeft = rect.left;
            const curTop = rect.top;
            const newLeft = Math.max(0, curLeft + dx);
            const newTop = Math.max(0, curTop + dy);
            appWindow.element.style.left = `${newLeft}px`;
            appWindow.element.style.top = `${newTop}px`;
            // Update stored geometry
            appWindow.move.storage.x = newLeft;
            appWindow.move.storage.y = newTop;
        } catch (e) { /* noop */ }
    }

    function maybeSnap(appWindow) {
        if (!appWindow || !appWindow.element) return;
        try {
            const rect = appWindow.element.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            let snapped = false;

            // Left
            if (rect.left <= snapThreshold) {
                appWindow.element.style.left = `0px`;
                appWindow.move.storage.x = 0;
                snapped = true;
            }
            // Top
            if (rect.top <= snapThreshold) {
                appWindow.element.style.top = `0px`;
                appWindow.move.storage.y = 0;
                snapped = true;
            }
            // Right
            if (vw - (rect.left + rect.width) <= snapThreshold) {
                const left = Math.max(0, vw - rect.width);
                appWindow.element.style.left = `${left}px`;
                appWindow.move.storage.x = left;
                snapped = true;
            }
            // Bottom
            if (vh - (rect.top + rect.height) <= snapThreshold) {
                const top = Math.max(0, vh - rect.height);
                appWindow.element.style.top = `${top}px`;
                appWindow.move.storage.y = top;
                snapped = true;
            }

            return snapped;
        } catch (e) { return false; }
    }

    // Manager UI
    let uiOpen = false;
    let uiButton = null;
    let uiPanel = null;
    let minimizedBar = null;

    function createUI() {
        // Floating button
        uiButton = document.createElement('div');
        uiButton.id = 'wm_button';
        uiButton.title = 'Window Manager';
        uiButton.style.position = 'fixed';
        uiButton.style.right = '12px';
        uiButton.style.bottom = '12px';
        uiButton.style.width = '36px';
        uiButton.style.height = '36px';
        uiButton.style.borderRadius = '6px';
        uiButton.style.background = '#2f6bf2';
        uiButton.style.color = '#fff';
        uiButton.style.display = 'flex';
        uiButton.style.alignItems = 'center';
        uiButton.style.justifyContent = 'center';
        uiButton.style.cursor = 'pointer';
        uiButton.innerText = 'WM';
        document.body.appendChild(uiButton);

        uiButton.addEventListener('click', () => {
            if (uiOpen) closeUI(); else openUI();
        });
    }

    function ensureMinimizedBar() {
        if (minimizedBar) return;
        try {
            let footer = document.getElementsByTagName('footer')[0];
            minimizedBar = document.createElement('div');
            minimizedBar.id = 'minimized_bar';
            minimizedBar.style.display = 'flex';
            minimizedBar.style.alignItems = 'center';
            minimizedBar.style.gap = '6px';
            minimizedBar.style.padding = '4px';
            minimizedBar.style.marginRight = '8px';
            if (footer) {
                footer.insertBefore(minimizedBar, footer.firstChild);
            } else {
                // Fallback: append to body, positioned above the bottom so it doesn't overlap other UI
                minimizedBar.style.position = 'fixed';
                minimizedBar.style.right = '8px';
                minimizedBar.style.bottom = '8px';
                minimizedBar.style.zIndex = 9999;
                document.body.appendChild(minimizedBar);
            }
        } catch (e) { minimizedBar = null; }
    }

    function renderMinimized() {
        if (!minimizedBar) {
            try { ensureMinimizedBar(); } catch (e) { return; }
            if (!minimizedBar) return;
        }
        // Dedupe by index to avoid duplicates after fast restore/close cycles
        const minsMap = {};
        const mins = [];
        windows.forEach(w => { if (w && w.minimized && !minsMap[w.index]) { minsMap[w.index] = true; mins.push(w); } });
        minimizedBar.innerHTML = '';
        mins.forEach(w => {
            const btn = document.createElement('div');
            btn.classList.add('min_thumb');
            btn.style.width = '120px';
            btn.style.height = '28px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '8px';
            btn.style.padding = '4px';
            btn.style.border = '1px solid rgba(0,0,0,0.1)';
            btn.style.background = '#e9eefc';
            btn.style.cursor = 'pointer';

            const img = document.createElement('img');
            img.style.width = '20px';
            img.style.height = '20px';
            img.style.objectFit = 'contain';
            img.src = (w.app && w.app.icon && w.app.icon.s) ? w.app.icon.s : 'assets/images/icons/16x/bombs.png';

            const label = document.createElement('div');
            label.innerText = (w.app && w.app.name && w.app.name.l) ? w.app.name.l : ('App ' + (w.index||''));
            label.style.fontSize = '12px';
            label.style.whiteSpace = 'nowrap';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.maxWidth = '76px';

            btn.appendChild(img);
            btn.appendChild(label);

            btn.addEventListener('click', (e) => {
                // Prevent any outer handlers (like restore menus) from interfering
                e.stopPropagation();
                // Defer restore slightly to avoid races with background close/save handlers
                setTimeout(() => {
                    try {
                        // If the window has been removed from DOM (closed), re-registering is unnecessary.
                        if (w._closing) return;
                        w.restore();
                    } catch (err) {}
                    // re-render after restore
                    setTimeout(() => renderMinimized(), 80);
                }, 80);
            });

            // Hover preview: request a snapshot from same-origin iframe if possible
            btn.addEventListener('mouseenter', async (ev) => {
                const preview = ensurePreview();
                try {
                    // Try to request a snapshot from the iframe via postMessage
                    if (w.iframe && w.iframe.contentWindow && w.iframe.src && w.iframe.src.startsWith(window.location.origin)) {
                        const msgId = `snap_${w.index}_${Date.now()}`;
                        const handler = (evt) => {
                            if (evt.data && evt.data.type === 'snapshotResponse' && evt.data.messageId === msgId) {
                                window.removeEventListener('message', handler);
                                showPreview(preview, evt.data.dataUrl, ev.clientX, ev.clientY, w);
                            }
                        };
                        window.addEventListener('message', handler);
                        w.iframe.contentWindow.postMessage({ type: 'requestSnapshot', messageId: msgId }, '*');
                        // fallback to icon after 400ms if no response
                        setTimeout(() => {
                            if (preview.dataset.shown !== 'true') showPreview(preview, null, ev.clientX, ev.clientY, w);
                        }, 400);
                    } else {
                        showPreview(preview, null, ev.clientX, ev.clientY, w);
                    }
                } catch (err) { showPreview(preview, null, ev.clientX, ev.clientY, w); }
            });

            btn.addEventListener('mouseleave', () => {
                const preview = document.getElementById('wm_preview');
                if (preview) { preview.style.display = 'none'; preview.dataset.shown = 'false'; }
            });

            minimizedBar.appendChild(btn);
        });
    }

    function addMinimized(appWindow) {
        ensureMinimizedBar();
        renderMinimized();
    }

    function removeMinimized(appWindow) {
        renderMinimized();
    }

    function ensurePreview() {
        let p = document.getElementById('wm_preview');
        if (!p) {
            p = document.createElement('div'); p.id = 'wm_preview';
            document.body.appendChild(p);
        }
        return p;
    }

    function showPreview(previewEl, dataUrl, x, y, w) {
        if (!previewEl) previewEl = ensurePreview();
        previewEl.innerHTML = '';
        if (dataUrl) {
            const img = document.createElement('img');
            img.src = dataUrl; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
            previewEl.appendChild(img);
        } else if (w && w.app && w.app.icon && w.app.icon.s) {
            const img = document.createElement('img'); img.src = w.app.icon.s; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain'; previewEl.appendChild(img);
        } else {
            previewEl.innerText = w && w.app && w.app.name && w.app.name.l ? w.app.name.l : 'Preview';
        }
        previewEl.style.left = `${Math.min(window.innerWidth - 260, x + 12)}px`;
        previewEl.style.top = `${Math.max(8, y - 160)}px`;
        previewEl.style.display = 'block';
        previewEl.dataset.shown = 'true';
    }

    function openUI() {
        if (uiOpen) return; uiOpen = true;
        uiPanel = document.createElement('div');
        uiPanel.id = 'wm_panel';
        uiPanel.style.position = 'fixed';
        uiPanel.style.right = '12px';
        uiPanel.style.bottom = '60px';
        uiPanel.style.width = '260px';
        uiPanel.style.maxHeight = '360px';
        uiPanel.style.overflowY = 'auto';
        uiPanel.style.background = '#fff';
        uiPanel.style.border = '1px solid #ccc';
        uiPanel.style.padding = '8px';
        uiPanel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
        document.body.appendChild(uiPanel);

        renderUIPanel();
    }

    function closeUI() {
        if (!uiOpen) return; uiOpen = false;
        if (uiPanel) uiPanel.remove(); uiPanel = null;
    }

    function renderUIPanel() {
        if (!uiPanel) return;
        uiPanel.innerHTML = '';
        const title = uiPanel.appendChild(document.createElement('div'));
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '6px';
        title.innerText = 'Open Windows';

        const list = uiPanel.appendChild(document.createElement('div'));

        windows.forEach((w, i) => {
            if (!w) return;
            const row = list.appendChild(document.createElement('div'));
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '6px 4px';
            row.style.borderBottom = '1px solid #eee';

            const label = row.appendChild(document.createElement('div'));
            label.innerText = `${w.app && w.app.name ? w.app.name.l : ('app#'+(w.index||i))}`;
            label.style.flex = '1';

            const actions = row.appendChild(document.createElement('div'));
            actions.style.display = 'flex';
            actions.style.gap = '6px';

            const focusBtn = actions.appendChild(document.createElement('button'));
            focusBtn.innerText = 'Front';
            focusBtn.onclick = () => { bringToFront(w); };

            const miniBtn = actions.appendChild(document.createElement('button'));
            miniBtn.innerText = w.minimized ? 'Restore' : 'Min';
            miniBtn.onclick = () => { if (w.minimized) w.restore(); else w.minimize(); renderUIPanel(); };

            const closeBtn = actions.appendChild(document.createElement('button'));
            closeBtn.innerText = 'Close';
            closeBtn.onclick = () => { w.close(); renderUIPanel(); };
        });
    }

    // Auto create the UI button
    if (typeof document !== 'undefined') {
        try { createUI(); } catch (e) { /* noop */ }
    }

    // Auto-init shortcuts
    initGlobalShortcuts();

    return { register, unregister, bringToFront, getWindows, maybeSnap, addMinimized, removeMinimized };
})();

window.windowManager = window.windowManager || windowManager;
