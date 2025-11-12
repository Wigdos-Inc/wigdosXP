// ============================================================================
// Minimized Bar - Minimized Window Thumbnails
// ============================================================================

let minimizedBar = null;

function ensureMinimizedBar() {
    if (minimizedBar) return;
    try {
        let footer = document.getElementsByTagName('footer')[0];
        minimizedBar = UIBuilder.div({
            id: 'minimized_bar',
            styles: {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px',
                marginRight: '8px'
            }
        });
        
        if (footer) {
            footer.insertBefore(minimizedBar, footer.firstChild);
        } else {
            // Fallback: append to body, positioned above the bottom so it doesn't overlap other UI
            UIBuilder.applyStyles(minimizedBar, {
                position: 'fixed',
                right: '8px',
                bottom: '8px',
                zIndex: '9999'
            });
            document.body.appendChild(minimizedBar);
        }
    } catch (e) { minimizedBar = null; }
}

function createMinimizedButton(w) {
    const btn = UIBuilder.div({
        classes: 'min_thumb',
        styles: {
            width: '120px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: '#e9eefc',
            cursor: 'pointer'
        }
    });

    const img = UIBuilder.img(
        (w.app && w.app.icon && w.app.icon.s) ? w.app.icon.s : 'assets/images/icons/16x/bombs.png',
        {
            styles: {
                width: '20px',
                height: '20px',
                objectFit: 'contain'
            }
        }
    );

    const label = UIBuilder.div({
        textContent: (w.app && w.app.name && w.app.name.l) ? w.app.name.l : ('App ' + (w.index||'')),
        styles: {
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '76px'
        }
    });

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
            setTimeout(() => renderMinimized(window.windowManager.getWindows()), 80);
        }, 80);
    });

    setupMinimizedPreview(btn, w);

    return btn;
}

function setupMinimizedPreview(btn, w) {
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
        if (preview) { 
            UIBuilder.hide(preview);
            preview.dataset.shown = 'false';
        }
    });
}

function renderMinimized(windows) {
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
        const btn = createMinimizedButton(w);
        minimizedBar.appendChild(btn);
    });
}

function addMinimized(appWindow) {
    ensureMinimizedBar();
    renderMinimized(window.windowManager.getWindows());
}

function removeMinimized(appWindow) {
    renderMinimized(window.windowManager.getWindows());
}

function ensurePreview() {
    let p = document.getElementById('wm_preview');
    if (!p) {
        p = UIBuilder.div({ id: 'wm_preview' });
        document.body.appendChild(p);
    }
    return p;
}

function showPreview(previewEl, dataUrl, x, y, w) {
    if (!previewEl) previewEl = ensurePreview();
    previewEl.innerHTML = '';
    if (dataUrl) {
        const img = UIBuilder.img(dataUrl, {
            styles: { width: '100%', height: '100%', objectFit: 'cover' }
        });
        previewEl.appendChild(img);
    } else if (w && w.app && w.app.icon && w.app.icon.s) {
        const img = UIBuilder.img(w.app.icon.s, {
            styles: { width: '100%', height: '100%', objectFit: 'contain' }
        });
        previewEl.appendChild(img);
    } else {
        previewEl.innerText = w && w.app && w.app.name && w.app.name.l ? w.app.name.l : 'Preview';
    }
    previewEl.style.left = `${Math.min(window.innerWidth - 260, x + 12)}px`;
    previewEl.style.top = `${Math.max(8, y - 160)}px`;
    UIBuilder.show(previewEl);
    previewEl.dataset.shown = 'true';
}

// Expose globally
window.MinimizedBar = {
    ensureMinimizedBar,
    renderMinimized,
    addMinimized,
    removeMinimized,
    ensurePreview,
    showPreview
};
