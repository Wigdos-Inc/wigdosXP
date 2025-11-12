// ============================================================================
// Window Manager UI - Management Panel
// ============================================================================

let uiOpen = false;
let uiButton = null;
let uiPanel = null;

function createUI() {
    // Floating button
    uiButton = UIBuilder.div({
        id: 'wm_button',
        textContent: 'WM',
        styles: {
            position: 'fixed',
            right: '12px',
            bottom: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: '#2f6bf2',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
        }
    });
    uiButton.title = 'Window Manager';
    document.body.appendChild(uiButton);

    uiButton.addEventListener('click', () => {
        if (uiOpen) closeUI(); else openUI();
    });
}

function openUI() {
    if (uiOpen) return; 
    uiOpen = true;
    
    uiPanel = UIBuilder.div({
        id: 'wm_panel',
        styles: {
            position: 'fixed',
            right: '12px',
            bottom: '60px',
            width: '260px',
            maxHeight: '360px',
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
        }
    });
    document.body.appendChild(uiPanel);

    renderUIPanel();
}

function closeUI() {
    if (!uiOpen) return; 
    uiOpen = false;
    if (uiPanel) uiPanel.remove(); 
    uiPanel = null;
}

function renderUIPanel() {
    if (!uiPanel) return;
    uiPanel.innerHTML = '';
    
    const title = UIBuilder.div({
        textContent: 'Open Windows',
        styles: {
            fontWeight: 'bold',
            marginBottom: '6px'
        }
    });
    uiPanel.appendChild(title);

    const list = UIBuilder.div();
    uiPanel.appendChild(list);

    const windows = window.windowManager.getWindows();
    windows.forEach((w, i) => {
        if (!w) return;
        
        const row = UIBuilder.div({
            styles: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 4px',
                borderBottom: '1px solid #eee'
            }
        });

        const label = UIBuilder.div({
            textContent: `${w.app && w.app.name ? w.app.name.l : ('app#'+(w.index||i))}`,
            styles: { flex: '1' }
        });
        row.appendChild(label);

        const actions = UIBuilder.div({
            styles: {
                display: 'flex',
                gap: '6px'
            }
        });

        const focusBtn = document.createElement('button');
        focusBtn.innerText = 'Front';
        focusBtn.onclick = () => { window.windowManager.bringToFront(w); };
        actions.appendChild(focusBtn);

        const miniBtn = document.createElement('button');
        miniBtn.innerText = w.minimized ? 'Restore' : 'Min';
        miniBtn.onclick = () => { if (w.minimized) w.restore(); else w.minimize(); renderUIPanel(); };
        actions.appendChild(miniBtn);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Close';
        closeBtn.onclick = () => { w.close(); renderUIPanel(); };
        actions.appendChild(closeBtn);

        row.appendChild(actions);
        list.appendChild(row);
    });
}

// Auto create the UI button
if (typeof document !== 'undefined') {
    try { createUI(); } catch (e) { /* noop */ }
}

// Expose globally
window.WindowManagerUI = {
    createUI,
    openUI,
    closeUI,
    renderUIPanel
};
