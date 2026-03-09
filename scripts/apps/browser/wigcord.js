/**
 * WigCord - Discord-like Chat Application with Firebase
 * Features: Server CRUD, channels, real-time messaging with pagination,
 *           roles with permissions, friends, DMs, profile customization
 *
 * To extend WigCord:
 *   - Add new permissions in WigCord.CONFIG.PERMISSIONS
 *   - Change default roles/channels in WigCord.CONFIG.DEFAULT_ROLES / DEFAULT_CHANNELS
 *   - Adjust theme defaults in WigCord.CONFIG.THEME_DEFAULTS
 *   - Change Firebase collection names in WigCord.CONFIG.COLLECTIONS
 *   - Add emoji categories by pushing to WigCord.CONFIG.EMOJIS
 */

class WigCord {

    // =========================================================================
    // Static configuration — edit these to customize WigCord behavior
    // =========================================================================

    static CONFIG = {
        // Firestore collection paths — all under wigcord/data (like wigtube/data)
        COLLECTIONS: {
            servers:   'wigcord/data/servers',
            invites:   'wigcord/data/invites',
            messages:  'wigcord/data/messages',
            friends:   'wigcord/data/friends',
            dms:       'wigcord/data/dms',
            profiles:  'wigcord/data/profiles',
            users:     'users',           // global user docs (pfp etc.)
        },

        // All permission keys — add new ones here and they auto-appear in role editor
        PERMISSIONS: [
            { key: 'sendMessages',   label: 'Send Messages' },
            { key: 'manageChannels', label: 'Manage Channels' },
            { key: 'kickMembers',    label: 'Kick Members' },
            { key: 'banMembers',     label: 'Ban Members' },
            { key: 'manageRoles',    label: 'Manage Roles' },
            { key: 'mentionEveryone',label: 'Mention @everyone' },
            { key: 'manageMessages', label: 'Manage Messages' },
            { key: 'attachFiles',    label: 'Attach Files' },
        ],

        // Default permission sets per built-in role
        _permAll:  () => Object.fromEntries(WigCord.CONFIG.PERMISSIONS.map(p => [p.key, true])),
        _permMod:  () => ({ ...WigCord.CONFIG._permAll(), banMembers: false, manageRoles: false }),
        _permBase: () => Object.fromEntries(WigCord.CONFIG.PERMISSIONS.map(p => [p.key, ['sendMessages','attachFiles','mentionEveryone'].includes(p.key)])),

        // Default roles created with every new server
        DEFAULT_ROLES: [
            { id: 'owner',     name: 'Owner',         color: '#f0f0f0', get permissions() { return WigCord.CONFIG._permAll(); } },
            { id: 'admin',     name: 'Administrator',  color: '#5865f2', get permissions() { return WigCord.CONFIG._permAll(); } },
            { id: 'moderator', name: 'Moderator',      color: '#ed4245', get permissions() { return WigCord.CONFIG._permMod(); } },
            { id: 'member',    name: 'Member',          color: '#808080', get permissions() { return WigCord.CONFIG._permBase(); } },
        ],

        // Default channels created with every new server
        DEFAULT_CHANNELS: [
            { id: 'general',       name: 'general',  type: 'text',  order: 0 },
            { id: 'general-voice', name: 'General',  type: 'voice', order: 1 },
        ],

        // Role color palette (displayed in role editor)
        ROLE_COLORS: [
            '#99aab5','#1abc9c','#2ecc71','#3498db','#9b59b6','#e91e63','#f1c40f','#e67e22','#e74c3c','#95a5a6',
            '#607d8b','#11806a','#1f8b4c','#206694','#71368a','#ad1457','#c27c0e','#a84300','#992d22','#979c9f',
        ],

        // Profile theme defaults
        THEME_DEFAULTS: { primary: '#316ac5', accent: '#e74c3c' },

        // Limits
        MSG_PAGE_SIZE: 50,
        BIO_MAX_LENGTH: 190,
        SERVER_SAVE_DEBOUNCE_MS: 1500,
        INIT_FALLBACK_TIMEOUT_MS: 1500,
        GIF_SEARCH_DEBOUNCE_MS: 500,

        // GIF provider
        GIPHY_API_KEY: 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh',
        GIPHY_LIMIT: 100,

        // Asset base path (relative to wigcord.html)
        ASSET_BASE: '../../../assets/images/icons/wigcord',

        // Emojis for picker — grouped for future category support
        EMOJIS: [
            '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
            '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
            '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩',
            '🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣',
            '😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬',
            '🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗',
            '🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯',
            '😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐',
            '🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈',
            '👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾',
            '🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿',
            '😾','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️',
            '🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️',
            '👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲',
            '🤝','🙏','✍️','💪','❤️','🧡','💛','💚','💙','💜',
            '🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖',
            '💘','💝','💟','👀','💯','🔥','⭐','✨','💫','💥',
            '💢','💨','💦','🎉','🎊','🎈','🎁','🎂','🍰','🍕',
            '🍔','🍟','🌭','🌮','🌯','🍣','🍦','🍩','🍪','🎲',
        ],
    };

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor() {
        this.servers = [];
        this.currentServer = null;
        this.currentChannel = null;
        this.currentView = 'dm'; // 'dm', 'server', 'dm-chat'
        this.currentDmPartner = null;
        this.username = 'User';
        this.userPfp = null;

        // Firebase listeners (unsubscribe functions)
        this._msgUnsub = null;
        this._dmUnsub = null;
        this._friendsUnsub = null;

        // Pagination state
        this._oldestMsgSnap = null;
        this._oldestDmSnap = null;
        this._loadingOlder = false;
        this._allOlderLoaded = false;
        this._dmLoadingOlder = false;
        this._dmAllOlderLoaded = false;

        // Friends data
        this.friends = {};        // { username: { status: 'accepted'|'pending_in'|'pending_out'|'blocked', since } }
        this.friendProfiles = {}; // cached profile data

        // PFP cache: avoids repeated Firebase reads for the same user's avatar
        this._pfpCache = {};      // { username: pfpUrl|null }
        this._pfpInFlight = {};   // { username: Promise } — deduplicates concurrent fetches

        // Profile data
        this.myProfile = {};

        this.currentServerImage = null;
        this.currentSettingsServer = null;
        this.currentGifView = 'trending';

        // Reply state
        this._replyingTo = null; // { id, author, content }

        // Notification sound
        this._notifSound = null;

        // Spotify polling timer (profile viewer)
        this._spotifyPollTimer = null;
        this._spotifyProgressTimer = null;

        // Global Spotify polling (user panel now-playing)
        this._globalSpotifyPollTimer = null;
        this._currentTrack = null;

        // Flags to skip notifications on initial snapshot load
        this._channelInitialized = false;
        this._dmInitialized = false;

        this._initWhenReady();
    }

    // Shorthand accessors for config
    get _c()    { return WigCord.CONFIG; }
    get _cols() { return this._c.COLLECTIONS; }

    // =========================================================================
    // Initialization
    // =========================================================================

