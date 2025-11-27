(function(){
    const MODAL_ID = 'taskbar-settings-modal';
    const OVERLAY_ID = 'taskbar-settings-overlay';

    function createModal(){
        if (document.getElementById(MODAL_ID)) return;

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        document.body.appendChild(overlay);

        // Modal
        const modal = document.createElement('div');
        modal.id = MODAL_ID;

        const title = modal.appendChild(document.createElement('h3'));
        title.innerText = 'Taskbar settings';

        const desc = modal.appendChild(document.createElement('p'));
        desc.innerText = 'Pin/unpin apps and reorder the pinned icons shown on the left of the taskbar.';

        const list = modal.appendChild(document.createElement('div'));
        list.className = 'ts-list';
        list.id = MODAL_ID + '-list';

        const controls = modal.appendChild(document.createElement('div'));
        controls.className = 'ts-controls';

        const btnCancel = controls.appendChild(document.createElement('button'));
        btnCancel.innerText = 'Cancel';
        btnCancel.onclick = hideModal;

        const btnSave = controls.appendChild(document.createElement('button'));
        btnSave.innerText = 'Save';
        btnSave.onclick = saveAndClose;

        document.body.appendChild(modal);

        overlay.addEventListener('click', hideModal);
    }

    function getAllApps(){
        // applications is a global map created elsewhere. Convert to array sorted by display name
        try {
            if (!window.applications) return [];
            return Object.keys(window.applications).map(k => window.applications[k]).sort((a,b) => a.name.l.localeCompare(b.name.l));
        } catch (e) { return []; }
    }

    function getPinned(){
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
            return ['notes','files']; // defaults
        } catch { return ['notes','files']; }
    }

    function setPinned(arr){
        try {
            if (localStorage.getItem("layout") && window.getUser && window.getUser() != "guest") {
                let layout = JSON.parse(localStorage.getItem("layout"));
                
                // Handle old format migration
                if (Array.isArray(layout)) {
                    layout = { desktopGrid: layout, taskbarPinned: ['notes', 'files'], initialized: true };
                }
                
                layout.taskbarPinned = arr;
                localStorage.setItem("layout", JSON.stringify(layout));
            }
        } catch(e){ console.error(e); }
    }

    function openModal(){
        createModal();
        const overlay = document.getElementById(OVERLAY_ID);
        const modal = document.getElementById(MODAL_ID);
        const list = document.getElementById(MODAL_ID + '-list');
        list.innerHTML = '';

        const apps = getAllApps();
        const pinned = getPinned();

        // Build list: pinned apps first (in order), then rest
        const ordered = [];
        pinned.forEach(id => {
            const found = apps.find(a => a.name.s === id);
            if (found) ordered.push(found);
        });
        apps.forEach(a => { if (!ordered.includes(a)) ordered.push(a); });

        ordered.forEach((app, idx) => {
            const item = list.appendChild(document.createElement('div'));
            item.className = 'ts-item';

            const img = item.appendChild(document.createElement('img'));
            img.src = app.icon ? (app.icon.s || app.icon.l || '') : '';

            const label = item.appendChild(document.createElement('div'));
            label.innerText = app.name.l;

            const actions = item.appendChild(document.createElement('div'));
            actions.className = 'ts-actions';

            const btnPin = actions.appendChild(document.createElement('button'));
            btnPin.innerText = pinned.includes(app.name.s) ? 'Unpin' : 'Pin';
            btnPin.onclick = () => {
                const p = getPinned();
                if (p.includes(app.name.s)) {
                    const i = p.indexOf(app.name.s); if (i >= 0) p.splice(i,1);
                } else p.push(app.name.s);
                setPinned(p);
                openModal(); // refresh UI
            };

            const btnUp = actions.appendChild(document.createElement('button'));
            btnUp.innerText = '↑';
            btnUp.disabled = (idx === 0);
            btnUp.title = 'Move up';
            btnUp.onclick = () => {
                const p = getPinned();
                // To move relative position, ensure app is in pinned list; if not, add at end
                if (!p.includes(app.name.s)) p.push(app.name.s);
                const i = p.indexOf(app.name.s);
                if (i > 0) { [p[i-1], p[i]] = [p[i], p[i-1]]; setPinned(p); }
                openModal();
            };

            const btnDown = actions.appendChild(document.createElement('button'));
            btnDown.innerText = '↓';
            btnDown.disabled = (idx >= ordered.length - 1);
            btnDown.title = 'Move down';
            btnDown.onclick = () => {
                const p = getPinned();
                if (!p.includes(app.name.s)) p.push(app.name.s);
                const i = p.indexOf(app.name.s);
                if (i >= 0 && i < p.length - 1) { [p[i+1], p[i]] = [p[i], p[i+1]]; setPinned(p); }
                openModal();
            };
        });

        overlay.style.display = 'block';
        modal.style.display = 'block';
    }

    function hideModal(){
        const overlay = document.getElementById(OVERLAY_ID);
        const modal = document.getElementById(MODAL_ID);
        if (overlay) overlay.style.display = 'none';
        if (modal) modal.style.display = 'none';
    }

    function saveAndClose(){
        // Pinned list is already saved on each toggle/move. Trigger the taskbar to reload.
        try { if (window.taskbarReloadPinned) window.taskbarReloadPinned(); } catch(e){console.error(e);} 
        hideModal();

        // Attempt Firebase sync if available
        try {
            if (window.firebaseAPI && window.getUser && window.getUser() !== 'guest') {
                const { db, setDoc, doc } = window.firebaseAPI;
                (async ()=>{
                    const p = getPinned();
                    try { await setDoc(doc(db, 'users', window.getUser()), { taskbar: JSON.stringify(p) }, { merge: true }); } catch(e){ console.error('Failed to sync taskbar to firebase', e); }
                })();
            }
        } catch(e){/* noop */}
    }

    // Expose globally
    window.openTaskbarSettings = openModal;
})();
