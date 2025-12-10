/* Loading SFX */

function playerrorSound() {

    // Returns the Audio to what Called the Function, Allowing Onended to be Used There

// Simple drag preview helpers used by Start Menu / Taskbar / File Explorer
window.createDragPreview = function(app, event) {
    try {
        if (!app) return;
        // Remove existing preview
        window.removeDragPreview();

        const preview = document.createElement('div');
        preview.id = 'desktop-drag-preview';
        preview.style.position = 'fixed';
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '10000';
        preview.style.opacity = '0.9';
        preview.style.display = 'flex';
        preview.style.flexDirection = 'column';
        preview.style.alignItems = 'center';
        preview.style.gap = '4px';
        preview.style.width = '70px';

        const icon = document.createElement('img');
        icon.src = app.icon ? (app.icon.l || app.icon.s || '') : '';
        icon.style.width = '48px';
        icon.style.height = '48px';
        icon.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))';
        preview.appendChild(icon);

        const label = document.createElement('div');
        label.textContent = app.name ? (app.name.d || app.name.l || app.name.s) : 'App';
        label.style.fontSize = '11px';
        label.style.color = 'white';
        label.style.textAlign = 'center';
        label.style.textShadow = '1px 1px 2px black';
        label.style.maxWidth = '70px';
        preview.appendChild(label);

        document.body.appendChild(preview);

        // Position immediately
        if (event && event.clientX !== undefined) {
            preview.style.left = (event.clientX + 10) + 'px';
            preview.style.top = (event.clientY + 10) + 'px';
        } else {
            preview.style.left = '10px';
            preview.style.top = '10px';
        }
    } catch (e) {
        console.error('[createDragPreview] error', e);
    }
};

window.removeDragPreview = function() {
    try {
        const el = document.getElementById('desktop-drag-preview');
        if (el) el.remove();
    } catch (e) { /* noop */ }
};

// Enable dropping onto the Start Menu element: accepts drag data and pins app to Start Menu
window.enableStartMenuDrop = function(smElement) {
    try {
        if (!smElement) return;

        const onDragOver = function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        };

        const onDrop = function(e) {
            e.preventDefault();
            try {
                const raw = e.dataTransfer.getData('wigdos/app') || e.dataTransfer.getData('text/plain');
                let parsed = null;
                try { parsed = JSON.parse(raw); } catch(_) { parsed = raw; }

                let appKey = null;
                if (parsed && typeof parsed === 'object' && parsed.appKey) appKey = parsed.appKey;
                else if (typeof parsed === 'string') appKey = parsed;

                if (appKey && window.getStartMenuPinned && window.setStartMenuPinned) {
                    const arr = window.getStartMenuPinned();
                    if (!arr.includes(appKey)) {
                        arr.push(appKey);
                        window.setStartMenuPinned(arr);
                    }
                }
            } catch (err) { console.error('[enableStartMenuDrop] drop handler error', err); }
        };

        // Store refs so disable can remove them
        smElement.__wigdos_dragover = onDragOver;
        smElement.__wigdos_drop = onDrop;
        smElement.addEventListener('dragover', onDragOver);
        smElement.addEventListener('drop', onDrop);
    } catch (e) { console.error('[enableStartMenuDrop]', e); }
};

window.disableStartMenuDrop = function(smElement) {
    try {
        if (!smElement) return;
        if (smElement.__wigdos_dragover) smElement.removeEventListener('dragover', smElement.__wigdos_dragover);
        if (smElement.__wigdos_drop) smElement.removeEventListener('drop', smElement.__wigdos_drop);
        delete smElement.__wigdos_dragover;
        delete smElement.__wigdos_drop;
    } catch (e) { console.error('[disableStartMenuDrop]', e); }
};
    return new Promise((resolve) => {

        const audio = new Audio('assets/sfx/error.mp3');
        // Attempt to play; swallow errors (missing file or unsupported) so UI flow isn't blocked
        try {
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    audio.onended = () => resolve(audio);
                }).catch((err) => {
                    console.warn('[playerrorSound] audio.play() failed', err);
                    // Resolve anyway to avoid unhandled promise rejection
                    resolve(audio);
                });
            } else {
                // No promise returned (older browsers), fallback to onended
                audio.onended = () => resolve(audio);
            }
        } catch (err) {
            console.warn('[playerrorSound] audio.play() threw', err);
            resolve(audio);
        }
    });
}

try {
} catch (error) {
    console.error(error.message);
    playerrorSound(); 
}


function getUser() {

    // Return 'guest' when no username is set to avoid null checks throughout the codebase
    return localStorage.getItem("username") || 'guest';
}

// Profile Picture Management
function getUserProfilePicture(username) {
    if (!username || username === 'guest') {
        return null;
    }
    // Get from localStorage cache first
    const cached = localStorage.getItem(`pfp_${username}`);
    if (cached) {
        return cached;
    }
    return null;
}

async function setUserProfilePicture(imageDataUrl) {
    const username = getUser();
    if (!username || username === 'guest') {
        return false;
    }
    
    try {
        // Save to localStorage cache
        localStorage.setItem(`pfp_${username}`, imageDataUrl);
        
        // Save to Firebase if available
        if (window.firebaseAPI && window.firebaseAPI.db && window.firebaseOnline) {
            const { doc, setDoc } = window.firebaseAPI;
            await setDoc(doc(window.firebaseAPI.db, "users", username), {
                profilePicture: imageDataUrl
            }, { merge: true });
            console.log('Profile picture saved to Firebase');
        }
        
        return true;
    } catch (error) {
        console.error('Error setting profile picture:', error);
        return false;
    }
}

async function loadUserProfilePicture(username) {
    if (!username || username === 'guest') {
        return null;
    }
    
    // Try Firebase first if available
    if (window.firebaseAPI && window.firebaseAPI.db && window.firebaseOnline) {
        try {
            const { doc, getDoc } = window.firebaseAPI;
            const userDoc = await getDoc(doc(window.firebaseAPI.db, "users", username));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.profilePicture) {
                    // Cache it locally
                    localStorage.setItem(`pfp_${username}`, data.profilePicture);
                    return data.profilePicture;
                }
            }
        } catch (error) {
            console.error('Error loading profile picture from Firebase:', error);
        }
    }
    
    // Fallback to localStorage cache
    return getUserProfilePicture(username);
}

// Update all visible comment profile pictures for a specific user
function updateCommentProfilePictures(username, newPfpUrl) {
    if (!username || !newPfpUrl) return;
    
    // Find all comment elements for this user
    const comments = document.querySelectorAll('.comment');
    comments.forEach(comment => {
        const authorElement = comment.querySelector('.comment-author');
        if (authorElement && authorElement.textContent === username) {
            // Find the profile picture in the comment header
            const commentHeader = comment.querySelector('.comment-header');
            if (commentHeader) {
                const pfpImg = commentHeader.querySelector('img');
                if (pfpImg) {
                    pfpImg.src = newPfpUrl;
                }
            }
        }
    });
}



// Catch errors for further handling if needed
const realConsoleError = console.error;
console.error = function(...args) {

    // Display Error in Console
    realConsoleError.apply(console, args);

    // Log Out User when Database Overloaded
    if (args[1] && typeof args[1] === "string" && args[1].includes("resource-exhausted")) {

        window.alert("Account functions are currently unavailable. Please try again later.\nYou will now be logged out.");

        if (document.getElementsByClassName("accBox")[0]) {
            localStorage.clear();
            localStorage.clear();
            localStorage.setItem("username", "guest");
        }
        else power.stage1(false);

    }
}