    _initWhenReady() {
        // Inherit Firebase + global helpers by walking the FULL ancestor chain.
        // wigcord.html lives two frames deep: index.html → rBrowser.html → wigcord.html
        // window.parent only reaches rBrowser which has no Firebase; we must go further.
        const inheritFromParent = () => {
            let p = window;
            while (true) {
                try {
                    if (!p.parent || p.parent === p) break;
                    p = p.parent;
                    if (!window.firebaseAPI && p.firebaseAPI) window.firebaseAPI = p.firebaseAPI;
                    if (!window.getUser && p.getUser) window.getUser = p.getUser;
                    if (!window.loadUserProfilePicture && p.loadUserProfilePicture) window.loadUserProfilePicture = p.loadUserProfilePicture;
                    if (!window.setUserProfilePicture && p.setUserProfilePicture) window.setUserProfilePicture = p.setUserProfilePicture;
                } catch(e) { break; } // cross-origin guard — stop walking
            }
        };
        inheritFromParent();

        const tryInit = () => {
            if (this._ready) return; // Prevent double-init
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._onReady());
            } else {
                this._onReady();
            }
        };

        if (this._online) {
            tryInit();
        } else {
            // Listen for dbReady on every ancestor frame we can reach
            const listenOnFrame = (frame) => {
                try {
                    frame.addEventListener('dbReady', () => { inheritFromParent(); tryInit(); }, { once: true });
                } catch(e) {}
            };
            listenOnFrame(window);
            let p = window;
            while (true) {
                try {
                    if (!p.parent || p.parent === p) break;
                    p = p.parent;
                    listenOnFrame(p);
                } catch(e) { break; }
            }
            // Hard fallback: run regardless after timeout (offline / no Firebase mode)
            setTimeout(() => { inheritFromParent(); tryInit(); }, this._c.INIT_FALLBACK_TIMEOUT_MS);
        }
    }

    async _onReady() {
        if (this._ready) return;
        this._ready = true;

        // Get username from global getUser()
        if (typeof getUser === 'function') {
            this.username = getUser();
        } else {
            this.username = localStorage.getItem('username') || 'guest';
        }

        // Load pfp
        await this._loadMyPfp();

        // Setup all UI event listeners
        this._setupUI();

        // Load profile from Firebase
        await this._loadMyProfile();

        // Update user panel
        this._updateUserPanel();

        // Load servers from Firebase
        await this._loadServers();

        // Start friends listener
        this._startFriendsListener();

        // Start in DM view
        this.switchToDMView();

        // If opened via invite URL, wait briefly for Firebase before attempting join
        const inviteCode = this._extractInviteCodeFromUrl();
        if (inviteCode && !this._online) {
            await this._waitForDbReady(8000);
            if (this._online) {
                await this._loadServers();
            }
        }

        // Handle invite links (?invite=CODE or /invite/CODE)
        await this._handleInviteFromUrl();

        // Check if returning from a full-page Spotify redirect auth
        this._checkSpotifyRedirectAuth();

        // Start global Spotify polling for user panel now-playing
        this._startGlobalSpotifyPolling();
    }

    async _waitForDbReady(timeoutMs = 8000) {
        if (this._online) return;
        await new Promise(resolve => {
            const handler = () => resolve();
            window.addEventListener('dbReady', handler, { once: true });
            setTimeout(() => {
                window.removeEventListener('dbReady', handler);
                resolve();
            }, timeoutMs);
        });
    }

    async _checkSpotifyRedirectAuth() {
        if (typeof SpotifyAPI !== 'undefined' && SpotifyAPI.checkPendingAuth()) {
            this._updateSpotifyConnectUI();
            // Save connected state to profile
            const spotifyProfile = await SpotifyAPI.getUserProfile();
            if (spotifyProfile) {
                this.myProfile.connections = this.myProfile.connections || {};
                this.myProfile.connections.spotifyConnected = true;
                this.myProfile.connections.spotifyUser = spotifyProfile.name || spotifyProfile.id;
                await this._saveMyProfile(this.myProfile);
            }
            // Kick off global now-playing polling after successful auth
            this._startGlobalSpotifyPolling();
        }
    }

    async _loadMyPfp() {
        // 1. Try wigcord_profiles pfpUrl (Wigcord has its OWN pfp, separate from WigTube)
        const profileData = await this._fbGet(`${this._cols.profiles}/${this.username}`);
        if (profileData && profileData.pfpUrl) {
            this.userPfp = profileData.pfpUrl;
            try { localStorage.setItem(`wigcord-pfp-${this.username}`, this.userPfp); } catch(e) {}
        }
        // 2. Fallback: wigcord-specific localStorage cache
        if (!this.userPfp) {
            this.userPfp = localStorage.getItem(`wigcord-pfp-${this.username}`) || null;
        }
    }

    _updateUserPanel() {
        const avatarEl = document.getElementById('user-panel-avatar');
        const nameEl = document.getElementById('user-panel-name');
        const displayName = this.myProfile.displayName || this.username;
        if (nameEl) nameEl.textContent = displayName;
        if (avatarEl) {
            if (this.userPfp) {
                avatarEl.innerHTML = `<img src="${this.userPfp}" class="user-avatar-img" alt="pfp">`;
            } else {
                avatarEl.textContent = this.username.charAt(0).toUpperCase();
            }
        }
    }

    // =========================================================================
    // Global Spotify Now Playing (user panel)
    // =========================================================================

    _startGlobalSpotifyPolling() {
        if (this._globalSpotifyPollTimer) {
            clearInterval(this._globalSpotifyPollTimer);
            this._globalSpotifyPollTimer = null;
        }
        if (typeof SpotifyAPI === 'undefined' || !SpotifyAPI.isConnected()) return;

        // Poll immediately, then every 10 seconds
        this._globalSpotifyPoll();
        this._globalSpotifyPollTimer = setInterval(() => this._globalSpotifyPoll(), 10000);
    }

    async _globalSpotifyPoll() {
        if (typeof SpotifyAPI === 'undefined' || !SpotifyAPI.isConnected()) {
            this._currentTrack = null;
            this._updateUserPanelNowPlaying(null);
            return;
        }
        try {
            const track = await SpotifyAPI.getCurrentlyPlaying();
            this._currentTrack = (track && track.isPlaying) ? track : null;
            this._updateUserPanelNowPlaying(this._currentTrack);
        } catch (e) {
            console.error('[WigCord] Global Spotify poll error:', e);
        }
    }

    _updateUserPanelNowPlaying(track) {
        const container = document.getElementById('user-panel-now-playing');
        const statusEl = document.querySelector('.user-panel .user-status');
        if (!container) return;

        if (!track) {
            container.style.display = 'none';
            container.innerHTML = '';
            if (statusEl) {
                statusEl.textContent = 'online';
                statusEl.style.color = '#008000';
            }
            return;
        }

        // Update status text
        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#1db954">&#9835;</span> Listening to Spotify`;
            statusEl.style.color = '#1db954';
        }

        // Build now-playing mini widget
        container.style.display = 'flex';
        container.innerHTML = `
            <img class="up-np-art" src="${this._esc(track.albumArtSmall || track.albumArt || '')}" alt="">
            <div class="up-np-info">
                <div class="up-np-title">${this._esc(track.title)}</div>
                <div class="up-np-artist">${this._esc(track.artist)}</div>
            </div>
            <div class="up-np-bars">
                <span></span><span></span><span></span>
            </div>
        `;
    }

    // =========================================================================
    // Firebase helpers
    // =========================================================================

    /**
     * Deep-sanitize data before sending to Firestore.
     * Firebase runs in the parent window realm; objects created in this iframe
     * fail the internal isPlainObject() prototype check. JSON round-tripping
     * produces truly plain objects that are always accepted.
     */
    _toPlain(data) {
        const hostWindow = this._fbHostWindow || window;
        const stringify = hostWindow.JSON ? hostWindow.JSON.stringify : JSON.stringify;
        const parse = hostWindow.JSON ? hostWindow.JSON.parse : JSON.parse;
        return parse(stringify(data));
    }

    get _fbHostWindow() {
        let host = null;
        try {
            let current = window;
            while (current) {
                if (current.firebaseAPI && current.firebaseAPI.db) {
                    host = current;
                }
                if (!current.parent || current.parent === current) {
                    break;
                }
                current = current.parent;
            }
        } catch(e) {}
        return host || window;
    }

    get _fb() {
        const hostWindow = this._fbHostWindow;
        if (hostWindow && hostWindow.firebaseAPI && hostWindow.firebaseAPI.db) {
            return hostWindow.firebaseAPI;
        }
        return window.firebaseAPI || {};
    }

    get _online() {
        // Live check: Firestore db instance is truthy only when real Firebase is connected.
        // This avoids all flag-timing issues (firebaseOnline may not be set on iframe window).
        return !!this._fb.db;
    }

    async _fbSet(path, data, merge = true) {
        if (!this._online) {
            console.warn('[WigCord] Offline — saving to localStorage:', path);
            this._localSave(path, data, merge);
            return;
        }
        try {
            const { doc, setDoc } = this._fb;
            await setDoc(doc(this._fb.db, ...path.split('/')), this._toPlain(data), { merge });
        } catch(e) {
            console.error('[WigCord] _fbSet error:', path, e);
            this._localSave(path, data, merge);
        }
    }

    async _fbGet(path) {
        if (!this._online) {
            return this._localGet(path);
        }
        try {
            const { doc, getDoc } = this._fb;
            const snap = await getDoc(doc(this._fb.db, ...path.split('/')));
            return snap.exists() ? snap.data() : null;
        } catch(e) {
            console.error('[WigCord] _fbGet error:', path, e);
            return this._localGet(path);
        }
    }

    async _fbAdd(colPath, data) {
        if (!this._online) {
            const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            this._localSave(colPath + '/' + id, data);
            return { id };
        }
        try {
            const { collection, addDoc } = this._fb;
            return await addDoc(collection(this._fb.db, ...colPath.split('/')), this._toPlain(data));
        } catch(e) {
            console.error('[WigCord] _fbAdd error:', colPath, e);
            const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            this._localSave(colPath + '/' + id, data);
            return { id };
        }
    }

    async _fbUpdate(path, data) {
        if (!this._online) {
            this._localSave(path, data, true);
            return;
        }
        try {
            const { doc, updateDoc } = this._fb;
            await updateDoc(doc(this._fb.db, ...path.split('/')), this._toPlain(data));
        } catch(e) {
            console.error('[WigCord] _fbUpdate error:', path, e);
            this._localSave(path, data, true);
        }
    }

    async _fbDelete(path) {
        if (!this._online) {
            this._localDelete(path);
            return;
        }
        try {
            const { doc, deleteDoc } = this._fb;
            await deleteDoc(doc(this._fb.db, ...path.split('/')));
        } catch(e) {
            console.error('[WigCord] _fbDelete error:', path, e);
            this._localDelete(path);
        }
    }

    async _fbQuery(colPath, ...constraints) {
        if (!this._online) return [];
        try {
            const { collection, query, getDocs } = this._fb;
            const q = query(collection(this._fb.db, ...colPath.split('/')), ...constraints);
            const snap = await getDocs(q);
            return snap.docs;
        } catch(e) {
            console.error('[WigCord] _fbQuery error:', colPath, e);
            return [];
        }
    }

    // =========================================================================
    // localStorage fallback
    // =========================================================================

    _localSave(path, data, merge = false) {
        try {
            const store = JSON.parse(localStorage.getItem('wigcord-fb-cache') || '{}');
            if (merge && store[path]) {
                store[path] = { ...store[path], ...data };
            } else {
                store[path] = data;
            }
            localStorage.setItem('wigcord-fb-cache', JSON.stringify(store));
        } catch(e) { console.error('[WigCord] localStorage save error:', e); }
    }

    _localGet(path) {
        try {
            const store = JSON.parse(localStorage.getItem('wigcord-fb-cache') || '{}');
            return store[path] || null;
        } catch(e) { return null; }
    }

    _localDelete(path) {
        try {
            const store = JSON.parse(localStorage.getItem('wigcord-fb-cache') || '{}');
            delete store[path];
            localStorage.setItem('wigcord-fb-cache', JSON.stringify(store));
        } catch(e) {}
    }

    // =========================================================================
    // Profile System
    // =========================================================================

    async _loadMyProfile() {
        const data = await this._fbGet(`${this._cols.profiles}/${this.username}`);
        if (data) {
            this.myProfile = data;
            // Sync to both local caches so offline reloads always have fresh data
            try {
                const json = JSON.stringify(data);
                localStorage.setItem(`wigcord-profile-${this.username}`, json);
            } catch(e) {}
            this._localSave(`${this._cols.profiles}/${this.username}`, data);
        } else {
            // Try localStorage fallback
            try {
                const cached = localStorage.getItem(`wigcord-profile-${this.username}`);
                if (cached) {
                    this.myProfile = JSON.parse(cached);
                } else {
                    this.myProfile = { displayName: this.username, bio: '', pronouns: '', connections: {} };
                }
            } catch(e) {
                this.myProfile = { displayName: this.username, bio: '', pronouns: '', connections: {} };
            }
        }
        // Stamp createdAt the first time a profile is initialized
        if (!this.myProfile.createdAt) {
            this.myProfile.createdAt = Date.now();
            await this._fbSet(`${this._cols.profiles}/${this.username}`, { createdAt: this.myProfile.createdAt });
        }
    }

    async _saveMyProfile(profileData) {
        const prevProfile = JSON.stringify(this.myProfile);
        this.myProfile = { ...this.myProfile, ...profileData };
        // Always include the current pfp URL so it persists
        if (this.userPfp && !this.myProfile.pfpUrl) {
            this.myProfile.pfpUrl = this.userPfp;
        }

        // Skip Firebase write if nothing actually changed (dirty check)
        const newProfile = JSON.stringify(this.myProfile);
        const isDirty = prevProfile !== newProfile;

        // Always cache locally (cheap) — keep BOTH caches in sync
        try {
            localStorage.setItem(`wigcord-profile-${this.username}`, newProfile);
        } catch(e) {}
        // Also keep pfp cached separately for quick load on next login
        if (this.myProfile.pfpUrl) {
            try { localStorage.setItem(`wigcord-pfp-${this.username}`, this.myProfile.pfpUrl); } catch(e) {}
        }
        this._localSave(`${this._cols.profiles}/${this.username}`, this.myProfile);

        // Only write to Firebase if data actually changed
        if (isDirty) {
            await this._fbSet(`${this._cols.profiles}/${this.username}`, this.myProfile);
        }
    }

    async _loadUserProfile(username) {
        // Use in-memory cache to avoid redundant Firebase reads
        if (this.friendProfiles[username]) return this.friendProfiles[username];
        const data = await this._fbGet(`${this._cols.profiles}/${username}`);
        const profile = data || { displayName: username, bio: '', pronouns: '', connections: {} };
        this.friendProfiles[username] = profile;
        return profile;
    }

    async _getUserPfp(username) {
        if (username === this.username) return this.userPfp;

        // 1. Return from in-memory cache instantly (do not hard-cache null forever)
        if (username in this._pfpCache && this._pfpCache[username]) return this._pfpCache[username];

        // 2. Return from localStorage cache (avoids any Firebase read on reload)
        const lsKey = `wigcord-pfp-cache-${username}`;
        const cached = localStorage.getItem(lsKey);
        if (cached) {
            this._pfpCache[username] = cached;
            return cached;
        }

        // 3. Deduplicate: if a fetch for this user is already in flight, wait for it
        if (this._pfpInFlight[username]) return this._pfpInFlight[username];

        // 4. Single Firebase fetch — read from profiles collection only
        this._pfpInFlight[username] = (async () => {
            try {
                // Check in-memory friendProfiles first
                if (this.friendProfiles[username] && this.friendProfiles[username].pfpUrl) {
                    const url = this.friendProfiles[username].pfpUrl;
                    this._pfpCache[username] = url;
                    try { localStorage.setItem(lsKey, url); } catch(e) {}
                    return url;
                }

                // Fetch from wigcord profiles collection (single read per user)
                const profile = await this._fbGet(`${this._cols.profiles}/${username}`);
                if (profile) {
                    if (!this.friendProfiles[username]) this.friendProfiles[username] = profile;
                    if (profile.pfpUrl) {
                        this._pfpCache[username] = profile.pfpUrl;
                        try { localStorage.setItem(lsKey, profile.pfpUrl); } catch(e) {}
                        return profile.pfpUrl;
                    }
                }

                // Fallback to global pfp (WigTube etc.)
                let fallback = null;
                if (typeof loadUserProfilePicture === 'function') {
                    fallback = await loadUserProfilePicture(username);
                }
                if (!fallback) fallback = localStorage.getItem(`pfp_${username}`) || null;

                if (fallback) {
                    this._pfpCache[username] = fallback;
                    try { localStorage.setItem(lsKey, fallback); } catch(e) {}
                }
                return fallback;
            } finally {
                delete this._pfpInFlight[username];
            }
        })();

        return this._pfpInFlight[username];
    }

    // =========================================================================
    // Server CRUD (Firestore)
    // =========================================================================

    async _loadServers() {
        if (this._online) {
            try {
                const { where } = this._fb;
                const col = this._cols.servers;
                // Query servers where user is the owner
                const ownedDocs = await this._fbQuery(col, where('ownerId', '==', this.username));
                const ownedServers = ownedDocs.map(d => ({ id: d.id, ...d.data() }));

                // Query servers where user is a member (uses memberList array for Firestore array-contains)
                let memberServers = [];
                try {
                    const memberDocs = await this._fbQuery(col, where('memberList', 'array-contains', this.username));
                    memberServers = memberDocs.map(d => ({ id: d.id, ...d.data() }));
                } catch(e) {
                    // memberList field may not exist on older servers — that's OK
                }

                // Merge and deduplicate by id
                const allServersMap = new Map();
                ownedServers.forEach(s => allServersMap.set(s.id, s));
                memberServers.forEach(s => { if (!allServersMap.has(s.id)) allServersMap.set(s.id, s); });

                // Also merge any locally-cached servers that aren't yet in Firebase
                // (e.g. created offline) so they aren't lost
                const localServers = this._getLocalServers();
                localServers.forEach(ls => {
                    if (!allServersMap.has(ls.id)) {
                        allServersMap.set(ls.id, ls);
                        // Sync offline-created server to Firebase
                        this._syncOfflineServer(ls);
                    }
                });

                this.servers = Array.from(allServersMap.values());

                // Cache to localStorage for offline fallback
                this._cacheServersLocally();
            } catch(e) {
                console.error('[WigCord] Error loading servers from Firebase:', e);
                this._loadServersFromLocal();
            }
        } else {
            this._loadServersFromLocal();
        }
        this._renderServers();
    }

    _getLocalServers() {
        try {
            const saved = localStorage.getItem('wigcord-servers');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    }

    async _syncOfflineServer(server) {
        if (!this._online) return;
        try {
            const { id, ...data } = server;
            if (data.members) data.memberList = Object.keys(data.members);
            // If it was created offline with a local ID, re-create in Firebase
            if (id.startsWith('server-') || id.startsWith('local_')) {
                const ref = await this._fbAdd(this._cols.servers, data);
                // Update the ID in our servers array + cache
                const idx = this.servers.findIndex(s => s.id === id);
                if (idx !== -1) {
                    this.servers[idx].id = ref.id;
                    this._cacheServersLocally();
                }
            } else {
                await this._fbSet(`${this._cols.servers}/${id}`, data);
            }
        } catch(e) {
            console.error('[WigCord] Error syncing offline server:', e);
        }
    }

    _loadServersFromLocal() {
        try {
            const saved = localStorage.getItem('wigcord-servers');
            if (saved) {
                this.servers = JSON.parse(saved);
            } else {
                // Legacy fallback
                const legacy = localStorage.getItem('wigcord-data');
                if (legacy) {
                    const data = JSON.parse(legacy);
                    this.servers = data.servers || [];
                }
            }
        } catch(e) { this.servers = []; }
    }

    _cacheServersLocally() {
        try {
            const newData = JSON.stringify(this.servers);
            // Only write if data changed (avoids unnecessary localStorage writes)
            if (this._lastServerCache !== newData) {
                localStorage.setItem('wigcord-servers', newData);
                this._lastServerCache = newData;
            }
        } catch(e) {}
    }

    async createServer() {
        const name = document.getElementById('server-name-input').value.trim();
        if (!name) { alert('Please enter a server name!'); return; }

        const icon = this.currentServerImage || name.substring(0, 2).toUpperCase();

        // Build roles from CONFIG defaults (deep-copy so each server gets its own)
        const defaultRoles = this._c.DEFAULT_ROLES.map(r => ({
            id: r.id, name: r.name, color: r.color,
            permissions: { ...r.permissions }
        }));
        const defaultChannels = this._c.DEFAULT_CHANNELS.map(c => ({ ...c }));

        const serverData = {
            name,
            icon,
            description: '',
            ownerId: this.username,
            memberList: [this.username], // flat array for Firestore array-contains queries
            channels: defaultChannels,
            roles: defaultRoles,
            members: { [this.username]: { role: 'owner', joinedAt: Date.now() } },
            createdAt: Date.now()
        };

        if (this._online) {
            try {
                const ref = await this._fbAdd(this._cols.servers, serverData);
                serverData.id = ref.id;
            } catch(e) {
                console.error('[WigCord] Error creating server:', e);
                serverData.id = 'server-' + Date.now();
            }
        } else {
            serverData.id = 'server-' + Date.now();
        }

        this.servers.push(serverData);
        this._cacheServersLocally();
        this._renderServers();
        this.closeAddServerModal();
        this.switchToServer(serverData.id);

        // Add welcome message
        this._sendSystemMessage(serverData.id, 'general', `Welcome to ${name}! This is the beginning of the #general channel.`);
    }

    async deleteServer(serverId) {
        if (!confirm('Are you sure you want to delete this server? This cannot be undone.')) return;
        
        const server = this.servers.find(s => s.id === serverId);
        if (!server || server.ownerId !== this.username) {
            alert('Only the server owner can delete a server.');
            return;
        }

        if (this._online) {
            try { await this._fbDelete(`${this._cols.servers}/${serverId}`); } catch(e) { console.error(e); }
        }

        this.servers = this.servers.filter(s => s.id !== serverId);
        this._cacheServersLocally();
        this._renderServers();
        this.switchToDMView();
    }

    async _saveServer(server) {
        const { id, ...data } = server;
        // Ensure memberList stays in sync with members map
        if (data.members) {
            data.memberList = Object.keys(data.members);
        }
        // Always update local cache immediately
        this._cacheServersLocally();
        // Debounce Firebase writes (1.5s) to prevent excessive writes
        if (this._online) {
            this._debouncedServerSave(id, data);
        }
    }

    _debouncedServerSave(serverId, data) {
        if (!this._serverSaveTimers) this._serverSaveTimers = {};
        clearTimeout(this._serverSaveTimers[serverId]);
        this._serverSaveTimers[serverId] = setTimeout(async () => {
            try {
                await this._fbSet(`${this._cols.servers}/${serverId}`, data);
            } catch(e) {
                console.error('[WigCord] Debounced server save error:', e);
            }
        }, this._c.SERVER_SAVE_DEBOUNCE_MS);
    }

    // =========================================================================
    // Server Rendering
    // =========================================================================

    _renderServers() {
        const serverList = document.getElementById('server-list');
        serverList.innerHTML = '';

        this.servers.forEach(server => {
            const el = document.createElement('div');
            el.className = 'server-item' + (this.currentServer === server.id ? ' active' : '');
            el.dataset.serverId = server.id;
            el.title = server.name;

            if (server.icon && server.icon.startsWith && server.icon.startsWith('data:image/')) {
                el.innerHTML = `<img class="server-icon-img" src="${server.icon}" alt="${this._esc(server.name)}">`;
            } else {
                const txt = (server.icon && server.icon.length <= 2) ? server.icon : (server.name || '?').substring(0,2).toUpperCase();
                el.innerHTML = `<div class="server-icon server-icon-text">${this._esc(txt)}</div>`;
            }

            el.addEventListener('click', () => this.switchToServer(server.id));
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._showContextMenu(server.id, e.pageX, e.pageY);
            });
            serverList.appendChild(el);
        });
    }

    // =========================================================================
    // View Switching
    // =========================================================================

    switchToDMView() {
        this._unsubMessages();
        this.currentServer = null;
        this.currentChannel = null;
        this.currentView = 'dm';
        this.currentDmPartner = null;

        document.querySelectorAll('.server-item, .server-home').forEach(el => el.classList.remove('active'));
        document.getElementById('home-server').classList.add('active');

        document.getElementById('server-name').textContent = 'WigCord Home';
        document.getElementById('dm-navigation').style.display = 'block';
        document.getElementById('invite-section').style.display = 'none';
        document.getElementById('channel-category').style.display = 'none';
        document.getElementById('voice-category').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('dm-chat-view').style.display = 'none';
        document.getElementById('member-list').classList.add('hidden');

        this._showDMFriends();
    }

    async switchToServer(serverId) {
        this._unsubMessages();
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        this.currentServer = serverId;
        this.currentView = 'server';
        this.currentDmPartner = null;

        document.querySelectorAll('.server-item, .server-home').forEach(el => el.classList.remove('active'));
        const el = document.querySelector(`[data-server-id="${serverId}"]`);
        if (el) el.classList.add('active');

        document.getElementById('server-name').textContent = server.name;
        document.getElementById('welcome-server').textContent = server.name;

        // Hide DM stuff
        document.getElementById('dm-navigation').style.display = 'none';
        document.getElementById('invite-section').style.display = 'none';
        document.getElementById('dm-main-view').style.display = 'none';
        document.getElementById('dm-requests-view').style.display = 'none';
        document.getElementById('dm-chat-view').style.display = 'none';

        // Show channel list + member list
        document.getElementById('channel-category').style.display = 'block';
        document.getElementById('voice-category').style.display = 'block';
        document.getElementById('member-list').classList.remove('hidden');
        document.getElementById('message-input-area').classList.remove('hidden');

        this._renderChannels(server);
        this._renderMemberList(server);

        // Default to general text channel
        const firstText = (server.channels || []).find(c => c.type === 'text');
        if (firstText) {
            this.switchToChannel(firstText.id);
        } else {
            document.getElementById('welcome-screen').style.display = 'flex';
            document.getElementById('messages-container').style.display = 'none';
        }
    }

    switchToChannel(channelId) {
        this._unsubMessages();
        const server = this.servers.find(s => s.id === this.currentServer);
        if (!server) return;
        const channel = (server.channels || []).find(c => c.id === channelId);
        if (!channel) return;

        // Permission check
        if (channel.privateRoleIds && channel.privateRoleIds.length > 0) {
            const memberData = server.members && server.members[this.username];
            if (memberData) {
                const userRole = memberData.role;
                if (userRole !== 'owner' && !channel.privateRoleIds.includes(userRole)) {
                    alert('You do not have access to this channel.');
                    return;
                }
            }
        }

        this.currentChannel = channelId;

        // Update active channel in sidebar
        document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
        const chEl = document.querySelector(`.channel-item[data-channel="${channelId}"]`);
        if (chEl) chEl.classList.add('active');

        document.getElementById('current-channel').textContent = channel.name;
        if (channel.type === 'text') {
            document.getElementById('header-icon').textContent = '#';
        } else {
            document.getElementById('header-icon').innerHTML = `<img src="${this._c.ASSET_BASE}/speaker.svg" class="wc-icon-xs" alt="Voice">`;
        }

        document.getElementById('message-input').placeholder = `Message #${channel.name}`;
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('messages-container').style.display = 'block';
        document.getElementById('dm-main-view').style.display = 'none';
        document.getElementById('dm-requests-view').style.display = 'none';
        document.getElementById('dm-chat-view').style.display = 'none';

        // Check sendMessages permission
        if (!this._hasPermission(this.currentServer, 'sendMessages')) {
            document.getElementById('message-input-area').classList.add('no-send');
            document.getElementById('message-input').placeholder = 'You do not have permission to send messages';
            document.getElementById('message-input').disabled = true;
        } else {
            document.getElementById('message-input-area').classList.remove('no-send');
            document.getElementById('message-input').disabled = false;
        }

        // Load messages
        this._loadChannelMessages(this.currentServer, channelId);
    }

    _renderChannels(server) {
        const textContainer = document.getElementById('text-channels');
        const voiceContainer = document.getElementById('voice-channels');
        textContainer.innerHTML = '';
        voiceContainer.innerHTML = '';

        (server.channels || []).forEach(ch => {
            const chEl = document.createElement('div');
            chEl.className = 'channel-item' + (this.currentChannel === ch.id ? ' active' : '') + (ch.type === 'voice' ? ' voice' : '');
            chEl.dataset.channel = ch.id;

            if (ch.type === 'voice') {
                chEl.innerHTML = `<span class="channel-icon"><img src="${this._c.ASSET_BASE}/speaker.svg" class="wc-icon-xs" alt="Voice"></span><span class="channel-name">${this._esc(ch.name)}</span>`;
                voiceContainer.appendChild(chEl);
            } else {
                chEl.innerHTML = `<span class="channel-icon">#</span><span class="channel-name">${this._esc(ch.name)}</span>`;
                textContainer.appendChild(chEl);
            }

            chEl.addEventListener('click', () => this.switchToChannel(ch.id));
        });
    }

    // =========================================================================
    // Real-time Messages with Pagination
    // =========================================================================

    _getChannelKey(serverId, channelId) {
        return `${serverId}__${channelId}`;
    }

    _unsubMessages() {
        if (this._msgUnsub) { this._msgUnsub(); this._msgUnsub = null; }
        if (this._dmUnsub) { this._dmUnsub(); this._dmUnsub = null; }
        this._channelInitialized = false;
        this._dmInitialized = false;
    }

    async _loadChannelMessages(serverId, channelId) {
        const messagesEl = document.getElementById('messages');
        messagesEl.innerHTML = '';
        this._oldestMsgSnap = null;
        this._allOlderLoaded = false;
        this._loadingOlder = false;
        document.getElementById('loading-older').style.display = 'none';

        if (!this._online) {
            // Offline: show nothing
            messagesEl.innerHTML = '<div class="dm-empty-state"><div class="dm-empty-title">Connect to the internet to load messages</div></div>';
            return;
        }

        const channelKey = this._getChannelKey(serverId, channelId);
        const { collection, query, orderBy, limit, onSnapshot } = this._fb;
        const colRef = collection(this._fb.db, this._cols.messages, channelKey, 'msgs');

        // Load last N messages
        const q = query(colRef, orderBy('timestamp', 'desc'), limit(this._c.MSG_PAGE_SIZE));

        this._msgUnsub = onSnapshot(q, (snapshot) => {
            // Build sorted messages
            const msgs = [];
            snapshot.forEach(doc => msgs.push({ id: doc.id, _snap: doc, ...doc.data() }));
            msgs.reverse();

            // Check for new messages that should trigger notification
            if (this._channelInitialized) {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const d = change.doc.data();
                        if (d.author !== this.username && !d.isSystem) {
                            // Notify on @mention or reply to this user
                            const isMention = (d.content || '').includes(`@${this.username}`);
                            const isReplyToMe = d.replyTo && d.replyTo.author === this.username;
                            if (isMention || isReplyToMe) {
                                this._playNotificationSound();
                            }
                        }
                    }
                });
            }
            this._channelInitialized = true;

            // Track oldest for pagination
            if (msgs.length > 0) {
                this._oldestMsgSnap = snapshot.docs[snapshot.docs.length - 1]; // newest in desc = last
                // Actually, docs are in desc order, so the OLDEST is the last one
                // But msgs are reversed, so first in msgs = oldest
                // We need the snapshot doc for the oldest message
                this._oldestMsgSnap = snapshot.docs[snapshot.docs.length - 1]; // this is the oldest (last in desc)
            }
            if (msgs.length < this._c.MSG_PAGE_SIZE) {
                this._allOlderLoaded = true;
            }

            messagesEl.innerHTML = '';
            msgs.forEach(msg => this._renderMessage(messagesEl, msg));

            // Scroll to bottom
            const container = document.getElementById('messages-container');
            container.scrollTop = container.scrollHeight;
        }, err => {
            console.error('[WigCord] Message listener error:', err);
        });

        // Setup scroll sentinel for pagination
        this._setupScrollPagination();
    }

    _setupScrollPagination() {
        const container = document.getElementById('messages-container');
        const sentinel = document.getElementById('scroll-sentinel');

        // Use IntersectionObserver
        if (this._scrollObserver) this._scrollObserver.disconnect();
        this._scrollObserver = new IntersectionObserver(async (entries) => {
            if (entries[0].isIntersecting && !this._loadingOlder && !this._allOlderLoaded && this._oldestMsgSnap) {
                await this._loadOlderMessages();
            }
        }, { root: container, threshold: 0.1 });
        this._scrollObserver.observe(sentinel);
    }

    async _loadOlderMessages() {
        if (this._loadingOlder || this._allOlderLoaded || !this._oldestMsgSnap) return;
        this._loadingOlder = true;
        document.getElementById('loading-older').style.display = 'block';

        try {
            const channelKey = this._getChannelKey(this.currentServer, this.currentChannel);
            const { collection, query, orderBy, limit, startAfter, getDocs } = this._fb;
            const colRef = collection(this._fb.db, this._cols.messages, channelKey, 'msgs');

            const q = query(colRef, orderBy('timestamp', 'desc'), startAfter(this._oldestMsgSnap), limit(this._c.MSG_PAGE_SIZE));
            const snap = await getDocs(q);

            const messagesEl = document.getElementById('messages');
            const container = document.getElementById('messages-container');
            const prevScrollHeight = container.scrollHeight;

            const olderMsgs = [];
            snap.forEach(doc => olderMsgs.push({ id: doc.id, _snap: doc, ...doc.data() }));
            olderMsgs.reverse(); // oldest first

            if (olderMsgs.length > 0) {
                this._oldestMsgSnap = snap.docs[snap.docs.length - 1];
                // Prepend messages
                const fragment = document.createDocumentFragment();
                olderMsgs.forEach(msg => this._renderMessage(fragment, msg));
                messagesEl.insertBefore(fragment, messagesEl.firstChild);
                // Maintain scroll position
                container.scrollTop = container.scrollHeight - prevScrollHeight;
            }

            if (olderMsgs.length < this._c.MSG_PAGE_SIZE) {
                this._allOlderLoaded = true;
            }
        } catch(e) {
            console.error('[WigCord] Error loading older messages:', e);
        }

        this._loadingOlder = false;
        document.getElementById('loading-older').style.display = 'none';
    }

    _renderMessage(container, msg) {
        const el = document.createElement('div');
        el.className = 'message' + (msg.isSystem ? ' system-message' : '') + (msg.replyTo ? ' has-reply' : '');
        el.dataset.msgId = msg.id;

        // Reply reference (if replying to another message)
        let replyHTML = '';
        if (msg.replyTo) {
            const replyAuthor = this._esc(msg.replyTo.author || '?');
            const replyPreview = this._esc((msg.replyTo.content || '').substring(0, 80));
            replyHTML = `
                <div class="message-reply-ref" data-reply-id="${this._esc(msg.replyTo.id || '')}">
                    <span class="reply-ref-line"></span>
                    <span class="reply-ref-avatar" id="reply-avatar-${msg.id}">${replyAuthor.charAt(0).toUpperCase()}</span>
                    <span class="reply-ref-author">${replyAuthor}</span>
                    <span class="reply-ref-text">${replyPreview || 'Click to see message'}</span>
                </div>
            `;
        }

        // Resolve avatar from profile cache, not from message data
        const avatarId = `msg-avatar-${msg.id}`;
        let avatarHTML;
        if (msg.isSystem) {
            avatarHTML = '<div class="message-avatar system-avatar">⚙</div>';
        } else {
            const letter = (msg.author || '?').charAt(0).toUpperCase();
            avatarHTML = `<div class="message-avatar msg-avatar-letter" id="${avatarId}">${letter}</div>`;
        }

        let messageHTML = this._esc(msg.content || msg.text || '');
        const rawContent = msg.content || msg.text || '';

        // Detect GIF/media URLs (including Giphy media links)
        const gifUrlPattern = /(https?:\/\/(?:[^\s]+\.gif(?:\?[^\s]*)?|media\d*\.giphy\.com\/[^\s]+|i\.giphy\.com\/[^\s]+))/gi;
        const gifUrls = rawContent.match(gifUrlPattern);
        if (gifUrls) {
            messageHTML = this._esc(rawContent.replace(gifUrlPattern, '').trim());
            gifUrls.forEach(url => {
                messageHTML += `<img src="${this._esc(url)}" class="message-gif" alt="GIF">`;
            });
        }

        // Detect YouTube URLs and build embeds (thumbnail preview to avoid error 153 in nested iframes)
        const ytPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})[^\s]*/gi;
        let ytMatch;
        const ytEmbeds = [];
        while ((ytMatch = ytPattern.exec(rawContent)) !== null) {
            const videoId = ytMatch[1];
            const ytUrl = `https://www.youtube.com/watch?v=${this._esc(videoId)}`;
            messageHTML = messageHTML.replace(this._esc(ytMatch[0]), `<a href="${this._esc(ytMatch[0])}" class="message-link" target="_blank" rel="noopener noreferrer">${this._esc(ytMatch[0])}</a>`);
            ytEmbeds.push(`<div class="message-embed video-embed yt-thumb-embed" onclick="window.open('${ytUrl}', '_blank')">
                <img src="https://img.youtube.com/vi/${this._esc(videoId)}/hqdefault.jpg" class="yt-thumb-img" alt="YouTube Video">
                <div class="yt-thumb-overlay">
                    <div class="yt-thumb-play">▶</div>
                </div>
                <div class="yt-thumb-bar">
                    <img src="https://www.youtube.com/favicon.ico" class="yt-thumb-favicon">
                    <span class="yt-thumb-label">YouTube</span>
                    <span class="yt-thumb-link">Watch on YouTube</span>
                </div>
            </div>`);
        }

        // Detect WigTube URLs and build embeds
        const wtPattern = /(?:https?:\/\/[^\s]*)?wigtube-player\.html\?v=([a-zA-Z0-9_-]+)[^\s]*/gi;
        let wtMatch;
        const wtEmbeds = [];
        while ((wtMatch = wtPattern.exec(rawContent)) !== null) {
            const videoId = wtMatch[1];
            messageHTML = messageHTML.replace(this._esc(wtMatch[0]), `<a href="${this._esc(wtMatch[0])}" class="message-link" target="_blank" rel="noopener noreferrer">${this._esc(wtMatch[0])}</a>`);
            wtEmbeds.push(`<div class="message-embed wigtube-embed">
                <div class="wigtube-embed-header">
                    <span class="wigtube-embed-icon">▶</span>
                    <span class="wigtube-embed-label">WigTube Video</span>
                </div>
                <iframe src="wigtube-player.html?v=${this._esc(videoId)}&embed=1" frameborder="0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen class="embed-iframe"></iframe>
            </div>`);
        }

        // Detect WigCord invite links and create join embeds
        const inviteCodes = this._extractInviteCodesFromText(rawContent);
        const inviteEmbeds = inviteCodes.map(code => `
            <div class="message-embed wc-invite-embed" data-invite-code="${this._esc(code)}">
                <div class="wc-invite-header">Server Invite</div>
                <div class="wc-invite-body">
                    <div class="wc-invite-icon">?</div>
                    <div class="wc-invite-meta">
                        <div class="wc-invite-name">Loading server...</div>
                        <div class="wc-invite-sub">Invite code: ${this._esc(code)}</div>
                    </div>
                    <button class="wc-invite-join-btn" disabled>Join</button>
                </div>
            </div>
        `);

        // Linkify any remaining URLs in message text (not just YouTube/WigTube)
        messageHTML = this._linkifyEscapedHtml(messageHTML);

        messageHTML = this._parseEmojis(messageHTML);

        // Append video embeds after the message text
        const embedsHTML = [...ytEmbeds, ...wtEmbeds, ...inviteEmbeds].join('');

        const timeStr = msg.timestamp ? this._formatTime(msg.timestamp) : '';
        const authorName = msg.author || 'System';

        // Hover actions (reply button)
        const canDelete = this._canDeleteMessage(msg);
        const actionsHTML = msg.isSystem ? '' : `
            <div class="message-actions">
                <button class="msg-action-btn msg-reply-btn" title="Reply">↩</button>
                ${canDelete ? '<button class="msg-action-btn msg-delete-btn" title="Delete">✕</button>' : ''}
            </div>
        `;

        el.innerHTML = `
            ${replyHTML}
            <div class="message-row">
                ${avatarHTML}
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author" data-username="${this._esc(authorName)}">${this._esc(authorName)}</span>
                        <span class="message-time">${timeStr}</span>
                        ${actionsHTML}
                    </div>
                    <div class="message-text">${messageHTML}</div>
                    ${embedsHTML}
                </div>
            </div>
        `;

        // Click on author name or avatar to view profile
        if (!msg.isSystem) {
            const authorEl = el.querySelector('.message-author');
            if (authorEl) {
                authorEl.addEventListener('click', () => this._openProfileViewer(authorName));
            }
            const avatarEl = el.querySelector('.message-avatar');
            if (avatarEl) {
                avatarEl.style.cursor = 'pointer';
                avatarEl.addEventListener('click', () => this._openProfileViewer(authorName));
            }
            // Reply button
            const replyBtn = el.querySelector('.msg-reply-btn');
            if (replyBtn) {
                replyBtn.addEventListener('click', () => {
                    this._setReplyTo(msg);
                });
            }
            const deleteBtn = el.querySelector('.msg-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this._deleteMessage(msg);
                });
            }
        }

        // Click reply ref to scroll to original message
        const replyRef = el.querySelector('.message-reply-ref');
        if (replyRef) {
            replyRef.addEventListener('click', () => {
                const targetId = replyRef.dataset.replyId;
                if (targetId) {
                    const targetEl = container.querySelector(`[data-msg-id="${targetId}"]`);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetEl.classList.add('message-highlight');
                        setTimeout(() => targetEl.classList.remove('message-highlight'), 1500);
                    }
                }
            });
        }

        container.appendChild(el);

        // Hydrate invite embeds (resolve server info + bind Join button)
        if (inviteCodes.length) {
            el.querySelectorAll('.wc-invite-embed').forEach(embedEl => {
                const code = (embedEl.dataset.inviteCode || '').toUpperCase();
                if (code) this._hydrateInviteEmbed(embedEl, code);
            });
        }

        // Async: resolve pfp from profile cache and update avatar
        if (!msg.isSystem && msg.author) {
            this._getUserPfp(msg.author).then(pfp => {
                const avEl = document.getElementById(avatarId);
                if (avEl && pfp) {
                    avEl.innerHTML = `<img src="${pfp}" class="msg-avatar-img" alt="pfp">`;
                    avEl.classList.remove('msg-avatar-letter');
                }
            });
        }

        // Async: resolve reply ref avatar
        if (msg.replyTo && msg.replyTo.author) {
            this._getUserPfp(msg.replyTo.author).then(pfp => {
                const refAvEl = document.getElementById(`reply-avatar-${msg.id}`);
                if (refAvEl && pfp) {
                    refAvEl.innerHTML = `<img src="${pfp}" class="reply-ref-avatar-img" alt="">`;
                }
            });
        }
    }

    _setReplyTo(msg) {
        this._replyingTo = {
            id: msg.id,
            author: msg.author,
            content: (msg.content || msg.text || '').substring(0, 80)
        };
        const bar = document.getElementById('reply-bar');
        const nameEl = document.getElementById('reply-bar-username');
        nameEl.textContent = msg.author;
        bar.style.display = 'flex';
        document.getElementById('message-input').focus();
    }

    _canDeleteMessage(msg) {
        if (!msg || msg.isSystem) return false;

        // DMs: only your own messages
        if (this.currentView === 'dm-chat') {
            return msg.author === this.username;
        }

        // Server channels: own messages OR manageMessages permission in current server
        if (this.currentView === 'server' && this.currentServer) {
            if (msg.author === this.username) return true;
            return this._hasPermission(this.currentServer, 'manageMessages');
        }

        return false;
    }

    async _deleteMessage(msg) {
        if (!msg || !msg.id || !this._canDeleteMessage(msg)) return;

        try {
            if (this.currentView === 'dm-chat' && this.currentDmPartner) {
                const dmId = this._getDmId(this.username, this.currentDmPartner);
                await this._fbDelete(`${this._cols.dms}/${dmId}/messages/${msg.id}`);
                return;
            }

            if (this.currentView === 'server' && this.currentServer && this.currentChannel) {
                const channelKey = this._getChannelKey(this.currentServer, this.currentChannel);
                await this._fbDelete(`${this._cols.messages}/${channelKey}/msgs/${msg.id}`);
            }
        } catch (e) {
            console.error('[WigCord] Error deleting message:', e);
        }
    }

    _clearReply() {
        this._replyingTo = null;
        document.getElementById('reply-bar').style.display = 'none';
    }

    _playNotificationSound() {
        try {
            if (!this._notifSound) {
                // Generate a simple Discord-like notification blip using AudioContext
                this._notifSound = { play: () => {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(880, ctx.currentTime);
                        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
                        gain.gain.setValueAtTime(0.3, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                        osc.start(ctx.currentTime);
                        osc.stop(ctx.currentTime + 0.2);
                    } catch(e) {}
                }};
            }
            this._notifSound.play();
        } catch(e) {}
    }

    _formatTime(timestamp) {
        if (!timestamp) return '';
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            date = new Date(timestamp);
        }
        const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        return dateStr;
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        if (!text) return;

        if (this.currentView === 'dm-chat' && this.currentDmPartner) {
            await this._sendDMMessage(text);
            input.value = '';
            return;
        }

        if (this.currentView !== 'server' || !this.currentServer || !this.currentChannel) {
            return;
        }

        if (!this._hasPermission(this.currentServer, 'sendMessages')) {
            return;
        }

        input.value = '';

        const channelKey = this._getChannelKey(this.currentServer, this.currentChannel);
        const msgData = {
            author: this.username,
            content: text,
            timestamp: Date.now(),
            isSystem: false
        };

        // Attach reply reference if replying
        if (this._replyingTo) {
            msgData.replyTo = {
                id: this._replyingTo.id,
                author: this._replyingTo.author,
                content: this._replyingTo.content
            };
            this._clearReply();
        }

        // Always attempt to save (fbAdd handles offline fallback to localStorage)
        try {
            await this._fbAdd(`${this._cols.messages}/${channelKey}/msgs`, msgData);
        } catch(e) {
            console.error('[WigCord] Error sending message:', e);
        }

        // Hide welcome screen
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('messages-container').style.display = 'block';
    }

    async _sendSystemMessage(serverId, channelId, text) {
        const channelKey = this._getChannelKey(serverId, channelId);
        const msgData = {
            author: 'System',
            content: text,
            timestamp: Date.now(),
            isSystem: true
        };

        if (this._online) {
            try {
                await this._fbAdd(`${this._cols.messages}/${channelKey}/msgs`, msgData);
            } catch(e) { console.error(e); }
        }
    }

    // =========================================================================
    // Roles & Permissions
    // =========================================================================

    _getUserRole(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return null;
        if (server.ownerId === this.username) return 'owner';
        const memberData = server.members && server.members[this.username];
        return memberData ? memberData.role : 'member';
    }

    _getRoleData(serverId, roleId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server || !server.roles) return null;
        return server.roles.find(r => r.id === roleId);
    }

    _hasPermission(serverId, permission) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return false;
        if (server.ownerId === this.username) return true;

        const userRole = this._getUserRole(serverId);
        const roleData = this._getRoleData(serverId, userRole);
        if (!roleData || !roleData.permissions) return false;
        return !!roleData.permissions[permission];
    }

    // =========================================================================
    // Channel Creation
    // =========================================================================

    async createChannelFromModal(serverId, channelName, channelType, isPrivate) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        if (!this._hasPermission(serverId, 'manageChannels') && server.ownerId !== this.username) {
            alert('You do not have permission to create channels!');
            return;
        }

        const newChannel = {
            id: channelName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: channelName,
            type: channelType,
            order: (server.channels || []).length,
            privateRoleIds: isPrivate ? ['owner', 'admin'] : []
        };

        if (!server.channels) server.channels = [];
        server.channels.push(newChannel);
        await this._saveServer(server);
        this._renderChannels(server);
        this.closeChannelCreationModal();

        if (channelType === 'text') {
            this.switchToChannel(newChannel.id);
        }
    }

    // =========================================================================
    // Member List
    // =========================================================================

    async _renderMemberList(server) {
        const content = document.getElementById('member-list-content');
        if (!content || !server) return;

        const members = server.members || {};
        const memberUsernames = Object.keys(members);

        // Batch-load display names / pfps from network-cached profiles
        const profileMap = {};
        await Promise.all(memberUsernames.map(async uname => {
            profileMap[uname] = await this._loadUserProfile(uname);
        }));

        const onlineMembers = [];
        const offlineMembers = [];

        // For now, current user is online, everyone else is offline
        Object.entries(members).forEach(([uname, data]) => {
            const entry = { username: uname, ...data, profile: profileMap[uname] || {} };
            if (uname === this.username) {
                onlineMembers.push(entry);
            } else {
                offlineMembers.push(entry);
            }
        });

        let html = `<div class="member-header">ONLINE — ${onlineMembers.length}</div>`;
        onlineMembers.forEach(m => {
            const isOwner = m.role === 'owner' || server.ownerId === m.username;
            html += this._renderMemberItem(m.username, true, isOwner, m.role, m.profile);
        });

        html += `<div class="member-header">OFFLINE — ${offlineMembers.length}</div>`;
        offlineMembers.forEach(m => {
            const isOwner = m.role === 'owner' || server.ownerId === m.username;
            html += this._renderMemberItem(m.username, false, isOwner, m.role, m.profile);
        });

        content.innerHTML = html;

        // Add click listeners for profile viewing
        content.querySelectorAll('.member-item').forEach(el => {
            el.addEventListener('click', () => {
                const uname = el.dataset.username;
                if (uname) this._openProfileViewer(uname);
            });
        });
    }

    /**
     * Render a single member list entry.
     * @param {string} username   – raw username (used for data attribute & fallback)
     * @param {boolean} online    – whether member is online
     * @param {boolean} isOwner   – whether member is server owner
     * @param {string}  role      – role id
     * @param {object}  [profile] – cached profile (displayName, pfpUrl…)
     */
    _renderMemberItem(username, online, isOwner, role, profile = {}) {
        const displayName = profile.displayName || username;
        const pfp = profile.pfpUrl || ((username === this.username && this.userPfp) ? this.userPfp : null);
        const letter = displayName.charAt(0).toUpperCase();
        const avatarContent = pfp
            ? `<img src="${pfp}" class="member-avatar-img" alt="pfp">`
            : letter;
        const ownerBadge = isOwner
            ? `<span class="member-badge"><img src="${this._c.ASSET_BASE}/crown.svg" class="wc-icon-xs" alt="Owner"></span>`
            : '';

        const roleData = this.servers.find(s => s.id === this.currentServer)?.roles?.find(r => r.id === role);
        const nameColor = roleData ? `style="color:${roleData.color}"` : '';

        return `
            <div class="member-item" data-username="${this._esc(username)}">
                <div class="member-avatar ${online ? 'online' : ''}">${avatarContent}</div>
                <div class="member-info">
                    <span class="member-name" ${nameColor}>${this._esc(displayName)}</span>
                    ${ownerBadge}
                </div>
            </div>
        `;
    }

    // =========================================================================
    // Friends System
    // =========================================================================

    _startFriendsListener() {
        if (!this._online || this.username === 'guest') return;

        const { doc, onSnapshot } = this._fb;
        const friendsRef = doc(this._fb.db, this._cols.friends, this.username);

        this._friendsUnsub = onSnapshot(friendsRef, (snap) => {
            if (snap.exists()) {
                this.friends = snap.data().friends || {};
            } else {
                this.friends = {};
            }
            // Re-render if in DM view
            if (this.currentView === 'dm') {
                this._renderFriendsTab();
            }
            this._renderDMList();
        }, err => {
            console.error('[WigCord] Friends listener error:', err);
        });
    }

    async _sendFriendRequest(targetUsername) {
        if (!this._online || !targetUsername || targetUsername === this.username) return;
        if (targetUsername === 'guest') { alert('Cannot add guest as a friend.'); return; }

        // Verify the target user actually exists
        const userExists = await this._fbGet(`${this._cols.users}/${targetUsername}`);
        if (!userExists) {
            alert(`User "${targetUsername}" doesn't exist.`);
            return;
        }

        // Update our friends doc
        const myData = await this._fbGet(`${this._cols.friends}/${this.username}`) || { friends: {} };
        if (myData.friends[targetUsername]) {
            alert(`You already have a relationship with ${targetUsername}`);
            return;
        }
        myData.friends[targetUsername] = { status: 'pending_out', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });

        // Update target's friends doc
        const targetData = await this._fbGet(`${this._cols.friends}/${targetUsername}`) || { friends: {} };
        targetData.friends[this.username] = { status: 'pending_in', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${targetUsername}`, { friends: targetData.friends });

        alert(`Friend request sent to ${targetUsername}!`);
    }

    // Search for users by username prefix (queries the users collection)
    async _searchUsers(prefix) {
        if (!this._online || !prefix || prefix.length < 1) return [];
        try {
            const { collection, query, getDocs, limit, orderBy } = this._fb;
            // Firestore lexicographic range trick for prefix search on doc IDs
            // We query the 'users' collection and filter client-side by doc ID prefix
            const colRef = collection(this._fb.db, this._cols.users);
            const q = query(colRef, limit(50));
            const snap = await getDocs(q);
            const lowerPrefix = prefix.toLowerCase();
            const results = [];
            snap.docs.forEach(d => {
                if (d.id.toLowerCase().startsWith(lowerPrefix) && d.id !== this.username && d.id !== 'guest') {
                    results.push({ username: d.id, data: d.data() });
                }
            });
            return results.slice(0, 8);
        } catch(e) {
            console.error('[WigCord] _searchUsers error:', e);
            return [];
        }
    }

    async _acceptFriendRequest(targetUsername) {
        if (!this._online) return;

        // Update our record
        const myData = await this._fbGet(`${this._cols.friends}/${this.username}`) || { friends: {} };
        myData.friends[targetUsername] = { status: 'accepted', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });

        // Update their record
        const targetData = await this._fbGet(`${this._cols.friends}/${targetUsername}`) || { friends: {} };
        targetData.friends[this.username] = { status: 'accepted', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${targetUsername}`, { friends: targetData.friends });
    }

    async _declineFriendRequest(targetUsername) {
        if (!this._online) return;

        const myData = await this._fbGet(`${this._cols.friends}/${this.username}`) || { friends: {} };
        delete myData.friends[targetUsername];
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });

        const targetData = await this._fbGet(`${this._cols.friends}/${targetUsername}`) || { friends: {} };
        delete targetData.friends[this.username];
        await this._fbSet(`${this._cols.friends}/${targetUsername}`, { friends: targetData.friends });
    }

    async _removeFriend(targetUsername) {
        if (!confirm(`Remove ${targetUsername} from friends?`)) return;
        await this._declineFriendRequest(targetUsername);
    }

    async _blockUser(targetUsername) {
        if (!this._online) return;
        const myData = await this._fbGet(`${this._cols.friends}/${this.username}`) || { friends: {} };
        myData.friends[targetUsername] = { status: 'blocked', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });
    }

    // =========================================================================
    // Friends UI
    // =========================================================================

    _showDMFriends() {
        document.querySelectorAll('.dm-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('dm-friends-nav').classList.add('active');

        document.getElementById('dm-main-view').style.display = 'flex';
        document.getElementById('dm-requests-view').style.display = 'none';
        document.getElementById('dm-chat-view').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('current-channel').textContent = 'Friends';
        document.getElementById('header-icon').innerHTML = `<img src="${this._c.ASSET_BASE}/people.svg" class="wc-icon-xs" alt="Friends">`;
        document.getElementById('message-input-area').classList.add('hidden');
        document.getElementById('member-list').classList.add('hidden');

        this._renderFriendsTab();
    }

    _switchDMTab(tab) {
        document.querySelectorAll('.dm-tab').forEach(t => t.classList.remove('active'));
        const tabEl = document.getElementById(`dm-tab-${tab}`);
        if (tabEl) tabEl.classList.add('active');
        this._currentFriendsTab = tab;
        this._renderFriendsTab();
    }

    _renderFriendsTab() {
        const content = document.getElementById('dm-content');
        const tab = this._currentFriendsTab || 'online';

        if (tab === 'add') {
            content.innerHTML = `
                <div class="add-friend-container">
                    <h3>ADD FRIEND</h3>
                    <p>You can add friends by their username. Start typing to find users.</p>
                    <div class="add-friend-input-row">
                        <div class="add-friend-input-wrapper">
                            <input type="text" id="add-friend-input" class="modal-input" placeholder="Enter a username" autocomplete="off">
                            <div class="friend-search-dropdown" id="friend-search-dropdown"></div>
                        </div>
                        <button class="modal-btn primary" id="send-friend-request-btn">Send Friend Request</button>
                    </div>
                    <div id="add-friend-status"></div>
                </div>
            `;

            let searchTimeout = null;
            let selectedIndex = -1;
            let currentResults = [];
            const input = document.getElementById('add-friend-input');
            const dropdown = document.getElementById('friend-search-dropdown');
            const statusEl = document.getElementById('add-friend-status');

            const renderDropdown = (results) => {
                currentResults = results;
                selectedIndex = -1;
                if (results.length === 0 && input.value.trim().length >= 1) {
                    dropdown.innerHTML = '<div class="friend-search-no-results">No users found</div>';
                    dropdown.classList.add('visible');
                    return;
                }
                if (results.length === 0) {
                    dropdown.classList.remove('visible');
                    return;
                }
                dropdown.innerHTML = results.map((r, i) => {
                    const letter = r.username.charAt(0).toUpperCase();
                    const pfpHtml = r.data && r.data.pfp
                        ? `<img src="${this._esc(r.data.pfp)}" alt="">`
                        : letter;
                    return `<div class="friend-search-item" data-index="${i}" data-username="${this._esc(r.username)}">
                        <div class="search-avatar">${pfpHtml}</div>
                        <span>${this._esc(r.username)}</span>
                    </div>`;
                }).join('');
                dropdown.classList.add('visible');

                dropdown.querySelectorAll('.friend-search-item').forEach(el => {
                    el.addEventListener('click', () => {
                        input.value = el.dataset.username;
                        dropdown.classList.remove('visible');
                        statusEl.innerHTML = '<div class="friend-user-verified">✓ User found</div>';
                    });
                    el.addEventListener('mouseenter', () => {
                        dropdown.querySelectorAll('.friend-search-item').forEach(s => s.classList.remove('selected'));
                        el.classList.add('selected');
                        selectedIndex = parseInt(el.dataset.index);
                    });
                });
            };

            const doSearch = async () => {
                const val = input.value.trim();
                if (val.length < 1) {
                    dropdown.classList.remove('visible');
                    statusEl.innerHTML = '';
                    return;
                }
                dropdown.innerHTML = '<div class="friend-search-loading">Searching...</div>';
                dropdown.classList.add('visible');
                const results = await this._searchUsers(val);
                renderDropdown(results);
            };

            input.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(doSearch, 300);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (currentResults.length > 0) {
                        selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
                        dropdown.querySelectorAll('.friend-search-item').forEach((el, i) => {
                            el.classList.toggle('selected', i === selectedIndex);
                        });
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (currentResults.length > 0) {
                        selectedIndex = Math.max(selectedIndex - 1, 0);
                        dropdown.querySelectorAll('.friend-search-item').forEach((el, i) => {
                            el.classList.toggle('selected', i === selectedIndex);
                        });
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && currentResults[selectedIndex]) {
                        input.value = currentResults[selectedIndex].username;
                        dropdown.classList.remove('visible');
                        statusEl.innerHTML = '<div class="friend-user-verified">✓ User found</div>';
                    } else {
                        const name = input.value.trim();
                        if (name) this._sendFriendRequest(name);
                    }
                } else if (e.key === 'Escape') {
                    dropdown.classList.remove('visible');
                }
            });

            input.addEventListener('blur', () => {
                // Delay to allow click events on dropdown items
                setTimeout(() => dropdown.classList.remove('visible'), 200);
            });

            input.addEventListener('focus', () => {
                if (input.value.trim().length >= 1) doSearch();
            });

            document.getElementById('send-friend-request-btn').addEventListener('click', () => {
                const name = input.value.trim();
                if (name) this._sendFriendRequest(name);
            });
            return;
        }

        const friendEntries = Object.entries(this.friends || {});
        let filtered = [];

        switch (tab) {
            case 'all':
                filtered = friendEntries.filter(([, d]) => d.status === 'accepted');
                break;
            case 'online':
                // For simplicity, show all accepted friends (we don't track real presence)
                filtered = friendEntries.filter(([, d]) => d.status === 'accepted');
                break;
            case 'pending':
                filtered = friendEntries.filter(([, d]) => d.status === 'pending_in' || d.status === 'pending_out');
                break;
            case 'blocked':
                filtered = friendEntries.filter(([, d]) => d.status === 'blocked');
                break;
        }

        if (filtered.length === 0) {
            const emptyMsg = {
                online: "No friends online right now.",
                all: "You don't have any friends yet. Add some!",
                pending: "No pending friend requests.",
                blocked: "No blocked users."
            };
            content.innerHTML = `
                <div class="dm-empty-state">
                    <div class="dm-empty-icon"><img src="${this._c.ASSET_BASE}/people.svg" class="wc-icon-xl" alt=""></div>
                    <div class="dm-empty-title">${emptyMsg[tab] || 'Nothing here'}</div>
                </div>
            `;
            return;
        }

        let html = '<div class="friends-list">';
        filtered.forEach(([username, data]) => {
            const isPending = data.status === 'pending_in' || data.status === 'pending_out';
            const isBlocked = data.status === 'blocked';

            html += `<div class="friend-item" data-username="${this._esc(username)}">`;
            html += `<div class="friend-avatar">${username.charAt(0).toUpperCase()}</div>`;
            html += `<div class="friend-info"><span class="friend-name">${this._esc(username)}</span>`;
            if (data.status === 'pending_in') html += `<span class="friend-status">Incoming request</span>`;
            else if (data.status === 'pending_out') html += `<span class="friend-status">Outgoing request</span>`;
            else if (isBlocked) html += `<span class="friend-status">Blocked</span>`;
            html += `</div>`;

            html += `<div class="friend-actions">`;
            if (data.status === 'pending_in') {
                html += `<button class="friend-action-btn accept" data-action="accept" data-username="${this._esc(username)}" title="Accept">✓</button>`;
                html += `<button class="friend-action-btn decline" data-action="decline" data-username="${this._esc(username)}" title="Decline">✕</button>`;
            } else if (data.status === 'pending_out') {
                html += `<button class="friend-action-btn decline" data-action="decline" data-username="${this._esc(username)}" title="Cancel">✕</button>`;
            } else if (data.status === 'accepted') {
                html += `<button class="friend-action-btn message" data-action="message" data-username="${this._esc(username)}" title="Message"><img src="${this._c.ASSET_BASE}/chat.svg" class="wc-icon-xs" alt="Message"></button>`;
                html += `<button class="friend-action-btn decline" data-action="remove" data-username="${this._esc(username)}" title="Remove">✕</button>`;
            } else if (isBlocked) {
                html += `<button class="friend-action-btn" data-action="unblock" data-username="${this._esc(username)}" title="Unblock">Unblock</button>`;
            }
            html += `</div></div>`;
        });
        html += '</div>';
        content.innerHTML = html;

        // Add event listeners
        content.querySelectorAll('.friend-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const uname = btn.dataset.username;
                switch (action) {
                    case 'accept': this._acceptFriendRequest(uname); break;
                    case 'decline': this._declineFriendRequest(uname); break;
                    case 'remove': this._removeFriend(uname); break;
                    case 'message': this._openDMChat(uname); break;
                    case 'unblock': this._declineFriendRequest(uname); break;
                }
            });
        });

        // Click friend item to view profile
        content.querySelectorAll('.friend-item').forEach(el => {
            el.addEventListener('click', () => {
                const uname = el.dataset.username;
                if (uname) this._openProfileViewer(uname);
            });
        });
    }

    _renderDMList() {
        const dmList = document.getElementById('dm-list');
        if (!dmList) return;

        const acceptedFriends = Object.entries(this.friends || {}).filter(([, d]) => d.status === 'accepted');
        dmList.innerHTML = '';

        acceptedFriends.forEach(([username]) => {
            const el = document.createElement('div');
            el.className = 'dm-item';
            el.dataset.username = username;
            el.innerHTML = `
                <div class="dm-item-avatar">${username.charAt(0).toUpperCase()}</div>
                <div class="dm-item-name">${this._esc(username)}</div>
            `;
            el.addEventListener('click', () => this._openDMChat(username));
            dmList.appendChild(el);
        });
    }

    // =========================================================================
    // DM Chat
    // =========================================================================

    _getDmId(user1, user2) {
        return [user1, user2].sort().join('__');
    }

    async _openDMChat(username) {
        this._unsubMessages();
        this.currentView = 'dm-chat';
        this.currentDmPartner = username;
        this.currentServer = null;
        this.currentChannel = null;

        document.querySelectorAll('.server-item, .server-home').forEach(el => el.classList.remove('active'));
        document.getElementById('home-server').classList.add('active');

        // Update UI
        document.getElementById('server-name').textContent = 'WigCord Home';
        document.getElementById('current-channel').textContent = username;
        document.getElementById('header-icon').textContent = '@';
        document.getElementById('message-input').placeholder = `Message @${username}`;
        document.getElementById('message-input').disabled = false;

        // Hide server stuff, show DM chat
        document.getElementById('dm-navigation').style.display = 'block';
        document.getElementById('dm-main-view').style.display = 'none';
        document.getElementById('dm-requests-view').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('channel-category').style.display = 'none';
        document.getElementById('voice-category').style.display = 'none';
        document.getElementById('member-list').classList.add('hidden');

        document.getElementById('dm-chat-view').style.display = 'flex';
        document.getElementById('message-input-area').classList.remove('hidden');
        document.getElementById('message-input-area').classList.remove('no-send');

        // Highlight in DM list
        document.querySelectorAll('.dm-item').forEach(el => el.classList.remove('active'));
        const dmItem = document.querySelector(`.dm-item[data-username="${username}"]`);
        if (dmItem) dmItem.classList.add('active');

        // Load DM messages
        this._loadDMMessages(username);
    }

    async _loadDMMessages(username) {
        const dmMsgsEl = document.getElementById('dm-messages');
        dmMsgsEl.innerHTML = '';
        this._oldestDmSnap = null;
        this._dmAllOlderLoaded = false;
        this._dmLoadingOlder = false;
        document.getElementById('dm-loading-older').style.display = 'none';

        if (!this._online) {
            dmMsgsEl.innerHTML = '<div class="dm-empty-state"><div class="dm-empty-title">Connect to the internet to load messages</div></div>';
            return;
        }

        const dmId = this._getDmId(this.username, username);
        const { collection, query, orderBy, limit, onSnapshot } = this._fb;
        const colRef = collection(this._fb.db, this._cols.dms, dmId, 'messages');

        const q = query(colRef, orderBy('timestamp', 'desc'), limit(this._c.MSG_PAGE_SIZE));

        this._dmUnsub = onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach(doc => msgs.push({ id: doc.id, _snap: doc, ...doc.data() }));
            msgs.reverse();

            // Notification for new DM messages from partner
            if (this._dmInitialized) {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const d = change.doc.data();
                        if (d.author !== this.username && !d.isSystem) {
                            this._playNotificationSound();
                        }
                    }
                });
            }
            this._dmInitialized = true;

            if (msgs.length > 0) {
                this._oldestDmSnap = snapshot.docs[snapshot.docs.length - 1];
            }
            if (msgs.length < this._c.MSG_PAGE_SIZE) {
                this._dmAllOlderLoaded = true;
            }

            dmMsgsEl.innerHTML = '';
            msgs.forEach(msg => this._renderMessage(dmMsgsEl, msg));

            const container = document.getElementById('dm-chat-view');
            container.scrollTop = container.scrollHeight;
        }, err => console.error('[WigCord] DM listener error:', err));

        // DM scroll pagination
        this._setupDMScrollPagination();
    }

    _setupDMScrollPagination() {
        const container = document.getElementById('dm-chat-view');
        const sentinel = document.getElementById('dm-scroll-sentinel');
        if (this._dmScrollObserver) this._dmScrollObserver.disconnect();
        this._dmScrollObserver = new IntersectionObserver(async (entries) => {
            if (entries[0].isIntersecting && !this._dmLoadingOlder && !this._dmAllOlderLoaded && this._oldestDmSnap) {
                await this._loadOlderDMMessages();
            }
        }, { root: container, threshold: 0.1 });
        this._dmScrollObserver.observe(sentinel);
    }

    async _loadOlderDMMessages() {
        if (this._dmLoadingOlder || this._dmAllOlderLoaded || !this._oldestDmSnap) return;
        this._dmLoadingOlder = true;
        document.getElementById('dm-loading-older').style.display = 'block';

        try {
            const dmId = this._getDmId(this.username, this.currentDmPartner);
            const { collection, query, orderBy, limit, startAfter, getDocs } = this._fb;
            const colRef = collection(this._fb.db, this._cols.dms, dmId, 'messages');

            const q = query(colRef, orderBy('timestamp', 'desc'), startAfter(this._oldestDmSnap), limit(this._c.MSG_PAGE_SIZE));
            const snap = await getDocs(q);

            const dmMsgsEl = document.getElementById('dm-messages');
            const container = document.getElementById('dm-chat-view');
            const prevHeight = container.scrollHeight;

            const older = [];
            snap.forEach(doc => older.push({ id: doc.id, _snap: doc, ...doc.data() }));
            older.reverse();

            if (older.length > 0) {
                this._oldestDmSnap = snap.docs[snap.docs.length - 1];
                const frag = document.createDocumentFragment();
                older.forEach(msg => this._renderMessage(frag, msg));
                dmMsgsEl.insertBefore(frag, dmMsgsEl.firstChild);
                container.scrollTop = container.scrollHeight - prevHeight;
            }
            if (older.length < this._c.MSG_PAGE_SIZE) {
                this._dmAllOlderLoaded = true;
            }
        } catch(e) {
            console.error('[WigCord] Error loading older DMs:', e);
        }

        this._dmLoadingOlder = false;
        document.getElementById('dm-loading-older').style.display = 'none';
    }

    async _sendDMMessage(text) {
        if (!this.currentDmPartner) return;
        const dmId = this._getDmId(this.username, this.currentDmPartner);

        // Only create/update DM doc if it hasn't been created in this session
        if (!this._dmDocsCreated) this._dmDocsCreated = new Set();
        if (!this._dmDocsCreated.has(dmId)) {
            await this._fbSet(`${this._cols.dms}/${dmId}`, {
                participants: [this.username, this.currentDmPartner].sort(),
                updatedAt: Date.now()
            });
            this._dmDocsCreated.add(dmId);
        }

        // Add message (fbSet/fbAdd handle offline fallback to localStorage)
        const dmMsgData = {
            author: this.username,
            content: text,
            timestamp: Date.now(),
            isSystem: false
        };

        // Attach reply reference if replying
        if (this._replyingTo) {
            dmMsgData.replyTo = {
                id: this._replyingTo.id,
                author: this._replyingTo.author,
                content: this._replyingTo.content
            };
            this._clearReply();
        }

        await this._fbAdd(`${this._cols.dms}/${dmId}/messages`, dmMsgData);
    }

    // =========================================================================
    // Profile Viewer (read-only)
    // =========================================================================

    async _openProfileViewer(username) {
        const modal = document.getElementById('profile-viewer-modal');
        const profile = await this._loadUserProfile(username);
        const pfp = await this._getUserPfp(username);

        // Name / username / pronouns
        document.getElementById('viewer-name').textContent = profile.displayName || username;
        document.getElementById('viewer-username').textContent = username;
        const pronounsEl = document.getElementById('viewer-pronouns');
        const dotEl = modal.querySelector('.pv-dot');
        if (profile.pronouns) {
            pronounsEl.textContent = profile.pronouns;
            pronounsEl.style.display = 'inline';
            if (dotEl) dotEl.style.display = 'inline';
        } else {
            pronounsEl.style.display = 'none';
            if (dotEl) dotEl.style.display = 'none';
        }

        // About Me
        const bioEl = document.getElementById('viewer-bio');
        const bioSection = document.getElementById('viewer-bio-section');
        bioEl.textContent = profile.bio || '';
        bioSection.style.display = profile.bio ? 'block' : 'none';

        // Avatar
        const avatarEl = document.getElementById('viewer-avatar');
        const statusDot = avatarEl.querySelector('.pv-status-dot');
        avatarEl.innerHTML = '';
        if (statusDot) avatarEl.appendChild(statusDot);
        if (pfp) {
            const img = document.createElement('img');
            img.src = pfp;
            img.className = 'pv-avatar-img';
            img.alt = 'pfp';
            avatarEl.appendChild(img);
        } else {
            avatarEl.appendChild(document.createTextNode(username.charAt(0).toUpperCase()));
        }

        // Theme — smooth gradient below the banner: dark primary at bottom → accent at top
        const theme = profile.theme || {};
        const primary = theme.primary || this._c.THEME_DEFAULTS.primary;
        const accent  = theme.accent  || this._c.THEME_DEFAULTS.accent;
        const bannerEl = document.getElementById('viewer-banner');
        if (profile.bannerUrl) {
            bannerEl.style.background = `url(${profile.bannerUrl}) center/cover`;
        } else {
            bannerEl.style.background = `linear-gradient(to bottom, ${this._adjustBrightness(accent, 30)} 0%, ${accent} 100%)`;
        }
        // Gradient on the card body area only (below banner): primary at bottom → accent at top
        const cardEl = document.getElementById('viewer-profile-card');
        const darkPrimary = this._adjustBrightness(primary, -30);
        cardEl.style.background = `linear-gradient(to bottom, ${accent} 0%, ${primary} 60%, ${darkPrimary} 100%)`;
        // Avatar border blends with accent area
        avatarEl.style.borderColor = accent;

        // Member Since
        const memberSinceSection = document.getElementById('viewer-membersince-section');
        const memberSinceEl = document.getElementById('viewer-membersince');
        const ts = profile.createdAt || profile.joinedAt;
        if (ts) {
            const d = new Date(ts);
            memberSinceEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            memberSinceSection.style.display = 'block';
        } else {
            memberSinceSection.style.display = 'none';
        }

        // Roles — show roles for this user from the current server context
        const rolesSection = document.getElementById('viewer-roles-section');
        const rolesEl = document.getElementById('viewer-roles');
        rolesEl.innerHTML = '';
        let hasRoles = false;
        if (this.currentView === 'server' && this.currentServer) {
            const server = this.servers.find(s => s.id === this.currentServer);
            if (server && server.roles) {
                let userRoleId = 'member';
                if (server.ownerId === username) {
                    userRoleId = 'owner';
                } else if (server.members && server.members[username]) {
                    userRoleId = server.members[username].role || 'member';
                }
                const userRole = server.roles.find(r => r.id === userRoleId);
                if (userRole) {
                    hasRoles = true;
                    const tag = document.createElement('span');
                    tag.className = 'pv-role-tag';
                    tag.innerHTML = `<span class="pv-role-dot" style="background:${this._esc(userRole.color || '#808080')}"></span>${this._esc(userRole.name)}`;
                    rolesEl.appendChild(tag);
                }
            }
        }
        rolesSection.style.display = hasRoles ? 'block' : 'none';

        // Spotify "Listening to" — try live API first, fall back to static embed URL
        const spotifySection = document.getElementById('viewer-spotify-section');
        const spotifyEmbed = document.getElementById('viewer-spotify-embed');
        const spotifyNowPlaying = document.getElementById('viewer-spotify-now-playing');
        const spotifyUrl = (profile.connections || {}).spotify || '';
        const spotifyEmbedUrl = this._getSpotifyEmbedUrl(spotifyUrl);
        const isOwnProfile = (username === this.username);
        const spotifyLinked = (profile.connections || {}).spotifyConnected;

        // Clear previous polling
        if (this._spotifyPollTimer) {
            clearInterval(this._spotifyPollTimer);
            this._spotifyPollTimer = null;
        }
        this._stopSpotifyProgressTimer();

        if (isOwnProfile && typeof SpotifyAPI !== 'undefined' && SpotifyAPI.isConnected()) {
            // Own profile with live Spotify connection
            spotifySection.style.display = 'block';
            if (spotifyNowPlaying) spotifyNowPlaying.style.display = 'none';
            spotifyEmbed.innerHTML = '';
            this._pollSpotifyNowPlaying(spotifySection, spotifyNowPlaying, spotifyEmbed);
            // Poll every 10 seconds
            this._spotifyPollTimer = setInterval(() => {
                this._pollSpotifyNowPlaying(spotifySection, spotifyNowPlaying, spotifyEmbed);
            }, 10000);
        } else if (spotifyEmbedUrl) {
            // Fallback: static Spotify embed URL from connections
            if (spotifyNowPlaying) spotifyNowPlaying.style.display = 'none';
            spotifyEmbed.innerHTML = `<iframe src="${spotifyEmbedUrl}" frameborder="0" allowtransparency="true" allow="encrypted-media" class="spotify-embed-iframe"></iframe>`;
            spotifySection.style.display = 'block';
        } else if (spotifyLinked) {
            // User has Spotify linked but we can't access their API (not our tokens)
            spotifySection.style.display = 'block';
            if (spotifyNowPlaying) spotifyNowPlaying.style.display = 'none';
            spotifyEmbed.innerHTML = `<div class="pv-spotify-offline">Spotify connected — not currently playing</div>`;
        } else {
            spotifyEmbed.innerHTML = '';
            if (spotifyNowPlaying) spotifyNowPlaying.style.display = 'none';
            spotifySection.style.display = 'none';
        }

        // Connections
        const connSection = document.getElementById('viewer-connections-section');
        const connEl = document.getElementById('viewer-connections');
        const connTab = document.getElementById('viewer-connections-tab');
        const conn = profile.connections || {};
        const hasConn = conn.youtube || conn.twitter || conn.twitch || conn.spotify;
        if (hasConn) {
            connSection.style.display = 'block';
            if (connTab) connTab.style.display = 'block';
            let connHTML = '';
            if (conn.youtube) connHTML += `<div class="pv-conn-card"><div class="pv-conn-info"><div class="pv-conn-name">YouTube</div><a href="${this._esc(conn.youtube)}" target="_blank" class="pv-conn-link">${this._esc(conn.youtube)}</a></div></div>`;
            if (conn.twitter) connHTML += `<div class="pv-conn-card"><div class="pv-conn-info"><div class="pv-conn-name">Twitter</div><a href="${this._esc(conn.twitter)}" target="_blank" class="pv-conn-link">${this._esc(conn.twitter)}</a></div></div>`;
            if (conn.twitch)  connHTML += `<div class="pv-conn-card"><div class="pv-conn-info"><div class="pv-conn-name">Twitch</div><a href="${this._esc(conn.twitch)}" target="_blank" class="pv-conn-link">${this._esc(conn.twitch)}</a></div></div>`;
            if (conn.spotify) connHTML += `<div class="pv-conn-card"><div class="pv-conn-info"><div class="pv-conn-name">Spotify</div><a href="${this._esc(conn.spotify)}" target="_blank" class="pv-conn-link">${this._esc(conn.spotify)}</a></div></div>`;
            connEl.innerHTML = connHTML;
        } else {
            connSection.style.display = 'none';
            if (connTab) connTab.style.display = 'none';
        }

        // Action buttons
        const actionsEl  = document.getElementById('viewer-actions');
        const addFriendBtn = document.getElementById('viewer-add-friend');
        const messageBtn   = document.getElementById('viewer-message');

        if (username === this.username) {
            actionsEl.style.display = 'none';
        } else {
            actionsEl.style.display = 'flex';
            const friendData = this.friends[username];

            if (friendData && friendData.status === 'accepted') {
                addFriendBtn.textContent = 'Remove Friend';
                addFriendBtn.disabled = false;
                addFriendBtn.onclick = () => { this._removeFriend(username); modal.classList.remove('active'); };
                messageBtn.style.display = 'flex';
                messageBtn.onclick = () => { this._openDMChat(username); modal.classList.remove('active'); };
            } else if (friendData && (friendData.status === 'pending_in' || friendData.status === 'pending_out')) {
                addFriendBtn.textContent = 'Request Pending';
                addFriendBtn.disabled = true;
                messageBtn.style.display = 'none';
            } else {
                addFriendBtn.textContent = 'Add Friend';
                addFriendBtn.disabled = false;
                addFriendBtn.onclick = () => { this._sendFriendRequest(username); modal.classList.remove('active'); };
                messageBtn.style.display = 'none';
            }
        }

        // Tab switching
        const tabs = modal.querySelectorAll('.pv-tab');
        const tabContents = modal.querySelectorAll('.pv-tab-content');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                tab.classList.add('active');
                const targetId = `pv-tab-${tab.dataset.tab}`;
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            };
        });
        // Reset to About Me tab
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        const aboutTab = modal.querySelector('.pv-tab[data-tab="about"]');
        if (aboutTab) aboutTab.classList.add('active');
        const aboutContent = document.getElementById('pv-tab-about');
        if (aboutContent) aboutContent.classList.add('active');

        modal.classList.add('active');
    }

    // =========================================================================
    // Profile Editor (own profile)
    // =========================================================================

    _openProfileEditor() {
        const modal = document.getElementById('profile-editor-modal');

        document.getElementById('profile-display-name').value = this.myProfile.displayName || this.username;
        document.getElementById('profile-pronouns').value = this.myProfile.pronouns || '';
        document.getElementById('profile-bio').value = this.myProfile.bio || '';
        document.getElementById('profile-conn-youtube').value = (this.myProfile.connections || {}).youtube || '';
        document.getElementById('profile-conn-twitter').value = (this.myProfile.connections || {}).twitter || '';
        document.getElementById('profile-conn-twitch').value = (this.myProfile.connections || {}).twitch || '';
        document.getElementById('profile-conn-spotify').value = (this.myProfile.connections || {}).spotify || '';

        // Update Spotify connect button state
        this._updateSpotifyConnectUI();

        // Load theme colors
        const theme = this.myProfile.theme || {};
        const primaryColor = theme.primary || this._c.THEME_DEFAULTS.primary;
        const accentColor = theme.accent || this._c.THEME_DEFAULTS.accent;
        document.getElementById('theme-primary-input').value = primaryColor;
        document.getElementById('theme-accent-input').value = accentColor;
        document.getElementById('theme-primary-swatch').style.background = primaryColor;
        document.getElementById('theme-accent-swatch').style.background = accentColor;

        // Bio char count
        this._updateBioCharCount();

        // Update preview
        this._updateProfilePreview();

        modal.classList.add('active');
    }

    _updateBioCharCount() {
        const bio = document.getElementById('profile-bio').value;
        const countEl = document.getElementById('bio-char-current');
        if (countEl) countEl.textContent = bio.length;
    }

    _updateProfilePreview() {
        const name = document.getElementById('profile-display-name').value || this.username;
        const pronouns = document.getElementById('profile-pronouns').value;
        const bio = document.getElementById('profile-bio').value;

        document.getElementById('preview-name').textContent = name;
        document.getElementById('preview-pronouns').textContent = pronouns;
        document.getElementById('preview-bio').textContent = bio || 'No bio set.';

        const avatarEl = document.getElementById('preview-avatar');
        if (this.userPfp) {
            // Keep status dot, replace text/img
            const dot = avatarEl.querySelector('.avatar-status-dot');
            avatarEl.innerHTML = '';
            if (dot) avatarEl.appendChild(dot);
            const img = document.createElement('img');
            img.src = this.userPfp;
            img.className = 'profile-card-avatar-img';
            img.alt = 'pfp';
            avatarEl.appendChild(img);
        } else {
            const dot = avatarEl.querySelector('.avatar-status-dot');
            avatarEl.innerHTML = '';
            if (dot) avatarEl.appendChild(dot);
            avatarEl.appendChild(document.createTextNode(name.charAt(0).toUpperCase()));
        }

        // Update banner preview
        const bannerEl = document.getElementById('preview-banner');
        const bannerImg = this.myProfile.bannerUrl || null;
        const primaryColor = document.getElementById('theme-primary-input').value || this._c.THEME_DEFAULTS.primary;
        const accentColor = document.getElementById('theme-accent-input').value || this._c.THEME_DEFAULTS.accent;

        if (bannerImg) {
            bannerEl.style.backgroundImage = `url(${bannerImg})`;
            bannerEl.style.backgroundSize = 'cover';
            bannerEl.style.backgroundPosition = 'center';
            bannerEl.style.background = `url(${bannerImg}) center/cover`;
        } else {
            bannerEl.style.backgroundImage = 'none';
            bannerEl.style.background = `linear-gradient(to right, ${primaryColor}, ${accentColor})`;
        }

        // Apply theme gradient to entire profile card
        const previewCard = document.getElementById('profile-preview-card');
        if (previewCard) {
            previewCard.style.background = `linear-gradient(to top, ${this._hexToRgba(primaryColor, 0.18)}, ${this._hexToRgba(accentColor, 0.08)})`;
        }
        const avatarBorder = document.getElementById('preview-avatar');
        if (avatarBorder) {
            avatarBorder.style.borderColor = primaryColor;
        }

        // Update nameplate preview
        const nameplateAvatar = document.getElementById('nameplate-avatar');
        const nameplateName = document.getElementById('nameplate-name');
        if (nameplateName) nameplateName.textContent = name;
        if (nameplateAvatar) {
            if (this.userPfp) {
                nameplateAvatar.innerHTML = `<img src="${this.userPfp}" class="nameplate-avatar-img" alt="pfp">`;
            } else {
                nameplateAvatar.textContent = name.charAt(0).toUpperCase();
            }
        }

        // Style nameplate with theme
        const nameplate = document.getElementById('preview-nameplate');
        if (nameplate) {
            nameplate.style.background = `linear-gradient(135deg, ${primaryColor}, ${accentColor})`;
        }

        // Update example button color (solid accent, no gradient)
        const exampleBtn = document.getElementById('preview-example-btn');
        if (exampleBtn) {
            exampleBtn.style.display = 'block';
            exampleBtn.style.background = accentColor;
            exampleBtn.style.color = this._getContrastColor(accentColor);
        }

        // Bio char count
        this._updateBioCharCount();
    }

    _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    _getContrastColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    _adjustBrightness(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16) + amount;
        let g = parseInt(hex.slice(3, 5), 16) + amount;
        let b = parseInt(hex.slice(5, 7), 16) + amount;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }

    /**
     * Convert a Spotify URL (track, album, playlist, artist) to an embed URL.
     * Supports: open.spotify.com/track/ID, /album/ID, /playlist/ID, /artist/ID
     * Returns null if the URL is not a valid Spotify link.
     */
    _getSpotifyEmbedUrl(url) {
        if (!url) return null;
        const match = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
        if (match) {
            const type = match[1];
            const id = match[2];
            return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        }
        return null;
    }

    /**
     * Update the Spotify connect/disconnect UI in the profile editor
     */
    _updateSpotifyConnectUI() {
        const notConnected = document.getElementById('spotify-not-connected');
        const connected = document.getElementById('spotify-connected');
        const userSpan = document.getElementById('spotify-connected-user');

        if (typeof SpotifyAPI !== 'undefined' && SpotifyAPI.isConnected()) {
            notConnected.style.display = 'none';
            connected.style.display = 'flex';
            const savedUser = (this.myProfile.connections || {}).spotifyUser;
            if (userSpan) userSpan.textContent = savedUser ? `(${savedUser})` : '';
        } else {
            notConnected.style.display = 'block';
            connected.style.display = 'none';
        }
    }

    /**
     * Fetch and render the currently playing Spotify track in the profile viewer
     */
    async _pollSpotifyNowPlaying(section, nowPlayingEl, embedEl) {
        if (typeof SpotifyAPI === 'undefined' || !SpotifyAPI.isConnected()) return;

        try {
            const track = await SpotifyAPI.getCurrentlyPlaying();
            if (track && track.isPlaying) {
                this._renderSpotifyNowPlaying(track, section, nowPlayingEl, embedEl);
            } else {
                // Not playing anything right now
                this._stopSpotifyProgressTimer();
                if (nowPlayingEl) nowPlayingEl.style.display = 'none';
                embedEl.innerHTML = `<div class="pv-spotify-offline">Nothing playing right now</div>`;
                section.style.display = 'block';
            }
        } catch (e) {
            console.error('[WigCord] Spotify poll error:', e);
        }
    }

    /**
     * Render a currently playing track in the profile viewer
     */
    _renderSpotifyNowPlaying(track, section, nowPlayingEl, embedEl) {
        if (!nowPlayingEl) return;

        // Show now-playing card, hide static embed
        nowPlayingEl.style.display = 'flex';
        embedEl.innerHTML = '';
        section.style.display = 'block';

        const artEl = document.getElementById('viewer-spotify-art');
        const titleEl = document.getElementById('viewer-spotify-title');
        const artistEl = document.getElementById('viewer-spotify-artist');
        const albumEl = document.getElementById('viewer-spotify-album');
        const progressEl = document.getElementById('viewer-spotify-progress');

        if (artEl) {
            artEl.src = track.albumArtSmall || track.albumArt || '';
            artEl.alt = track.album;
        }
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = `by ${track.artist}`;
        if (albumEl) albumEl.textContent = `on ${track.album}`;
        if (progressEl && track.duration > 0) {
            const pct = Math.min(100, (track.progress / track.duration) * 100);
            progressEl.style.width = `${pct}%`;
        }

        this._startSpotifyProgressTimer(track);
    }

    _stopSpotifyProgressTimer() {
        if (this._spotifyProgressTimer) {
            clearInterval(this._spotifyProgressTimer);
            this._spotifyProgressTimer = null;
        }
    }

    _startSpotifyProgressTimer(track) {
        this._stopSpotifyProgressTimer();

        const progressEl = document.getElementById('viewer-spotify-progress');
        if (!progressEl || !track || !track.duration || track.duration <= 0) return;

        const startedAt = Date.now();
        const baseProgress = Number(track.progress) || 0;
        const duration = Number(track.duration) || 0;

        const tick = () => {
            const elapsed = Date.now() - startedAt;
            const currentProgress = Math.min(duration, baseProgress + elapsed);
            const pct = Math.min(100, (currentProgress / duration) * 100);
            progressEl.style.width = `${pct}%`;
            if (currentProgress >= duration) this._stopSpotifyProgressTimer();
        };

        tick();
        this._spotifyProgressTimer = setInterval(tick, 1000);
    }

    _compressImage(dataUrl, maxWidth, maxHeight, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
                if (h > maxHeight) { w = w * maxHeight / h; h = maxHeight; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    async _saveProfileFromEditor() {
        const td = this._c.THEME_DEFAULTS;
        const profileData = {
            displayName: document.getElementById('profile-display-name').value.trim() || this.username,
            pronouns: document.getElementById('profile-pronouns').value.trim(),
            bio: document.getElementById('profile-bio').value.trim().substring(0, this._c.BIO_MAX_LENGTH),
            theme: {
                primary: document.getElementById('theme-primary-input').value || td.primary,
                accent: document.getElementById('theme-accent-input').value || td.accent
            },
            connections: {
                youtube: document.getElementById('profile-conn-youtube').value.trim(),
                twitter: document.getElementById('profile-conn-twitter').value.trim(),
                twitch: document.getElementById('profile-conn-twitch').value.trim(),
                spotify: document.getElementById('profile-conn-spotify').value.trim()
            }
        };

        // Preserve banner and effect if set
        if (this.myProfile.bannerUrl) profileData.bannerUrl = this.myProfile.bannerUrl;
        if (this.myProfile.profileEffect) profileData.profileEffect = this.myProfile.profileEffect;

        // Invalidate our cached profile so member list picks up the new displayName
        delete this.friendProfiles[this.username];

        await this._saveMyProfile(profileData);
        this._updateUserPanel();
        document.getElementById('profile-editor-modal').classList.remove('active');

        // Refresh the member list so the new display name shows immediately
        if (this.currentView === 'server' && this.currentServer) {
            const server = this.servers.find(s => s.id === this.currentServer);
            if (server) this._renderMemberList(server);
        }
    }

    // =========================================================================
    // UI Setup
    // =========================================================================

    _setupUI() {
        // Server management
        document.getElementById('add-server-btn').addEventListener('click', () => this.openAddServerModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeAddServerModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeAddServerModal());
        document.getElementById('create-server-btn').addEventListener('click', () => this.createServer());

        // Server image upload
        const uploadCircle = document.getElementById('upload-circle');
        const uploadAddBtn = document.getElementById('upload-add-btn');
        const imageInput = document.getElementById('server-image-input');
        const imagePreview = document.getElementById('server-icon-preview');

        uploadCircle.addEventListener('click', () => imageInput.click());
        uploadAddBtn.addEventListener('click', (e) => { e.stopPropagation(); imageInput.click(); });
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.currentServerImage = ev.target.result;
                    imagePreview.src = ev.target.result;
                    imagePreview.style.display = 'block';
                    uploadCircle.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });

        // Invite
        document.getElementById('invite-btn').addEventListener('click', () => this._openInviteModal());
        document.getElementById('welcome-invite').addEventListener('click', () => this._openInviteModal());
        document.getElementById('close-invite-modal').addEventListener('click', () => this._closeInviteModal());
        document.getElementById('close-invite-btn').addEventListener('click', () => this._closeInviteModal());
        document.getElementById('copy-invite').addEventListener('click', () => this._copyInviteLink());

        // Home
        document.getElementById('home-server').addEventListener('click', () => this.switchToDMView());

        // Welcome actions
        document.getElementById('welcome-message').addEventListener('click', () => {
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('messages-container').style.display = 'block';
            document.getElementById('message-input').focus();
        });
        document.getElementById('welcome-customize').addEventListener('click', () => {
            if (this.currentServer) this._openServerSettings(this.currentServer);
        });

        // Message sending
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Reply bar close
        document.getElementById('reply-bar-close').addEventListener('click', () => this._clearReply());

        // DM navigation
        document.getElementById('dm-friends-nav').addEventListener('click', () => this._showDMFriends());
        document.getElementById('dm-requests-nav').addEventListener('click', () => this._showMessageRequests());

        // DM tabs
        ['online', 'all', 'pending', 'blocked', 'add'].forEach(tab => {
            const btn = document.getElementById(`dm-tab-${tab}`);
            if (btn) btn.addEventListener('click', () => this._switchDMTab(tab));
        });

        // Toggle member list
        document.getElementById('toggle-members').addEventListener('click', () => {
            document.getElementById('member-list').classList.toggle('hidden');
        });

        // Context menu
        this._setupContextMenu();

        // Server menu dropdown button (▼)
        document.getElementById('server-menu-btn').addEventListener('click', (e) => {
            if (this.currentServer && this._showContextMenu) {
                const rect = e.target.getBoundingClientRect();
                this._showContextMenu(this.currentServer, rect.left, rect.bottom);
            }
        });

        // Mute/Deafen buttons (cosmetic toggles)
        document.getElementById('btn-mute').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
        });
        document.getElementById('btn-deafen').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
        });

        // Server settings
        this._setupServerSettings();

        // Channel creation
        this._setupChannelCreationModal();

        // Emoji and GIF pickers
        this._setupEmojiPicker();
        this._setupGifPicker();

        // Profile editor
        document.getElementById('btn-user-settings').addEventListener('click', () => this._openProfileEditor());
        document.getElementById('close-profile-editor').addEventListener('click', () => {
            document.getElementById('profile-editor-modal').classList.remove('active');
        });
        document.getElementById('cancel-profile-edit').addEventListener('click', () => {
            document.getElementById('profile-editor-modal').classList.remove('active');
        });
        document.getElementById('save-profile-btn').addEventListener('click', () => this._saveProfileFromEditor());

        // Live preview in profile editor
        ['profile-display-name', 'profile-pronouns', 'profile-bio'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this._updateProfilePreview());
        });

        // Theme color pickers
        document.getElementById('theme-primary-swatch').addEventListener('click', () => {
            document.getElementById('theme-primary-input').click();
        });
        document.getElementById('theme-accent-swatch').addEventListener('click', () => {
            document.getElementById('theme-accent-input').click();
        });
        document.getElementById('theme-primary-input').addEventListener('input', (e) => {
            document.getElementById('theme-primary-swatch').style.background = e.target.value;
            this._updateProfilePreview();
        });
        document.getElementById('theme-accent-input').addEventListener('input', (e) => {
            document.getElementById('theme-accent-swatch').style.background = e.target.value;
            this._updateProfilePreview();
        });

        // Banner upload/remove
        document.getElementById('profile-change-banner').addEventListener('click', () => {
            document.getElementById('profile-banner-input').click();
        });
        document.getElementById('profile-banner-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    // Compress banner image to avoid exceeding Firestore/localStorage limits
                    this._compressImage(ev.target.result, 600, 240, 0.7).then(compressed => {
                        this.myProfile.bannerUrl = compressed;
                        this._updateProfilePreview();
                    });
                };
                reader.readAsDataURL(file);
            }
        });
        document.getElementById('profile-remove-banner').addEventListener('click', () => {
            delete this.myProfile.bannerUrl;
            this._updateProfilePreview();
        });

        // Profile effect (placeholder)
        document.getElementById('profile-change-effect').addEventListener('click', () => {
            alert('Profile effects coming soon! Stay tuned.');
        });
        document.getElementById('profile-remove-effect').addEventListener('click', () => {
            delete this.myProfile.profileEffect;
            this._updateProfilePreview();
        });

        // Profile avatar change
        document.getElementById('profile-change-avatar').addEventListener('click', () => {
            document.getElementById('profile-avatar-input').click();
        });

        // Spotify connect/disconnect
        document.getElementById('spotify-connect-btn').addEventListener('click', async () => {
            if (typeof SpotifyAPI === 'undefined') {
                alert('Spotify integration not loaded.');
                return;
            }
            const success = await SpotifyAPI.login();
            if (success) {
                this._updateSpotifyConnectUI();
                // Save connected state to profile
                const spotifyProfile = await SpotifyAPI.getUserProfile();
                if (spotifyProfile) {
                    this.myProfile.connections = this.myProfile.connections || {};
                    this.myProfile.connections.spotifyConnected = true;
                    this.myProfile.connections.spotifyUser = spotifyProfile.name || spotifyProfile.id;
                    await this._saveMyProfile(this.myProfile);
                }
                // Start global now-playing polling
                this._startGlobalSpotifyPolling();
            }
        });
        document.getElementById('spotify-disconnect-btn').addEventListener('click', async () => {
            if (typeof SpotifyAPI !== 'undefined') {
                SpotifyAPI.disconnect();
            }
            this.myProfile.connections = this.myProfile.connections || {};
            delete this.myProfile.connections.spotifyConnected;
            delete this.myProfile.connections.spotifyUser;
            this.myProfile.connections.spotify = '';
            await this._saveMyProfile(this.myProfile);
            this._updateSpotifyConnectUI();
            // Stop global now-playing polling and clear widget
            if (this._globalSpotifyPollTimer) {
                clearInterval(this._globalSpotifyPollTimer);
                this._globalSpotifyPollTimer = null;
            }
            this._currentTrack = null;
            this._updateUserPanelNowPlaying(null);
        });
        document.getElementById('profile-avatar-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const dataUrl = ev.target.result;
                    // Save ONLY to wigcord_profiles (Wigcord pfp is separate from WigTube)
                    await this._fbSet(`${this._cols.profiles}/${this.username}`, { pfpUrl: dataUrl });
                    // Cache in wigcord-specific localStorage key
                    try { localStorage.setItem(`wigcord-pfp-${this.username}`, dataUrl); } catch(e) {}
                    // Update pfp cache so rendered messages pick it up
                    this._pfpCache[this.username] = dataUrl;
                    try { localStorage.setItem(`wigcord-pfp-cache-${this.username}`, dataUrl); } catch(e) {}
                    this.userPfp = dataUrl;
                    this._updateProfilePreview();
                    this._updateUserPanel();
                };
                reader.readAsDataURL(file);
            }
        });

        // Profile viewer close
        document.getElementById('close-profile-viewer').addEventListener('click', () => {
            document.getElementById('profile-viewer-modal').classList.remove('active');
            if (this._spotifyPollTimer) { clearInterval(this._spotifyPollTimer); this._spotifyPollTimer = null; }
            this._stopSpotifyProgressTimer();
        });

        // Close profile viewer when clicking outside the card
        document.getElementById('profile-viewer-modal').addEventListener('click', (e) => {
            const card = document.getElementById('viewer-profile-card');
            if (card && !card.contains(e.target)) {
                document.getElementById('profile-viewer-modal').classList.remove('active');
                if (this._spotifyPollTimer) { clearInterval(this._spotifyPollTimer); this._spotifyPollTimer = null; }
                this._stopSpotifyProgressTimer();
            }
        });

        // Add DM button
        document.getElementById('add-dm-btn').addEventListener('click', () => {
            this._switchDMTab('add');
        });

        // ESC to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            }
        });
    }

    // =========================================================================
    // Server Settings
    // =========================================================================

    _setupServerSettings() {
        const modal = document.getElementById('server-settings-modal');
        document.getElementById('settings-close-btn').addEventListener('click', () => this._closeServerSettings());
        document.getElementById('settings-back-btn').addEventListener('click', () => this._closeServerSettings());

        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this._loadSettingsTab(item.dataset.tab);
            });
        });
    }

    _openServerSettings(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;
        this.currentSettingsServer = serverId;
        document.getElementById('settings-server-name').textContent = server.name;
        document.getElementById('server-settings-modal').classList.add('active');
        this._loadSettingsTab('overview');
    }

    _closeServerSettings() {
        document.getElementById('server-settings-modal').classList.remove('active');
        this.currentSettingsServer = null;
    }

    _loadSettingsTab(tab) {
        const contentArea = document.getElementById('settings-content-area');
        const preview = document.getElementById('settings-preview');
        const title = document.getElementById('settings-title');

        switch(tab) {
            case 'overview':
                title.textContent = 'SERVER OVERVIEW';
                preview.style.display = 'none';
                contentArea.innerHTML = this._getOverviewContent();
                break;
            case 'roles':
                title.textContent = 'ROLES';
                preview.style.display = 'block';
                contentArea.innerHTML = this._getRolesContent();
                this._initRoleManagement();
                break;
            default:
                title.textContent = tab.toUpperCase().replace(/-/g, ' ');
                preview.style.display = 'none';
                contentArea.innerHTML = `<p>${tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g, ' ')} settings coming soon!</p>`;
        }
    }

    _getOverviewContent() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return '';
        return `
            <div class="role-form-group">
                <label class="role-form-label">SERVER NAME</label>
                <input type="text" class="role-name-input" id="overview-server-name" value="${this._esc(server.name)}">
            </div>
            <div class="role-form-group">
                <label class="role-form-label">SERVER DESCRIPTION</label>
                <textarea class="role-name-input" id="overview-server-desc" rows="4" placeholder="Tell people what your server is about...">${this._esc(server.description || '')}</textarea>
            </div>
            <button class="choose-image-btn" id="save-overview-btn">Save Changes</button>
        `;
    }

    _getRolesContent() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server || !server.roles) return '<p>No roles configured.</p>';

        const PERMISSIONS = this._c.PERMISSIONS;

        let rolesHTML = server.roles.map(role => `
            <div class="role-item" data-role-id="${role.id}">
                <span class="role-color-dot" style="background: ${role.color}"></span>
                <span class="role-name">${this._esc(role.name)}</span>
            </div>
        `).join('');

        return `
            <div class="roles-container">
                <div class="roles-list">
                    <h3 style="font-size: 11px; margin-bottom: 8px;">ROLES</h3>
                    ${rolesHTML}
                    <button class="choose-image-btn" style="margin-top: 8px; width: 100%;" id="create-role-btn">Create Role</button>
                </div>
                <div class="role-editor" id="role-editor">
                    <p style="font-size: 11px; color: #666;">Select a role to edit</p>
                </div>
            </div>
        `;
    }

    _initRoleManagement() {
        document.querySelectorAll('.role-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.role-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this._editRole(item.dataset.roleId);
            });
        });

        const createBtn = document.getElementById('create-role-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this._createNewRole());
        }

        const saveBtn = document.getElementById('save-overview-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this._saveServerOverview());
        }
    }

    _editRole(roleId) {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return;
        const role = server.roles.find(r => r.id === roleId);
        if (!role) return;

        const colors = this._c.ROLE_COLORS;

        const PERMISSIONS = this._c.PERMISSIONS;

        const perms = role.permissions || {};
        const colorsHTML = colors.map(c =>
            `<div class="color-option ${role.color === c ? 'selected' : ''}" style="background: ${c};" data-color="${c}"></div>`
        ).join('');

        const permsHTML = PERMISSIONS.map(p => `
            <div class="permission-row">
                <label class="permission-label">${p.label}</label>
                <button class="toggle-btn" id="perm-${p.key}" data-active="${perms[p.key] ? 'true' : 'false'}" data-perm="${p.key}">
                    <div class="toggle-slider"></div>
                </button>
            </div>
        `).join('');

        document.getElementById('role-editor').innerHTML = `
            <div class="role-tabs">
                <div class="role-tab active">Display</div>
                <div class="role-tab" id="role-tab-permissions">Permissions</div>
            </div>
            <div id="role-display-section">
                <div class="role-form-group">
                    <label class="role-form-label">ROLE NAME *</label>
                    <input type="text" class="role-name-input" id="role-name-edit" value="${this._esc(role.name)}">
                </div>
                <div class="role-form-group">
                    <label class="role-form-label">ROLE COLOR *</label>
                    <div class="role-color-picker" id="role-color-picker">${colorsHTML}</div>
                </div>
                <div class="role-preview-section">
                    <label class="role-form-label">PREVIEW</label>
                    <div class="role-message-preview">
                        <div class="preview-message">
                            <div class="preview-avatar">W</div>
                            <div class="preview-content">
                                <div>
                                    <span class="preview-username" style="color: ${role.color}">Wumpus</span>
                                    <span class="preview-timestamp">Today at 6:47 PM</span>
                                </div>
                                <div class="preview-text">rocks are really old</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="role-permissions-section" style="display:none;">
                <div class="role-form-group">
                    <label class="role-form-label">GENERAL PERMISSIONS</label>
                    ${permsHTML}
                </div>
            </div>
            <button class="choose-image-btn" id="save-role-btn" data-role-id="${roleId}">Save Changes</button>
        `;

        // Color picker
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const previewName = document.querySelector('.preview-username');
                if (previewName) previewName.style.color = opt.dataset.color;
            });
        });

        // Permission toggles
        document.querySelectorAll('.permission-row .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const isActive = btn.dataset.active === 'true';
                btn.dataset.active = isActive ? 'false' : 'true';
            });
        });

        // Tab switching
        document.querySelectorAll('.role-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.id === 'role-tab-permissions') {
                    document.getElementById('role-display-section').style.display = 'none';
                    document.getElementById('role-permissions-section').style.display = 'block';
                } else {
                    document.getElementById('role-display-section').style.display = 'block';
                    document.getElementById('role-permissions-section').style.display = 'none';
                }
            });
        });

        // Save button
        document.getElementById('save-role-btn').addEventListener('click', () => this._saveRole(roleId));
    }

    async _saveRole(roleId) {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return;
        const role = server.roles.find(r => r.id === roleId);
        if (!role) return;

        role.name = document.getElementById('role-name-edit').value.trim() || role.name;
        const selectedColor = document.querySelector('.color-option.selected');
        if (selectedColor) role.color = selectedColor.dataset.color;

        // Gather permissions
        const perms = {};
        document.querySelectorAll('.permission-row .toggle-btn').forEach(btn => {
            perms[btn.dataset.perm] = btn.dataset.active === 'true';
        });
        role.permissions = perms;

        await this._saveServer(server);

        // Refresh
        document.getElementById('settings-content-area').innerHTML = this._getRolesContent();
        this._initRoleManagement();
        alert('Role updated!');
    }

    async _createNewRole() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return;
        const name = prompt('Enter role name:');
        if (!name || !name.trim()) return;

        const newRole = {
            id: 'role-' + Date.now(),
            name: name.trim(),
            color: this._c.ROLE_COLORS[0],
            permissions: this._c._permBase()
        };

        server.roles.push(newRole);
        await this._saveServer(server);

        document.getElementById('settings-content-area').innerHTML = this._getRolesContent();
        this._initRoleManagement();
    }

    async _saveServerOverview() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return;

        server.name = document.getElementById('overview-server-name').value.trim() || server.name;
        server.description = document.getElementById('overview-server-desc').value.trim();
        await this._saveServer(server);
        this._renderServers();
        document.getElementById('server-name').textContent = server.name;
        alert('Server settings saved!');
    }

    // =========================================================================
    // Context Menu
    // =========================================================================

    _setupContextMenu() {
        const contextMenu = document.getElementById('server-context-menu');
        let currentCtxServer = null;

        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) contextMenu.style.display = 'none';
        });

        document.getElementById('ctx-invite-people').addEventListener('click', () => {
            this._openInviteModal();
            contextMenu.style.display = 'none';
        });
        document.getElementById('ctx-server-settings').addEventListener('click', () => {
            this._openServerSettings(currentCtxServer);
            contextMenu.style.display = 'none';
        });
        document.getElementById('ctx-create-channel').addEventListener('click', () => {
            if (currentCtxServer && this._hasPermission(currentCtxServer, 'manageChannels')) {
                this.openChannelCreationModal();
            } else {
                alert('You do not have permission to create channels!');
            }
            contextMenu.style.display = 'none';
        });
        document.getElementById('ctx-create-category').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-create-event').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-notification-settings').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-privacy-settings').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-edit-profile').addEventListener('click', () => {
            this._openProfileEditor();
            contextMenu.style.display = 'none';
        });
        document.getElementById('ctx-hide-muted').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-delete-server').addEventListener('click', () => {
            this.deleteServer(currentCtxServer);
            contextMenu.style.display = 'none';
        });

        this._showContextMenu = (serverId, x, y) => {
            currentCtxServer = serverId;
            // Clamp position to viewport
            const menuW = 220, menuH = 350;
            const maxX = window.innerWidth - menuW;
            const maxY = window.innerHeight - menuH;
            contextMenu.style.left = Math.min(x, maxX) + 'px';
            contextMenu.style.top = Math.min(y, maxY) + 'px';
            contextMenu.style.display = 'block';
        };
    }

    // =========================================================================
    // Channel Creation Modal
    // =========================================================================

    _setupChannelCreationModal() {
        const closeBtn = document.getElementById('close-channel-modal');
        const cancelBtn = document.getElementById('cancel-channel-btn');
        const createBtn = document.getElementById('create-channel-btn-confirm');
        const privateToggle = document.getElementById('private-toggle');
        const channelNamePrefix = document.getElementById('channel-name-prefix');

        document.querySelectorAll('.channel-type-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.channel-type-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                channelNamePrefix.textContent = option.dataset.type === 'text' ? '#' : '🔊';
            });
        });

        privateToggle.addEventListener('click', () => {
            const isActive = privateToggle.dataset.active === 'true';
            privateToggle.dataset.active = isActive ? 'false' : 'true';
        });

        closeBtn.addEventListener('click', () => this.closeChannelCreationModal());
        cancelBtn.addEventListener('click', () => this.closeChannelCreationModal());

        createBtn.addEventListener('click', () => {
            const name = document.getElementById('channel-name-input').value.trim();
            if (!name) { alert('Please enter a channel name!'); return; }
            const type = document.querySelector('.channel-type-option.selected').dataset.type;
            const isPrivate = privateToggle.dataset.active === 'true';
            this.createChannelFromModal(this.currentServer, name, type, isPrivate);
        });

        document.querySelectorAll('.add-channel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.currentServer && this._hasPermission(this.currentServer, 'manageChannels')) {
                    this.openChannelCreationModal();
                } else if (!this.currentServer) {
                    alert('Please select a server first!');
                } else {
                    alert('You do not have permission to create channels!');
                }
            });
        });
    }

    openChannelCreationModal() {
        document.getElementById('create-channel-modal').classList.add('active');
        document.getElementById('channel-name-input').value = '';
        document.getElementById('private-toggle').dataset.active = 'false';
        document.querySelectorAll('.channel-type-option').forEach(o => o.classList.remove('selected'));
        document.querySelector('.channel-type-option[data-type="text"]').classList.add('selected');
        document.getElementById('channel-name-prefix').textContent = '#';
    }

    closeChannelCreationModal() {
        document.getElementById('create-channel-modal').classList.remove('active');
    }

    // =========================================================================
    // Add Server Modal
    // =========================================================================

    openAddServerModal() {
        document.getElementById('add-server-modal').classList.add('active');
        document.getElementById('server-name-input').focus();
    }

    closeAddServerModal() {
        document.getElementById('add-server-modal').classList.remove('active');
        document.getElementById('server-name-input').value = '';
        const preview = document.getElementById('server-icon-preview');
        const uploadCircle = document.getElementById('upload-circle');
        preview.style.display = 'none';
        preview.src = '';
        uploadCircle.style.display = 'flex';
        this.currentServerImage = null;
    }

    // =========================================================================
    // Invite Modal
    // =========================================================================

    async _openInviteModal() {
        if (!this.currentServer) {
            alert('Open a server first to create an invite link.');
            return;
        }

        const code = this._generateInviteCode();
        const invitePath = `${this._c.COLLECTIONS.invites}/${code}`;
        const inviteData = {
            code,
            serverId: this.currentServer,
            createdBy: this.username,
            createdAt: Date.now(),
        };

        await this._fbSet(invitePath, inviteData, true);

        const base = `${window.location.origin}${window.location.pathname}`;
        const url = `${base}?invite=${encodeURIComponent(code)}`;

        document.getElementById('invite-modal').classList.add('active');
        document.getElementById('invite-link').value = url;
    }

    _closeInviteModal() {
        document.getElementById('invite-modal').classList.remove('active');
    }

    _copyInviteLink() {
        const input = document.getElementById('invite-link');
        input.select();
        document.execCommand('copy');
        const btn = document.getElementById('copy-invite');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    }

    _extractInviteCodesFromText(text) {
        if (!text) return [];
        const set = new Set();

        const queryPattern = /[?&]invite=([A-Za-z0-9_-]+)/gi;
        let queryMatch;
        while ((queryMatch = queryPattern.exec(text)) !== null) {
            const code = (queryMatch[1] || '').toUpperCase();
            if (code) set.add(code);
        }

        const pathPattern = /\/invite\/([A-Za-z0-9_-]+)/gi;
        let pathMatch;
        while ((pathMatch = pathPattern.exec(text)) !== null) {
            const code = (pathMatch[1] || '').toUpperCase();
            if (code) set.add(code);
        }

        return Array.from(set);
    }

    async _hydrateInviteEmbed(embedEl, code) {
        if (!embedEl || !code) return;

        const nameEl = embedEl.querySelector('.wc-invite-name');
        const subEl = embedEl.querySelector('.wc-invite-sub');
        const iconEl = embedEl.querySelector('.wc-invite-icon');
        const joinBtn = embedEl.querySelector('.wc-invite-join-btn');

        if (!this._online) {
            if (nameEl) nameEl.textContent = 'Invite unavailable offline';
            if (subEl) subEl.textContent = `Invite code: ${code}`;
            return;
        }

        const invite = await this._fbGet(`${this._c.COLLECTIONS.invites}/${code}`);
        if (!invite || !invite.serverId) {
            if (nameEl) nameEl.textContent = 'Invalid or expired invite';
            if (subEl) subEl.textContent = `Invite code: ${code}`;
            if (joinBtn) joinBtn.disabled = true;
            return;
        }

        const server = this.servers.find(s => s.id === invite.serverId) || await this._fbGet(`${this._cols.servers}/${invite.serverId}`);
        if (!server) {
            if (nameEl) nameEl.textContent = 'Server not found';
            if (subEl) subEl.textContent = `Invite code: ${code}`;
            if (joinBtn) joinBtn.disabled = true;
            return;
        }

        const serverName = server.name || 'Unknown Server';
        if (nameEl) nameEl.textContent = serverName;

        const memberCount = Array.isArray(server.memberList) ? server.memberList.length : Object.keys(server.members || {}).length;
        if (subEl) subEl.textContent = `${memberCount || 0} member${(memberCount || 0) === 1 ? '' : 's'} • Invite code: ${code}`;

        if (iconEl) {
            if (server.icon && typeof server.icon === 'string' && server.icon.startsWith('data:image/')) {
                iconEl.innerHTML = `<img src="${this._esc(server.icon)}" class="wc-invite-icon-img" alt="">`;
            } else {
                const fallback = ((server.icon && server.icon.length <= 2) ? server.icon : serverName.substring(0, 2).toUpperCase()) || '??';
                iconEl.textContent = fallback;
            }
        }

        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.onclick = () => this._showXpInviteJoinPopup(code, serverName);
        }
    }

    _generateInviteCode() {
        return Math.random().toString(36).slice(2, 11).toUpperCase();
    }

    _extractInviteCodeFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const fromQuery = (params.get('invite') || '').trim();
            if (fromQuery) return fromQuery;

            const pathMatch = (window.location.pathname || '').match(/\/invite\/([A-Za-z0-9_-]+)/i);
            return pathMatch ? (pathMatch[1] || '').trim() : '';
        } catch (e) {
            return '';
        }
    }

    _clearInviteCodeFromUrl() {
        try {
            const url = new URL(window.location.href);
            if (!url.searchParams.has('invite')) return;
            url.searchParams.delete('invite');
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        } catch (e) {}
    }

    async _handleInviteFromUrl() {
        const rawCode = this._extractInviteCodeFromUrl();
        if (!rawCode) return;

        const code = rawCode.toUpperCase();
        this._clearInviteCodeFromUrl();

        if (!this._online) {
            alert('Invite links require an online connection.');
            return;
        }

        try {
            const result = await this._joinServerByInviteCode(code);
            if (!result.ok) {
                alert(result.message || 'Failed to join server from invite link.');
                return;
            }
            alert(result.message || 'Joined server successfully!');
        } catch (e) {
            console.error('[WigCord] Invite accept error:', e);
            alert('Failed to join server from invite link.');
        }
    }

    async _joinServerByInviteCode(rawCode) {
        const code = (rawCode || '').trim().toUpperCase();
        if (!code) return { ok: false, message: 'Invalid invite code.' };
        if (!this._online) return { ok: false, message: 'Invite links require an online connection.' };

        const invite = await this._fbGet(`${this._c.COLLECTIONS.invites}/${code}`);
        if (!invite || !invite.serverId) return { ok: false, message: 'This invite link is invalid or expired.' };

        const serverId = invite.serverId;
        const serverDoc = await this._fbGet(`${this._cols.servers}/${serverId}`);
        if (!serverDoc) return { ok: false, message: 'This server no longer exists.' };

        const members = { ...(serverDoc.members || {}) };
        const alreadyMember = !!members[this.username];

        if (!alreadyMember) {
            members[this.username] = { role: 'member', joinedAt: Date.now() };
            const existingMemberList = Array.isArray(serverDoc.memberList) ? serverDoc.memberList : [];
            const memberList = Array.from(new Set([...existingMemberList, this.username]));
            await this._fbSet(`${this._cols.servers}/${serverId}`, { members, memberList }, true);
        }

        await this._loadServers();
        this.switchToServer(serverId);
        return {
            ok: true,
            serverId,
            alreadyMember,
            message: alreadyMember ? 'You are already in this server.' : 'Joined server successfully!'
        };
    }

    _showXpInviteJoinPopup(code, serverName) {
        const overlay = document.createElement('div');
        overlay.className = 'wc-xp-invite-overlay';
        overlay.innerHTML = `
            <div class="wc-xp-invite-popup" role="dialog" aria-modal="true">
                <div class="wc-xp-invite-titlebar">WigCord</div>
                <div class="wc-xp-invite-body">
                    <div class="wc-xp-invite-icon">⚠</div>
                    <div class="wc-xp-invite-text">Join server "${this._esc(serverName)}"?</div>
                </div>
                <div class="wc-xp-invite-actions">
                    <button class="wc-xp-btn" data-action="join">Join Server</button>
                    <button class="wc-xp-btn" data-action="cancel">Cancel</button>
                </div>
            </div>
        `;

        const cleanup = () => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });

        const joinBtn = overlay.querySelector('[data-action="join"]');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');

        if (cancelBtn) cancelBtn.addEventListener('click', cleanup);
        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                joinBtn.disabled = true;
                const result = await this._joinServerByInviteCode(code);
                cleanup();
                alert(result.message || (result.ok ? 'Joined server successfully!' : 'Failed to join server.'));
            });
        }

        document.body.appendChild(overlay);
    }

    // =========================================================================
    // Message Requests View
    // =========================================================================

    _showMessageRequests() {
        document.querySelectorAll('.dm-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('dm-requests-nav').classList.add('active');

        document.getElementById('dm-main-view').style.display = 'none';
        document.getElementById('dm-requests-view').style.display = 'flex';
        document.getElementById('dm-chat-view').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('current-channel').textContent = 'Message Requests';
        document.getElementById('header-icon').textContent = '📨';
        document.getElementById('message-input-area').classList.add('hidden');
        document.getElementById('member-list').classList.add('hidden');
    }

    // =========================================================================
    // Emoji Picker
    // =========================================================================

    _setupEmojiPicker() {
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiGrid = document.getElementById('emoji-grid');

        const emojis = this._c.EMOJIS;

        emojis.forEach(emoji => {
            const el = document.createElement('div');
            el.className = 'emoji-item';
            el.textContent = emoji;
            el.addEventListener('click', () => {
                this._insertEmoji(emoji);
                emojiPicker.style.display = 'none';
            });
            emojiGrid.appendChild(el);
        });

        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = emojiPicker.style.display === 'flex';
            document.getElementById('gif-picker').style.display = 'none';
            emojiPicker.style.display = isVisible ? 'none' : 'flex';
        });

        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    _insertEmoji(emoji) {
        const input = document.getElementById('message-input');
        const pos = input.selectionStart;
        input.value = input.value.substring(0, pos) + emoji + input.value.substring(pos);
        input.focus();
        input.setSelectionRange(pos + emoji.length, pos + emoji.length);
    }

    // =========================================================================
    // GIF Picker
    // =========================================================================

    _setupGifPicker() {
        const gifBtn = document.getElementById('gif-btn');
        const gifPicker = document.getElementById('gif-picker');
        const gifSearch = document.getElementById('gif-search');
        const gifClose = document.getElementById('gif-close');

        gifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = gifPicker.style.display === 'flex';
            document.getElementById('emoji-picker').style.display = 'none';
            gifPicker.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                gifSearch.value = '';
                this._switchGifTab('trending');
            }
        });

        gifClose.addEventListener('click', () => gifPicker.style.display = 'none');

        document.getElementById('gif-tab-trending').addEventListener('click', () => this._switchGifTab('trending'));
        document.getElementById('gif-tab-favorites').addEventListener('click', () => this._switchGifTab('favorites'));

        let searchTimeout;
        gifSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const q = e.target.value.trim();
                if (q) this._searchGifs(q);
                else this.currentGifView === 'trending' ? this._loadTrendingGifs() : this._loadFavoriteGifs();
            }, 500);
        });

        document.addEventListener('click', (e) => {
            if (!gifPicker.contains(e.target) && e.target !== gifBtn) {
                gifPicker.style.display = 'none';
            }
        });
    }

    _switchGifTab(view) {
        this.currentGifView = view;
        document.getElementById('gif-tab-trending').classList.toggle('active', view === 'trending');
        document.getElementById('gif-tab-favorites').classList.toggle('active', view === 'favorites');
        document.getElementById('gif-search').value = '';
        view === 'trending' ? this._loadTrendingGifs() : this._loadFavoriteGifs();
    }

    _getFavoriteGifsStorageKey() {
        return `wigcord_favorite_gifs_${this.username || 'guest'}`;
    }

    _getFavoriteGifs() {
        try {
            const key = this._getFavoriteGifsStorageKey();
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);

            // One-time migration from legacy global key
            const legacy = localStorage.getItem('wigcord_favorite_gifs');
            if (legacy) {
                const parsed = JSON.parse(legacy);
                localStorage.setItem(key, JSON.stringify(parsed));
                localStorage.removeItem('wigcord_favorite_gifs');
                return parsed;
            }
        } catch (e) {}
        return [];
    }

    _saveFavoriteGifs(favs) {
        try {
            const key = this._getFavoriteGifsStorageKey();
            localStorage.setItem(key, JSON.stringify(Array.isArray(favs) ? favs : []));
        } catch (e) {}
    }

    _loadFavoriteGifs() {
        const grid = document.getElementById('gif-grid');
        const favs = this._getFavoriteGifs();
        if (favs.length === 0) {
            grid.innerHTML = '<div class="gif-loading">No favorite GIFs yet. Click ⭐ on any GIF!</div>';
            return;
        }
        grid.innerHTML = '';
        favs.forEach(g => this._createGifElement(g.thumbnail, g.url, g.title, grid, true));
    }

    async _loadTrendingGifs() {
        const grid = document.getElementById('gif-grid');
        grid.innerHTML = '<div class="gif-loading">Loading GIFs...</div>';
        try {
            const resp = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${this._c.GIPHY_API_KEY}&limit=${this._c.GIPHY_LIMIT}&rating=g`);
            const data = await resp.json();
            grid.innerHTML = '';
            (data.data || []).forEach(gif => {
                this._createGifElement(gif.images.fixed_height_small.url, gif.images.fixed_height.url, gif.title, grid, false);
            });
        } catch(e) {
            grid.innerHTML = '<div class="gif-loading">GIF API unavailable. Paste GIF URLs directly!</div>';
        }
    }

    async _searchGifs(query) {
        const grid = document.getElementById('gif-grid');
        grid.innerHTML = '<div class="gif-loading">Searching...</div>';
        try {
            const resp = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${this._c.GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${this._c.GIPHY_LIMIT}&rating=g`);
            const data = await resp.json();
            grid.innerHTML = '';
            if (data.data && data.data.length > 0) {
                data.data.forEach(gif => {
                    this._createGifElement(gif.images.fixed_height_small.url, gif.images.fixed_height.url, gif.title, grid, false);
                });
            } else {
                grid.innerHTML = '<div class="gif-loading">No GIFs found.</div>';
            }
        } catch(e) {
            grid.innerHTML = '<div class="gif-loading">Search unavailable.</div>';
        }
    }

    _createGifElement(thumbUrl, fullUrl, title, container, isFavView) {
        const el = document.createElement('div');
        el.className = 'gif-item';
        const img = document.createElement('img');
        img.src = thumbUrl;
        img.alt = title || 'GIF';

        const favs = this._getFavoriteGifs();
        const isFav = favs.some(f => f.url === fullUrl);

        const favBtn = document.createElement('button');
        favBtn.className = 'gif-favorite-btn' + (isFav ? ' favorited' : '');
        favBtn.innerHTML = '⭐';
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let currentFavs = this._getFavoriteGifs();
            const exists = currentFavs.some(f => f.url === fullUrl);
            if (exists) {
                currentFavs = currentFavs.filter(f => f.url !== fullUrl);
                favBtn.classList.remove('favorited');
            } else {
                currentFavs.unshift({ url: fullUrl, thumbnail: thumbUrl, title });
                favBtn.classList.add('favorited');
            }
            this._saveFavoriteGifs(currentFavs);
            if (isFavView) {
                el.remove();
                if (container.children.length === 0) this._loadFavoriteGifs();
            }
        });

        el.appendChild(img);
        el.appendChild(favBtn);

        el.addEventListener('click', (e) => {
            if (e.target !== favBtn) {
                document.getElementById('message-input').value = fullUrl;
                this.sendMessage();
                document.getElementById('gif-picker').style.display = 'none';
            }
        });

        container.appendChild(el);
    }

    // =========================================================================
    // Utilities
    // =========================================================================

    _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    _linkifyEscapedText(escapedText) {
        if (!escapedText) return '';
        const urlPattern = /\b((?:https?:\/\/|www\.)[^\s<]+)/gi;
        return escapedText.replace(urlPattern, (match) => {
            // Avoid turning raw Giphy media URLs into noisy clickable links/tooltips
            if (/giphy\.com\//i.test(match) || /media\d*\.giphy\.com\//i.test(match) || /i\.giphy\.com\//i.test(match)) {
                return match;
            }
            const href = match.startsWith('www.') ? `https://${match}` : match;
            return `<a href="${href}" class="message-link" target="_blank" rel="noopener noreferrer">${match}</a>`;
        });
    }

    _linkifyEscapedHtml(html) {
        if (!html) return '';
        return html
            .split(/(<[^>]+>)/g)
            .map(part => (part.startsWith('<') ? part : this._linkifyEscapedText(part)))
            .join('');
    }

    _parseEmojis(html) {
        return html.replace(/([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu,
            '<span style="font-size: 16px;">$1</span>');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.wigcord = new WigCord();
});
