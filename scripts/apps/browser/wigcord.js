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
            voicePresence: 'wigcord/data/voicePresence',
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
        MESSAGE_STACK_WINDOW_MS: 3 * 60 * 1000,
        BIO_MAX_LENGTH: 190,
        MAX_CUSTOM_EMOJIS_PER_SERVER: 10,
        MAX_CUSTOM_STICKERS_PER_SERVER: 5,
        SERVER_SAVE_DEBOUNCE_MS: 1500,
        INIT_FALLBACK_TIMEOUT_MS: 1500,
        GIF_SEARCH_DEBOUNCE_MS: 500,

        // GIF provider
        GIPHY_API_KEY: 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh',
        GIPHY_LIMIT: 100,

        // Asset base path (relative to wigcord.html)
        ASSET_BASE: '../../../assets/images/icons/wigcord',

        // Notification ping sound (user-provided file)
        NOTIFICATION_SOUND_SRC: '../../../assets/audio/misc/Reverse Piano Sample - Piano Playing Backwards Effect (mp3cut.net).mp3',

        // Agora voice configuration
        AGORA: {
            ENABLED: true,
            APP_ID: 'c629354328614f25b6448169ab3ed43b',
            // Default to same-origin /agora/token (works on https://wigdos-inc.web.app/)
            TOKEN_ENDPOINT: (typeof window !== 'undefined' && window.location)
                ? `${window.location.protocol}//${window.location.hostname}/agora/token`
                : 'https://wigdos-inc.web.app/agora/token',
            TOKEN_SHARED_SECRET: '',
            PTT_KEY: 'Alt',
            SPEAKING_LEVEL_THRESHOLD: 5,
            HEARTBEAT_INTERVAL_MS: 15000,
            STALE_TIMEOUT_MS: 45000,
            STALE_CLEANUP_COOLDOWN_MS: 10000,
            INACTIVITY_DISCONNECT_MS: 5 * 60 * 1000,
            INACTIVITY_CHECK_INTERVAL_MS: 15000,
            // Encoder/profile hints for audio quality. SDK-specific strings may vary
            ENCODER_CONFIG: 'high_quality',
            // If true, preprocess raw mic with WebAudio GainNode before sending
            USE_WEBAUDIO_PREPROCESSOR: false,
            PREPROCESSOR_GAIN: 1.5,
        },

        // Emoji data URL — loaded at runtime from unicode-emoji-json
        EMOJI_DATA_URL: 'https://cdn.jsdelivr.net/npm/unicode-emoji-json@0.6.0/data-by-group.json',

        // Fallback emojis if CDN fails
        EMOJIS_FALLBACK: [
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

        // Emoji category icons for tab buttons
        EMOJI_CATEGORY_ICONS: {
            'Smileys & Emotion': '😀',
            'People & Body': '👋',
            'Animals & Nature': '🐱',
            'Food & Drink': '🍔',
            'Travel & Places': '✈️',
            'Activities': '⚽',
            'Objects': '💡',
            'Symbols': '❤️',
            'Flags': '🏁',
            'Component': '🔧',
        },

        // Max image upload size (pixels) and quality
        IMAGE_MAX_WIDTH: 800,
        IMAGE_MAX_HEIGHT: 800,
        IMAGE_QUALITY: 0.7,

        // Message action menu config (kept data-driven for easy future extension)
        MESSAGE_ACTION_MENU: {
            order: ['reply', 'pin', 'edit', 'reaction', 'delete'],
            actions: {
                reply: {
                    label: 'Reply',
                    icon: '↩',
                    handler: '_runReplyMessageAction',
                    enabledWhen: '_canReplyToMessage'
                },
                pin: {
                    label: 'Pin Message',
                    icon: '📌',
                    handler: '_runPinMessageAction',
                    enabledWhen: '_canPinMessage'
                },
                edit: {
                    label: 'Edit Message',
                    icon: '✎',
                    handler: '_runEditMessageAction',
                    enabledWhen: '_canEditMessage'
                },
                reaction: {
                    label: 'Add Reaction',
                    icon: '🙂',
                    handler: '_runReactionMessageAction',
                    enabledWhen: '_canReactToMessage'
                },
                delete: {
                    label: 'Delete Message',
                    icon: '✕',
                    handler: '_deleteMessage',
                    enabledWhen: '_canDeleteMessage'
                }
            }
        },

        PINNED_MESSAGES: {
            maxItems: 100,
            fallbackScanLimit: 300,
            previewLength: 140,
        },
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
        this._profileImageEditor = null;

        this.currentServerImage = null;
        this.currentSettingsServer = null;
        this.currentGifView = 'trending';

        // Reply state
        this._replyingTo = null; // { id, author, content }

        // Image upload state
        this._pendingImage = null; // data URL of staged image

        // Emoji data (loaded from CDN)
        this._emojiData = null; // { group: [{ emoji, name }, ...] }
        this._serverCustomEmoji = [];
        this._serverCustomStickers = [];

        // Notification sound
        this._notifSound = null;

        // Notification/unread state
        this._channelMentionCounts = {};      // { "serverId__channelId": number }
        this._serverMentionUnsubs = {};       // { "serverId__channelId": unsubscribeFn }
        this._serverLastMessageIds = {};      // { "serverId__channelId": lastMessageId }
        this._dmUnreadCounts = {};            // { username: number }
        this._dmNotifUnsubs = {};             // { username: unsubscribeFn }
        this._dmLastMessageIds = {};          // { username: lastMessageId }

        // Mention picker state
        this._mentionPickerEl = null;
        this._mentionCandidates = [];
        this._mentionSelectedIndex = -1;
        this._mentionAnchor = null; // { start, end, query }

        // Spotify polling timer (profile viewer)
        this._spotifyPollTimer = null;
        this._spotifyProgressTimer = null;

        // Global Spotify polling (user panel now-playing)
        this._globalSpotifyPollTimer = null;
        this._currentTrack = null;

        // Message action menu and pinning state
        this._messageContextMenuEl = null;
        this._messageContextTarget = null;
        this._reactionProviders = [];
        this._activePinnedMessages = [];

        // Agora voice runtime state
        this._agoraClient = null;
        this._agoraJoinedChannel = null;
        this._localAudioTrack = null;
        this._remoteAudioUsers = {};
        this._voiceMuted = false;
        this._voiceDeafened = false;
        this._pushToTalkEnabled = true;
        this._pttKeyDown = false;
        this._speakingUsers = new Set();
        this._voiceJoinInFlight = false;
        this._voicePresenceUnsubs = {};
        this._voicePresenceByChannel = {};
        this._joinedVoiceServerId = null;
        this._joinedVoiceChannelId = null;
        this._voiceHeartbeatTimer = null;
        this._voiceStaleCleanupAt = {};
        this._voiceInactivityTimer = null;
        this._lastVoiceActivityAt = 0;

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
        this._refreshServerMentionWatchers();

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
                const avatarPos = this._getAvatarObjectPosition(this.myProfile);
                const avatarScale = this._getAvatarZoomScale(this.myProfile);
                const avatarFit = this._getAvatarObjectFit(this.myProfile);
                avatarEl.innerHTML = `<img src="${this.userPfp}" class="user-avatar-img" alt="pfp" style="object-fit:${avatarFit};object-position:${avatarPos};transform:scale(${avatarScale});transform-origin:center;">`;
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

                this.servers = Array.from(allServersMap.values()).map(s => this._normalizeServerData(s));

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
        this._refreshServerMentionWatchers();
    }

    _getLocalServers() {
        try {
            const saved = localStorage.getItem('wigcord-servers');
            return saved ? JSON.parse(saved).map(s => this._normalizeServerData(s)) : [];
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
                this.servers = JSON.parse(saved).map(s => this._normalizeServerData(s));
            } else {
                // Legacy fallback
                const legacy = localStorage.getItem('wigcord-data');
                if (legacy) {
                    const data = JSON.parse(legacy);
                    this.servers = (data.servers || []).map(s => this._normalizeServerData(s));
                }
            }
        } catch(e) { this.servers = []; }
    }

    _normalizeServerData(server) {
        const normalized = { ...(server || {}) };
        if (!Array.isArray(normalized.channels)) normalized.channels = [];
        if (!Array.isArray(normalized.roles)) normalized.roles = [];
        if (!normalized.members || typeof normalized.members !== 'object') normalized.members = {};
        if (!Array.isArray(normalized.customEmojis)) normalized.customEmojis = [];
        if (!Array.isArray(normalized.customStickers)) normalized.customStickers = [];
        return normalized;
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
            customEmojis: [],
            customStickers: [],
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
        this._refreshServerMentionWatchers();
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
        this._refreshServerMentionWatchers();
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
            const mentionCount = this._getServerMentionCount(server.id);
            const badgeHtml = mentionCount > 0
                ? `<span class="server-notification-badge">${this._formatBadgeCount(mentionCount)}</span>`
                : '';

            if (server.icon && server.icon.startsWith && server.icon.startsWith('data:image/')) {
                el.innerHTML = `<img class="server-icon-img" src="${server.icon}" alt="${this._esc(server.name)}">${badgeHtml}`;
            } else {
                const txt = (server.icon && server.icon.length <= 2) ? server.icon : (server.name || '?').substring(0,2).toUpperCase();
                el.innerHTML = `<div class="server-icon server-icon-text">${this._esc(txt)}</div>${badgeHtml}`;
            }

            el.addEventListener('click', () => this.switchToServer(server.id));
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._showContextMenu(server.id, e.pageX, e.pageY);
            });
            serverList.appendChild(el);
        });

        this._updateHomeServerBadge();
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
        this._hideMessageContextMenu();

        document.querySelectorAll('.server-item, .server-home').forEach(el => el.classList.remove('active'));
        document.getElementById('home-server').classList.add('active');

        document.getElementById('server-name').textContent = 'WigCord Home';
        document.getElementById('dm-navigation').style.display = 'block';
        document.getElementById('invite-section').style.display = 'none';
        document.getElementById('channel-category').style.display = 'none';
        document.getElementById('voice-category').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('voice-channel-view').style.display = 'none';
        document.getElementById('dm-chat-view').style.display = 'none';
        document.getElementById('member-list').classList.add('hidden');
        this._updateServerActionVisibility(null);
        this._renderVoiceRoomPanel();

        this._updatePinnedButtonVisibility();

        this._showDMFriends();
    }

    async switchToServer(serverId) {
        this._unsubMessages();
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        this.currentServer = serverId;
        this.currentView = 'server';
        this.currentDmPartner = null;
        this._hideMessageContextMenu();
        this._serverCustomEmoji = this._getServerCustomEmoji(serverId);
        this._serverCustomStickers = this._getServerCustomStickers(serverId);

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
        document.getElementById('voice-channel-view').style.display = 'none';

        // Show channel list + member list
        document.getElementById('channel-category').style.display = 'block';
        document.getElementById('voice-category').style.display = 'block';
        document.getElementById('member-list').classList.remove('hidden');
        document.getElementById('message-input-area').classList.remove('hidden');
        this._updateServerActionVisibility(serverId);

        this._renderChannels(server);
        this._renderMemberList(server);
        this._startVoicePresenceWatchers(server);
        this._renderVoiceRoomPanel();

        // Default to general text channel
        const firstText = (server.channels || []).find(c => c.type === 'text');
        if (firstText) {
            this.switchToChannel(firstText.id);
        } else {
            document.getElementById('welcome-screen').style.display = 'flex';
            document.getElementById('messages-container').style.display = 'none';
            this._updatePinnedButtonVisibility();
        }
    }

    async switchToChannel(channelId) {
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
        this._hideMessageContextMenu();
        this._clearChannelMention(this.currentServer, channelId);

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
        document.getElementById('dm-main-view').style.display = 'none';
        document.getElementById('dm-requests-view').style.display = 'none';
        document.getElementById('dm-chat-view').style.display = 'none';

        if (channel.type === 'voice') {
            document.getElementById('messages-container').style.display = 'none';
            document.getElementById('voice-channel-view').style.display = 'flex';
            document.getElementById('message-input-area').classList.add('no-send');
            document.getElementById('message-input').placeholder = 'Connected to voice channel';
            document.getElementById('message-input').disabled = true;
            await this._joinVoiceChannel(channelId);
            await this._renderVoiceChannelView(channelId);
            this._updatePinnedButtonVisibility();
            return;
        }

        document.getElementById('messages-container').style.display = 'block';
        document.getElementById('voice-channel-view').style.display = 'none';

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
        this._updatePinnedButtonVisibility();
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
                const connectedMembers = this._getConnectedVoiceMembers(ch.id);
                const countHtml = connectedMembers.length > 0
                    ? `<span class="channel-voice-count">${connectedMembers.length}</span>`
                    : '';
                chEl.innerHTML = `<span class="channel-icon"><img src="${this._c.ASSET_BASE}/speaker.svg" class="wc-icon-xs" alt="Voice"></span><span class="channel-name">${this._esc(ch.name)}</span>${countHtml}`;
                voiceContainer.appendChild(chEl);
            } else {
                chEl.innerHTML = `<span class="channel-icon">#</span><span class="channel-name">${this._esc(ch.name)}</span>`;
                textContainer.appendChild(chEl);
            }

            chEl.addEventListener('click', () => this.switchToChannel(ch.id));
        });
    }

    _getJoinedVoiceContext() {
        if (!this._joinedVoiceServerId || !this._joinedVoiceChannelId) return null;
        const server = this.servers.find((s) => s.id === this._joinedVoiceServerId);
        if (!server) return null;
        const channel = (server.channels || []).find((c) => c.id === this._joinedVoiceChannelId);
        if (!channel) return null;
        return { server, channel };
    }

    _renderVoiceAvatarContent(username, profile = {}) {
        const displayName = profile.displayName || username;
        const pfp = profile.pfpUrl || ((username === this.username && this.userPfp) ? this.userPfp : null);
        const letter = String(displayName || '?').charAt(0).toUpperCase();
        const avatarPos = this._getAvatarObjectPosition(profile);
        const avatarScale = this._getAvatarZoomScale(profile);
        const avatarFit = this._getAvatarObjectFit(profile);

        if (!pfp) return this._esc(letter || '?');

        return `<img src="${pfp}" alt="avatar" style="object-fit:${avatarFit};object-position:${avatarPos};transform:scale(${avatarScale});transform-origin:center;">`;
    }

    async _renderVoiceRoomPanel() {
        const panel = document.getElementById('voice-room-panel');
        const titleEl = document.getElementById('voice-room-title');
        const subtitleEl = document.getElementById('voice-room-subtitle');
        const countEl = document.getElementById('voice-room-count');
        const membersEl = document.getElementById('voice-room-members');
        if (!panel || !titleEl || !subtitleEl || !countEl || !membersEl) return;

        const context = this._getJoinedVoiceContext();
        if (!context) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        titleEl.textContent = `${context.channel.name}`;

        let members = this._getConnectedVoiceMembers(context.channel.id);
        if (this.username && !members.some((m) => m.username === this.username)) {
            members = [{ username: this.username }, ...members];
        }

        const uniqueMembers = Array.from(new Map(members.map((m) => [m.username, m])).values());
        countEl.textContent = String(uniqueMembers.length);
        subtitleEl.textContent = `${uniqueMembers.length} connected`;

        if (!uniqueMembers.length) {
            membersEl.innerHTML = '<div class="voice-room-empty">No one is connected.</div>';
            return;
        }

        const profileMap = {};
        await Promise.all(uniqueMembers.map(async (entry) => {
            profileMap[entry.username] = await this._loadUserProfile(entry.username);
        }));

        membersEl.innerHTML = uniqueMembers.map((entry) => {
            const username = entry.username;
            const profile = profileMap[username] || {};
            const displayName = profile.displayName || username;
            const speaking = this._speakingUsers.has(String(username || '').toLowerCase());
            return `
                <div class="voice-room-member${speaking ? ' speaking' : ''}" data-username="${this._esc(username)}">
                    <div class="voice-room-avatar">${this._renderVoiceAvatarContent(username, profile)}</div>
                    <div class="voice-room-member-name">${this._esc(displayName)}</div>
                </div>
            `;
        }).join('');
    }

    async _renderVoiceChannelView(channelId = null) {
        const viewEl = document.getElementById('voice-channel-view');
        const gridEl = document.getElementById('voice-stage-grid');
        if (!viewEl || !gridEl) return;

        if (!this.currentServer || !this.currentChannel) {
            viewEl.style.display = 'none';
            return;
        }

        const server = this.servers.find((s) => s.id === this.currentServer);
        const resolvedId = channelId || this.currentChannel;
        const channel = (server?.channels || []).find((c) => c.id === resolvedId);
        if (!server || !channel || channel.type !== 'voice') {
            viewEl.style.display = 'none';
            return;
        }

        viewEl.style.display = 'flex';

        let members = this._getConnectedVoiceMembers(channel.id);
        if (this.username && !members.some((m) => m.username === this.username) && this._joinedVoiceChannelId === channel.id) {
            members = [{ username: this.username }, ...members];
        }

        const uniqueMembers = Array.from(new Map(members.map((m) => [m.username, m])).values());

        if (!uniqueMembers.length) {
            gridEl.innerHTML = '<div class="voice-stage-empty">No one is in this voice channel yet.</div>';
            return;
        }

        const profileMap = {};
        await Promise.all(uniqueMembers.map(async (entry) => {
            profileMap[entry.username] = await this._loadUserProfile(entry.username);
        }));

        gridEl.innerHTML = uniqueMembers.map((entry) => {
            const username = entry.username;
            const profile = profileMap[username] || {};
            const displayName = profile.displayName || username;
            const speaking = this._speakingUsers.has(String(username || '').toLowerCase());

            return `
                <div class="voice-stage-card${speaking ? ' speaking' : ''}" data-username="${this._esc(username)}">
                    <div class="voice-stage-avatar">${this._renderVoiceAvatarContent(username, profile)}</div>
                    <div class="voice-stage-name">${this._esc(displayName)}</div>
                </div>
            `;
        }).join('');
    }

    _getVoicePresenceDocId(serverId, channelId) {
        const raw = `${serverId || ''}__${channelId || ''}`;
        return raw.replace(/[^A-Za-z0-9_-]/g, '_') || 'voice_presence';
    }

    _getVoicePresencePath(serverId, channelId) {
        const docId = this._getVoicePresenceDocId(serverId, channelId);
        return `${this._cols.voicePresence}/${docId}`;
    }

    _clearVoicePresenceWatchers() {
        Object.values(this._voicePresenceUnsubs || {}).forEach((unsub) => {
            try { if (typeof unsub === 'function') unsub(); } catch (e) {}
        });
        this._voicePresenceUnsubs = {};
        this._voicePresenceByChannel = {};
        this._voiceStaleCleanupAt = {};
    }

    _isVoicePresenceFresh(state, now = Date.now()) {
        if (!state || !state.connected) return false;
        const updatedAt = Number(state.updatedAt || 0);
        if (!updatedAt) return false;
        return (now - updatedAt) <= this._c.AGORA.STALE_TIMEOUT_MS;
    }

    _scheduleStaleVoiceCleanup(serverId, channelId, staleUsernames) {
        if (!Array.isArray(staleUsernames) || !staleUsernames.length) return;
        const key = `${serverId}__${channelId}`;
        const now = Date.now();
        const lastAt = Number(this._voiceStaleCleanupAt[key] || 0);
        if (now - lastAt < this._c.AGORA.STALE_CLEANUP_COOLDOWN_MS) return;

        this._voiceStaleCleanupAt[key] = now;
        this._cleanupStaleVoiceMembers(serverId, channelId, staleUsernames).catch((error) => {
            console.warn('[WigCord] Stale voice cleanup failed:', error);
        });
    }

    async _cleanupStaleVoiceMembers(serverId, channelId, usernames) {
        if (!this._online || !this._fb || !serverId || !channelId) return;
        const members = this._voicePresenceByChannel[channelId] || {};
        const now = Date.now();
        const patch = {};

        usernames.forEach((username) => {
            const prev = members[username];
            if (!prev || !prev.connected) return;
            patch[username] = {
                ...prev,
                connected: false,
                updatedAt: now,
                staleClearedAt: now,
            };
        });

        if (!Object.keys(patch).length) return;

        this._voicePresenceByChannel[channelId] = {
            ...members,
            ...patch,
        };

        const path = this._getVoicePresencePath(serverId, channelId);
        await this._fbSet(path, { members: patch }, true);
    }

    _startVoicePresenceWatchers(server) {
        this._clearVoicePresenceWatchers();
        if (!this._online || !this._fb || !server) return;

        const voiceChannels = (server.channels || []).filter((ch) => ch.type === 'voice');
        if (!voiceChannels.length) return;

        const { doc, onSnapshot } = this._fb;

        voiceChannels.forEach((channel) => {
            const path = this._getVoicePresencePath(server.id, channel.id);
            const docRef = doc(this._fb.db, ...path.split('/'));

            this._voicePresenceUnsubs[channel.id] = onSnapshot(docRef, (snapshot) => {
                const data = snapshot.exists() ? snapshot.data() : {};
                const members = (data && typeof data.members === 'object' && data.members) ? data.members : {};
                this._voicePresenceByChannel[channel.id] = members;

                const now = Date.now();
                const staleUsers = Object.entries(members)
                    .filter(([uname, state]) => {
                        if (!state || !state.connected) return false;
                        const isSelfConnected = uname === this.username
                            && this._joinedVoiceServerId === server.id
                            && this._joinedVoiceChannelId === channel.id;
                        if (isSelfConnected) return false;
                        return !this._isVoicePresenceFresh(state, now);
                    })
                    .map(([uname]) => uname);

                this._scheduleStaleVoiceCleanup(server.id, channel.id, staleUsers);

                if (this.currentServer === server.id) {
                    this._renderChannels(server);
                    this._renderMemberList(server);
                }

                this._renderVoiceRoomPanel();
                if (this.currentServer === server.id && this.currentChannel === channel.id) {
                    this._renderVoiceChannelView(channel.id);
                }
            }, (error) => {
                console.error('[WigCord] Voice presence listener error:', error);
            });
        });
    }

    _getConnectedVoiceMembers(channelId) {
        const members = this._voicePresenceByChannel[channelId] || {};
        return Object.entries(members)
            .filter(([, state]) => this._isVoicePresenceFresh(state))
            .map(([username, state]) => ({ username, ...state }));
    }

    _getUserVoiceChannelInServer(server, username) {
        if (!server || !username) return null;
        const voiceChannels = (server.channels || []).filter((ch) => ch.type === 'voice');
        for (const channel of voiceChannels) {
            const members = this._voicePresenceByChannel[channel.id] || {};
            const state = members[username];
            if (this._isVoicePresenceFresh(state)) {
                return { id: channel.id, name: channel.name, ...state };
            }
        }
        return null;
    }

    async _setMyVoicePresenceState(serverId, channelId, connected) {
        if (!this._online || !this._fb || !serverId || !channelId || !this.username) return;

        const path = this._getVoicePresencePath(serverId, channelId);
        const members = this._voicePresenceByChannel[channelId] || {};
        const previous = members[this.username] || {};

        const payload = {
            username: this.username,
            channelId,
            connected: !!connected,
            muted: !!this._voiceMuted,
            deafened: !!this._voiceDeafened,
            ptt: !!this._pushToTalkEnabled,
            updatedAt: Date.now(),
            joinedAt: previous.joinedAt || Date.now(),
        };

        this._voicePresenceByChannel[channelId] = {
            ...members,
            [this.username]: payload,
        };

        await this._fbSet(path, { members: { [this.username]: payload } }, true);
    }

    _syncMyVoicePresenceState() {
        if (!this._joinedVoiceServerId || !this._joinedVoiceChannelId) return;
        this._setMyVoicePresenceState(this._joinedVoiceServerId, this._joinedVoiceChannelId, true).catch((error) => {
            console.error('[WigCord] Voice presence sync error:', error);
        });
        this._renderVoiceRoomPanel();
    }

    _startVoicePresenceHeartbeat() {
        this._stopVoicePresenceHeartbeat();
        if (!this._joinedVoiceServerId || !this._joinedVoiceChannelId) return;

        this._voiceHeartbeatTimer = setInterval(() => {
            this._syncMyVoicePresenceState();
        }, this._c.AGORA.HEARTBEAT_INTERVAL_MS);
    }

    _stopVoicePresenceHeartbeat() {
        if (!this._voiceHeartbeatTimer) return;
        clearInterval(this._voiceHeartbeatTimer);
        this._voiceHeartbeatTimer = null;
    }

    _noteVoiceActivity() {
        this._lastVoiceActivityAt = Date.now();
    }

    _startVoiceInactivityMonitor() {
        this._stopVoiceInactivityMonitor();
        if (!this._agoraJoinedChannel) return;

        this._noteVoiceActivity();
        this._voiceInactivityTimer = setInterval(() => {
            if (!this._agoraJoinedChannel) return;
            const timeoutMs = Number(this._c.AGORA.INACTIVITY_DISCONNECT_MS || 0);
            if (timeoutMs <= 0) return;
            if ((Date.now() - this._lastVoiceActivityAt) < timeoutMs) return;

            this._leaveVoiceChannel().then(() => {
                this._updateVoiceButtonsUI();
                alert('Disconnected from voice due to inactivity.');
            }).catch((error) => {
                console.warn('[WigCord] Voice inactivity disconnect warning:', error);
            });
        }, this._c.AGORA.INACTIVITY_CHECK_INTERVAL_MS);
    }

    _stopVoiceInactivityMonitor() {
        if (!this._voiceInactivityTimer) return;
        clearInterval(this._voiceInactivityTimer);
        this._voiceInactivityTimer = null;
    }

    _getAgoraUid() {
        const cleaned = String(this.username || 'guest')
            .trim()
            .replace(/[^A-Za-z0-9_-]/g, '_')
            .slice(0, 64);
        return cleaned || 'guest';
    }

    _getAgoraChannelName(serverId, channelId) {
        const base = `${serverId || ''}__${channelId || ''}`;
        return base.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64) || 'wigcord_voice';
    }

    _getAgoraTokenEndpointCandidates() {
        const cfg = this._c.AGORA || {};
        const candidates = [];

        const runtimeOverride = String(localStorage.getItem('wigcordAgoraTokenEndpoint') || '').trim();
        if (runtimeOverride) return [runtimeOverride];

        const configured = String(cfg.TOKEN_ENDPOINT || '').trim();
        if (configured) candidates.push(configured);

        try {
            const loc = window.location;
            const pageProtocol = loc.protocol === 'https:' ? 'https:' : 'http:';
            const pageHostname = loc.hostname || 'localhost';

            // Try same-origin serverless or proxied endpoint first (e.g. https://your-site/agora/token)
            candidates.push(`${pageProtocol}//${pageHostname}/agora/token`);

            if (pageHostname.endsWith('github.dev')) {
                const forwardedHost = pageHostname.replace(/-\d+\./, '-3010.');
                candidates.push(`https://${forwardedHost}/agora/token`);
            } else {
                // Legacy local dev fallback on port 3010
                candidates.push(`${pageProtocol}//${pageHostname}:3010/agora/token`);
                if (pageHostname === 'localhost') {
                    candidates.push('http://127.0.0.1:3010/agora/token');
                }
            }
        } catch (e) {
            candidates.push('http://localhost:3010/agora/token');
            candidates.push('http://127.0.0.1:3010/agora/token');
        }

        return Array.from(new Set(candidates.filter(Boolean)));
    }

    async _fetchAgoraJoinToken(channelName, uid) {
        const cfg = this._c.AGORA || {};
        const endpoints = this._getAgoraTokenEndpointCandidates();
        if (!endpoints.length) throw new Error('Agora token endpoint is not configured.');

        const headers = { 'Content-Type': 'application/json' };
        if (cfg.TOKEN_SHARED_SECRET) {
            headers['x-wigcord-token-secret'] = cfg.TOKEN_SHARED_SECRET;
        }

        let lastError = null;
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ channelName, uid }),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data?.ok || !data?.token) {
                    const reason = data?.error || `HTTP ${res.status}`;
                    throw new Error(`${reason} (${endpoint})`);
                }

                return {
                    token: data.token,
                    appId: data.appId || cfg.APP_ID,
                };
            } catch (error) {
                lastError = error;
            }
        }

        const suffix = lastError ? ` Last error: ${lastError.message || String(lastError)}` : '';
        throw new Error(`Unable to reach Agora token server.${suffix}`);
    }

    async _ensureAgoraClient() {
        if (this._agoraClient) return this._agoraClient;
        if (!window.AgoraRTC) throw new Error('Agora SDK is not loaded.');

        this._agoraClient = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        this._agoraClient.on('user-published', async (user, mediaType) => {
            try {
                await this._agoraClient.subscribe(user, mediaType);
                if (mediaType === 'audio' && user.audioTrack) {
                    this._remoteAudioUsers[String(user.uid)] = user;
                    user.audioTrack.play();
                    if (this._voiceDeafened) {
                        user.audioTrack.setVolume(0);
                    }
                }
            } catch (error) {
                console.error('[WigCord] Agora subscribe error:', error);
            }
        });

        this._agoraClient.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'audio') {
                delete this._remoteAudioUsers[String(user.uid)];
                this._markSpeakingState(String(user.uid), false);
            }
        });

        this._agoraClient.on('user-left', (user) => {
            delete this._remoteAudioUsers[String(user.uid)];
            this._markSpeakingState(String(user.uid), false);
        });

        this._agoraClient.enableAudioVolumeIndicator();
        this._agoraClient.on('volume-indicator', (volumes) => {
            // Lightweight debug to inspect raw levels in DevTools
            if (typeof console !== 'undefined' && console.debug) {
                console.debug('[Agora volume-indicator]', volumes);
            }

            (volumes || []).forEach((entry) => {
                const uid = String(entry.uid);
                const rawLevel = Number(entry.level || 0);

                // Use configured threshold but auto-convert if scales are mismatched (0..1 vs 0..100)
                let threshold = Number(this._c.AGORA.SPEAKING_LEVEL_THRESHOLD || 0);
                if (threshold > 1 && rawLevel <= 1) {
                    threshold = threshold / 100;
                } else if (threshold <= 1 && rawLevel > 1) {
                    threshold = threshold * 100;
                }

                const isSpeaking = rawLevel >= threshold;
                this._markSpeakingState(uid, isSpeaking);
            });
        });

        return this._agoraClient;
    }

    _syncLocalTrackEnabled() {
        if (!this._localAudioTrack) return;
        const shouldEnable = !this._voiceMuted && (!this._pushToTalkEnabled || this._pttKeyDown);
        this._localAudioTrack.setEnabled(shouldEnable);
    }

    async _createPreprocessedTrack(mediaStreamTrack) {
        // Creates a small WebAudio pipeline to apply gain before sending to Agora.
        // Returns an AudioMediaStreamTrack suitable for Agora.createCustomAudioTrack.
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const srcStream = new MediaStream([mediaStreamTrack]);
            const source = audioCtx.createMediaStreamSource(srcStream);
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = Number(this._c.AGORA.PREPROCESSOR_GAIN || 1.0);
            source.connect(gainNode);
            const dest = audioCtx.createMediaStreamDestination();
            gainNode.connect(dest);
            // Keep references to allow cleanup on leave
            this._audioProcessing = { audioCtx, gainNode, dest };
            return dest.stream.getAudioTracks()[0];
        } catch (err) {
            console.warn('[WigCord] _createPreprocessedTrack failed:', err);
            return mediaStreamTrack;
        }
    }

    async _joinVoiceChannel(channelId) {
        if (!this._c.AGORA?.ENABLED) return;
        if (this._voiceJoinInFlight) return;
        if (!this._online) {
            alert('Voice channels require an online connection.');
            return;
        }

        const serverId = this.currentServer;
        if (!serverId || !channelId) return;
        const channelName = this._getAgoraChannelName(serverId, channelId);

        if (this._agoraJoinedChannel === channelName) {
            this._updateVoiceButtonsUI();
            return;
        }

        this._voiceJoinInFlight = true;
        try {
            await this._leaveVoiceChannel();

            const uid = this._getAgoraUid();
            const tokenData = await this._fetchAgoraJoinToken(channelName, uid);
            const appId = tokenData.appId || this._c.AGORA.APP_ID;

            const client = await this._ensureAgoraClient();
            await client.join(appId, channelName, tokenData.token, uid);

            // Prefer explicit getUserMedia so we can disable browser AGC/NS and control encoder
            let mediaStream = null;
            try {
                const chosenDeviceId = this._selectedMicDeviceId || undefined;
                const audioConstraints = {
                    sampleRate: 48000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: false,
                    autoGainControl: false,
                };
                if (chosenDeviceId) audioConstraints.deviceId = { exact: chosenDeviceId };

                mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
                this._localRawMediaStream = mediaStream;
            } catch (err) {
                console.warn('[WigCord] getUserMedia failed, falling back to Agora helper:', err);
            }

            if (!mediaStream) {
                // Fallback to SDK helper if getUserMedia failed or isn't supported
                this._localAudioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
            } else {
                const rawTrack = mediaStream.getAudioTracks()[0];
                let trackToSend = rawTrack;
                if (this._c.AGORA?.USE_WEBAUDIO_PREPROCESSOR) {
                    try {
                        trackToSend = await this._createPreprocessedTrack(rawTrack);
                    } catch (err) {
                        console.warn('[WigCord] Preprocessor failed, using raw track', err);
                        trackToSend = rawTrack;
                    }
                }

                const createParams = { mediaStreamTrack: trackToSend };
                if (this._c.AGORA?.ENCODER_CONFIG) createParams.encoderConfig = this._c.AGORA.ENCODER_CONFIG;
                this._localAudioTrack = await window.AgoraRTC.createCustomAudioTrack(createParams);
            }

            this._syncLocalTrackEnabled();
            await client.publish([this._localAudioTrack]);

            this._agoraJoinedChannel = channelName;
            this._joinedVoiceServerId = serverId;
            this._joinedVoiceChannelId = channelId;
            this._noteVoiceActivity();
            this._updateVoiceButtonsUI();
            await this._setMyVoicePresenceState(serverId, channelId, true);
            this._startVoicePresenceHeartbeat();
            this._startVoiceInactivityMonitor();
            await this._renderVoiceRoomPanel();
            await this._renderVoiceChannelView(channelId);
        } catch (error) {
            console.error('[WigCord] Voice join failed:', error);
            alert(`Voice connect failed. ${error?.message || 'Check Agora token server or set AGORA.TOKEN_ENDPOINT.'}`);
        } finally {
            this._voiceJoinInFlight = false;
        }
    }

    async _leaveVoiceChannel() {
        const previousServerId = this._joinedVoiceServerId;
        const previousChannelId = this._joinedVoiceChannelId;

        this._stopVoicePresenceHeartbeat();
        this._stopVoiceInactivityMonitor();

        if (this._agoraClient && this._agoraJoinedChannel) {
            try {
                if (this._localAudioTrack) {
                    this._localAudioTrack.stop();
                    this._localAudioTrack.close();
                    this._localAudioTrack = null;
                }
                if (this._localRawMediaStream) {
                    try {
                        this._localRawMediaStream.getTracks().forEach((t) => t.stop());
                    } catch (e) {
                        console.warn('[WigCord] Error stopping raw media stream:', e);
                    }
                    this._localRawMediaStream = null;
                }
                if (this._audioProcessing && this._audioProcessing.audioCtx) {
                    try {
                        await this._audioProcessing.audioCtx.close();
                    } catch (e) {
                        /* ignore */
                    }
                    this._audioProcessing = null;
                }
                await this._agoraClient.leave();
            } catch (error) {
                console.warn('[WigCord] Agora leave warning:', error);
            } finally {
                this._agoraJoinedChannel = null;
                this._remoteAudioUsers = {};
                this._speakingUsers.clear();
                this._joinedVoiceServerId = null;
                this._joinedVoiceChannelId = null;
                document.querySelectorAll('.member-item.voice-speaking').forEach((node) => {
                    node.classList.remove('voice-speaking');
                });
            }
        } else {
            this._agoraJoinedChannel = null;
            this._remoteAudioUsers = {};
            this._speakingUsers.clear();
            this._joinedVoiceServerId = null;
            this._joinedVoiceChannelId = null;
            document.querySelectorAll('.member-item.voice-speaking').forEach((node) => {
                node.classList.remove('voice-speaking');
            });
        }

        if (previousServerId && previousChannelId) {
            await this._setMyVoicePresenceState(previousServerId, previousChannelId, false);
        }

        this._renderVoiceRoomPanel();
        this._renderVoiceChannelView();
    }

    _markSpeakingState(uid, isSpeaking) {
        const normalized = String(uid || '').toLowerCase();
        if (!normalized) return;

        if (isSpeaking && normalized === this._getAgoraUid().toLowerCase()) {
            this._noteVoiceActivity();
        }

        if (isSpeaking) {
            this._speakingUsers.add(normalized);
        } else {
            this._speakingUsers.delete(normalized);
        }

        const node = document.querySelector(`.member-item[data-username="${this._esc(uid)}"]`) ||
            Array.from(document.querySelectorAll('.member-item[data-username]')).find((el) =>
                String(el.dataset.username || '').toLowerCase() === normalized
            );

        if (node) {
            node.classList.toggle('voice-speaking', !!isSpeaking);
        }

        const voiceRoomNode = Array.from(document.querySelectorAll('.voice-room-member[data-username]')).find((el) =>
            String(el.dataset.username || '').toLowerCase() === normalized
        );
        if (voiceRoomNode) {
            voiceRoomNode.classList.toggle('speaking', !!isSpeaking);
        }

        const stageNode = Array.from(document.querySelectorAll('.voice-stage-card[data-username]')).find((el) =>
            String(el.dataset.username || '').toLowerCase() === normalized
        );
        if (stageNode) {
            stageNode.classList.toggle('speaking', !!isSpeaking);
        }
    }

    _updateVoiceButtonsUI() {
        const muteBtn = document.getElementById('btn-mute');
        const deafenBtn = document.getElementById('btn-deafen');
        const leaveBtn = document.getElementById('btn-leave-vc');
        const inVoice = !!this._agoraJoinedChannel;
        if (muteBtn) muteBtn.classList.toggle('active', !!this._voiceMuted);
        if (deafenBtn) deafenBtn.classList.toggle('active', !!this._voiceDeafened);
        if (leaveBtn) leaveBtn.disabled = !inVoice;
    }

    async _leaveVoiceFromControl() {
        if (!this._agoraJoinedChannel) return;
        await this._leaveVoiceChannel();

        if (this.currentView === 'server' && this.currentServer) {
            const server = this.servers.find((s) => s.id === this.currentServer);
            const activeChannel = (server && server.channels || []).find((c) => c.id === this.currentChannel);
            if (activeChannel && activeChannel.type === 'voice') {
                const firstText = (server.channels || []).find((c) => c.type === 'text');
                if (firstText) {
                    await this.switchToChannel(firstText.id);
                } else {
                    document.getElementById('welcome-screen').style.display = 'flex';
                    document.getElementById('messages-container').style.display = 'none';
                }
            }
        }

        this._updateVoiceButtonsUI();
    }

    async _toggleVoiceMute() {
        if (!this._localAudioTrack) {
            alert('Join a voice channel first.');
            return;
        }
        this._voiceMuted = !this._voiceMuted;
        this._syncLocalTrackEnabled();
        this._updateVoiceButtonsUI();
        this._syncMyVoicePresenceState();
    }

    _toggleVoiceDeafen() {
        this._voiceDeafened = !this._voiceDeafened;
        Object.values(this._remoteAudioUsers).forEach((user) => {
            if (user && user.audioTrack) {
                user.audioTrack.setVolume(this._voiceDeafened ? 0 : 100);
            }
        });
        this._updateVoiceButtonsUI();
        this._syncMyVoicePresenceState();
    }

    _handlePushToTalkKeyDown(event) {
        if (!this._pushToTalkEnabled) return;
        if (!this._localAudioTrack) return;
        if (event.key !== this._c.AGORA.PTT_KEY) return;
        if (event.repeat) return;
        this._pttKeyDown = true;
        this._noteVoiceActivity();
        this._syncLocalTrackEnabled();
    }

    _handlePushToTalkKeyUp(event) {
        if (!this._pushToTalkEnabled) return;
        if (!this._localAudioTrack) return;
        if (event.key !== this._c.AGORA.PTT_KEY) return;
        this._pttKeyDown = false;
        this._syncLocalTrackEnabled();
    }

    // =========================================================================
    // Real-time Messages with Pagination
    // =========================================================================

    _getChannelKey(serverId, channelId) {
        return `${serverId}__${channelId}`;
    }

    _escapeRegex(text) {
        return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    _hasUserMention(messageData) {
        if (!messageData || messageData.isSystem) return false;
        const rawContent = String(messageData.content || messageData.text || '');
        const uname = String(this.username || '').trim();
        if (!uname) return false;
        const mentionRe = new RegExp(`(^|[^A-Za-z0-9_])@${this._escapeRegex(uname)}(?![A-Za-z0-9_])`, 'i');
        const isMention = mentionRe.test(rawContent);
        const isReplyToMe = messageData.replyTo && String(messageData.replyTo.author || '').toLowerCase() === uname.toLowerCase();
        return isMention || isReplyToMe;
    }

    _isMentionableUsername(username) {
        const target = String(username || '').trim().toLowerCase();
        if (!target) return false;

        if (this.currentView === 'server' && this.currentServer) {
            const server = this.servers.find(s => s.id === this.currentServer);
            const memberNames = Object.keys((server && server.members) || {});
            return memberNames.some(name => String(name || '').toLowerCase() === target);
        }

        if (this.currentView === 'dm-chat') {
            const me = String(this.username || '').toLowerCase();
            const partner = String(this.currentDmPartner || '').toLowerCase();
            return target === me || target === partner;
        }

        // Fallback: still highlight @tokens outside specific chat contexts.
        return true;
    }

    _highlightMentionsInEscapedHtml(escapedHtml) {
        if (!escapedHtml) return escapedHtml;
        return escapedHtml.replace(/(^|[^A-Za-z0-9_])@([A-Za-z0-9_]+)/g, (full, prefix, user) => {
            if (!this._isMentionableUsername(user)) return full;
            return `${prefix}<span class="message-mention">@${this._esc(user)}</span>`;
        });
    }

    _formatBadgeCount(n) {
        const count = Number(n) || 0;
        return count > 99 ? '99+' : String(count);
    }

    _getServerMentionCount(serverId) {
        let total = 0;
        const prefix = `${serverId}__`;
        Object.entries(this._channelMentionCounts).forEach(([channelKey, count]) => {
            if (channelKey.startsWith(prefix)) total += Number(count) || 0;
        });
        return total;
    }

    _getTotalDmUnreadCount() {
        return Object.values(this._dmUnreadCounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }

    _incrementChannelMention(serverId, channelId, amount = 1) {
        if (!serverId || !channelId || amount <= 0) return;
        const key = this._getChannelKey(serverId, channelId);
        this._channelMentionCounts[key] = (this._channelMentionCounts[key] || 0) + amount;
        this._renderServers();
    }

    _clearChannelMention(serverId, channelId) {
        if (!serverId || !channelId) return;
        const key = this._getChannelKey(serverId, channelId);
        if (this._channelMentionCounts[key]) {
            delete this._channelMentionCounts[key];
            this._renderServers();
        }
    }

    _incrementDmUnread(username, amount = 1) {
        if (!username || amount <= 0) return;
        this._dmUnreadCounts[username] = (this._dmUnreadCounts[username] || 0) + amount;
        this._renderServers();
        this._renderDMList();
    }

    _clearDmUnread(username) {
        if (!username) return;
        if (this._dmUnreadCounts[username]) {
            delete this._dmUnreadCounts[username];
            this._renderServers();
            this._renderDMList();
        }
    }

    _updateHomeServerBadge() {
        const homeEl = document.getElementById('home-server');
        if (!homeEl) return;

        const existing = homeEl.querySelector('.server-notification-badge');
        if (existing) existing.remove();

        const dmUnread = this._getTotalDmUnreadCount();
        if (dmUnread > 0) {
            const badge = document.createElement('span');
            badge.className = 'server-notification-badge';
            badge.textContent = this._formatBadgeCount(dmUnread);
            homeEl.appendChild(badge);
        }
    }

    _clearServerMentionWatchers() {
        Object.values(this._serverMentionUnsubs).forEach(unsub => {
            try { if (typeof unsub === 'function') unsub(); } catch(e) {}
        });
        this._serverMentionUnsubs = {};
        this._serverLastMessageIds = {};
    }

    _refreshServerMentionWatchers() {
        this._clearServerMentionWatchers();
        if (!this._online || !this._fb || !Array.isArray(this.servers)) return;

        const { collection, query, orderBy, limit, onSnapshot } = this._fb;

        this.servers.forEach(server => {
            const channels = (server.channels || []).filter(ch => ch.type === 'text');
            channels.forEach(channel => {
                const channelKey = this._getChannelKey(server.id, channel.id);
                const colRef = collection(this._fb.db, this._cols.messages, channelKey, 'msgs');
                const q = query(colRef, orderBy('timestamp', 'desc'), limit(1));

                this._serverMentionUnsubs[channelKey] = onSnapshot(q, (snapshot) => {
                    if (snapshot.empty) return;

                    const latest = snapshot.docs[0];
                    const latestId = latest.id;
                    const previousId = this._serverLastMessageIds[channelKey];
                    this._serverLastMessageIds[channelKey] = latestId;

                    // Skip initial snapshot so old messages do not create false unread counters.
                    if (!previousId || previousId === latestId) return;

                    const data = latest.data();
                    if (!data || data.author === this.username || data.isSystem) return;
                    if (!this._hasUserMention(data)) return;

                    const isCurrentChannel = this.currentView === 'server'
                        && this.currentServer === server.id
                        && this.currentChannel === channel.id;
                    if (isCurrentChannel) return;

                    this._incrementChannelMention(server.id, channel.id);
                    this._playNotificationSound();
                }, err => {
                    console.error('[WigCord] Mention watcher error:', err);
                });
            });
        });
    }

    _clearDmNotificationWatchers() {
        Object.values(this._dmNotifUnsubs).forEach(unsub => {
            try { if (typeof unsub === 'function') unsub(); } catch(e) {}
        });
        this._dmNotifUnsubs = {};
        this._dmLastMessageIds = {};
    }

    _refreshDmNotificationWatchers() {
        this._clearDmNotificationWatchers();
        if (!this._online || this.username === 'guest' || !this._fb) return;

        const { collection, query, orderBy, limit, onSnapshot } = this._fb;
        const acceptedFriends = Object.entries(this.friends || {}).filter(([, data]) => data.status === 'accepted');

        acceptedFriends.forEach(([friendName]) => {
            const dmId = this._getDmId(this.username, friendName);
            const colRef = collection(this._fb.db, this._cols.dms, dmId, 'messages');
            const q = query(colRef, orderBy('timestamp', 'desc'), limit(1));

            this._dmNotifUnsubs[friendName] = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) return;

                const latest = snapshot.docs[0];
                const latestId = latest.id;
                const previousId = this._dmLastMessageIds[friendName];
                this._dmLastMessageIds[friendName] = latestId;

                // Skip initial snapshot so old DMs do not create false unread counters.
                if (!previousId || previousId === latestId) return;

                const data = latest.data();
                if (!data || data.author === this.username || data.isSystem) return;

                const isCurrentDm = this.currentView === 'dm-chat' && this.currentDmPartner === friendName;
                if (isCurrentDm) return;

                this._incrementDmUnread(friendName);
                this._playNotificationSound();
            }, err => {
                console.error('[WigCord] DM watcher error:', err);
            });
        });
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
                            const isCurrentChannel = this.currentView === 'server'
                                && this.currentServer === serverId
                                && this.currentChannel === channelId;
                            if (!isCurrentChannel && this._hasUserMention(d)) {
                                this._incrementChannelMention(serverId, channelId);
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

            this._renderMessageList(messagesEl, msgs);

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

    _toTimestampMs(timestamp) {
        if (!timestamp) return NaN;
        if (timestamp.toDate) return timestamp.toDate().getTime();
        if (timestamp.seconds) return Number(timestamp.seconds) * 1000;
        if (typeof timestamp === 'number') return timestamp;
        const parsed = new Date(timestamp).getTime();
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    _shouldStackWithPreviousMessage(prevMsg, msg) {
        if (!prevMsg || !msg) return false;
        if (prevMsg.isSystem || msg.isSystem) return false;
        if (prevMsg.author !== msg.author) return false;
        if (prevMsg.replyTo || msg.replyTo) return false;

        const prevTs = this._toTimestampMs(prevMsg.timestamp);
        const currTs = this._toTimestampMs(msg.timestamp);
        if (!Number.isFinite(prevTs) || !Number.isFinite(currTs)) return false;

        const delta = currTs - prevTs;
        return delta >= 0 && delta <= this._c.MESSAGE_STACK_WINDOW_MS;
    }

    _renderMessageList(container, msgs) {
        container.innerHTML = '';
        let prevMsg = null;
        msgs.forEach(msg => {
            const stackWithPrevious = this._shouldStackWithPreviousMessage(prevMsg, msg);
            this._renderMessage(container, msg, { stackWithPrevious });
            prevMsg = msg;
        });
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
                let prevOlder = null;
                olderMsgs.forEach(msg => {
                    const stackWithPrevious = this._shouldStackWithPreviousMessage(prevOlder, msg);
                    this._renderMessage(fragment, msg, { stackWithPrevious });
                    prevOlder = msg;
                });
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

    _renderMessage(container, msg, options = {}) {
        const stackWithPrevious = !!options.stackWithPrevious;
        const el = document.createElement('div');
        el.className = 'message'
            + (msg.isSystem ? ' system-message' : '')
            + (msg.replyTo ? ' has-reply' : '')
            + (stackWithPrevious ? ' message-stacked' : '');
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

        const rawContent = msg.content || msg.text || '';
        const contentWithoutInviteLinks = this._stripInviteLinksFromText(rawContent);
        let messageHTML = this._esc(contentWithoutInviteLinks);

        // Detect GIF/media URLs (including Giphy media links)
        const gifUrlPattern = /(https?:\/\/(?:[^\s]+\.gif(?:\?[^\s]*)?|media\d*\.giphy\.com\/[^\s]+|i\.giphy\.com\/[^\s]+))/gi;
        const gifUrls = contentWithoutInviteLinks.match(gifUrlPattern);
        if (gifUrls) {
            messageHTML = this._esc(contentWithoutInviteLinks.replace(gifUrlPattern, '').trim());
            gifUrls.forEach(url => {
                messageHTML += `<img src="${this._esc(url)}" class="message-gif" alt="GIF">`;
            });
        }

        // Detect YouTube URLs and build embeds (thumbnail preview to avoid error 153 in nested iframes)
        const ytPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})[^\s]*/gi;
        let ytMatch;
        const ytEmbeds = [];
        while ((ytMatch = ytPattern.exec(contentWithoutInviteLinks)) !== null) {
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
        while ((wtMatch = wtPattern.exec(contentWithoutInviteLinks)) !== null) {
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
        messageHTML = this._highlightMentionsInEscapedHtml(messageHTML);
        messageHTML = this._linkifyEscapedHtml(messageHTML);
        messageHTML = this._parseCustomServerEmojis(messageHTML);

        messageHTML = this._parseEmojis(messageHTML);

        // Render attached image if present
        let imageHTML = '';
        if (msg.imageUrl) {
            imageHTML = `<img src="${this._esc(msg.imageUrl)}" class="message-image" alt="Image" loading="lazy">`;
        }

        // Append video embeds after the message text
        const embedsHTML = [...ytEmbeds, ...wtEmbeds, ...inviteEmbeds].join('');

        const timeStr = msg.timestamp ? this._formatTime(msg.timestamp) : '';
        const authorName = msg.author || 'System';
        const editedHtml = msg.editedAt ? '<span class="message-edited-tag">(edited)</span>' : '';
        const pinnedHtml = msg.isPinned ? '<span class="message-pinned-indicator" title="Pinned message">📌</span>' : '';
        const actionsHTML = '';

        if (stackWithPrevious) {
            el.innerHTML = `
                <div class="message-row message-row-stacked">
                    <div class="message-content message-content-stacked">
                        <div class="message-stack-line">
                            <div class="message-text">${messageHTML}${editedHtml}${pinnedHtml}</div>
                            ${actionsHTML}
                        </div>
                        ${imageHTML}
                        ${embedsHTML}
                    </div>
                </div>
            `;
        } else {
            el.innerHTML = `
                ${replyHTML}
                <div class="message-row">
                    ${avatarHTML}
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author" data-username="${this._esc(authorName)}">${this._esc(authorName)}</span>
                            <span class="message-time">${timeStr}</span>
                            ${editedHtml}
                            ${pinnedHtml}
                            ${actionsHTML}
                        </div>
                        <div class="message-text">${messageHTML}</div>
                        ${imageHTML}
                        ${embedsHTML}
                    </div>
                </div>
            `;
        }

        // Click on author name or avatar to view profile
        if (!msg.isSystem && !stackWithPrevious) {
            const authorEl = el.querySelector('.message-author');
            if (authorEl) {
                authorEl.addEventListener('click', () => this._openProfileViewer(authorName));
            }
            const avatarEl = el.querySelector('.message-avatar');
            if (avatarEl) {
                avatarEl.style.cursor = 'pointer';
                avatarEl.addEventListener('click', () => this._openProfileViewer(authorName));
            }
        }

        if (!msg.isSystem) {
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._showMessageContextMenu(msg, e.clientX, e.clientY);
            });
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
                    const profile = msg.author === this.username ? this.myProfile : (this.friendProfiles[msg.author] || {});
                    const avatarPos = this._getAvatarObjectPosition(profile);
                    const avatarScale = this._getAvatarZoomScale(profile);
                    const avatarFit = this._getAvatarObjectFit(profile);
                    avEl.innerHTML = `<img src="${pfp}" class="msg-avatar-img" alt="pfp" style="object-fit:${avatarFit};object-position:${avatarPos};transform:scale(${avatarScale});transform-origin:center;">`;
                    avEl.classList.remove('msg-avatar-letter');
                }
            });
        }

        // Async: resolve reply ref avatar
        if (msg.replyTo && msg.replyTo.author) {
            this._getUserPfp(msg.replyTo.author).then(pfp => {
                const refAvEl = document.getElementById(`reply-avatar-${msg.id}`);
                if (refAvEl && pfp) {
                    const profile = msg.replyTo.author === this.username ? this.myProfile : (this.friendProfiles[msg.replyTo.author] || {});
                    const avatarPos = this._getAvatarObjectPosition(profile);
                    const avatarScale = this._getAvatarZoomScale(profile);
                    const avatarFit = this._getAvatarObjectFit(profile);
                    refAvEl.innerHTML = `<img src="${pfp}" class="reply-ref-avatar-img" alt="" style="object-fit:${avatarFit};object-position:${avatarPos};transform:scale(${avatarScale});transform-origin:center;">`;
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

    _setupMessageContextMenu() {
        this._messageContextMenuEl = document.getElementById('message-context-menu');
        if (!this._messageContextMenuEl) return;

        document.addEventListener('click', (e) => {
            if (!this._messageContextMenuEl) return;
            if (this._messageContextMenuEl.style.display !== 'block') return;
            if (!this._messageContextMenuEl.contains(e.target)) {
                this._hideMessageContextMenu();
            }
        });

        window.addEventListener('resize', () => this._hideMessageContextMenu());
        window.addEventListener('scroll', () => this._hideMessageContextMenu(), true);
    }

    _hideMessageContextMenu() {
        if (this._messageContextMenuEl) this._messageContextMenuEl.style.display = 'none';
        this._messageContextTarget = null;
    }

    _canReplyToMessage(msg) {
        return !!msg && !msg.isSystem;
    }

    _canPinMessage(msg) {
        if (!msg || msg.isSystem) return false;
        if (this.currentView === 'server' && this.currentServer) {
            return this._hasPermission(this.currentServer, 'manageMessages');
        }
        if (this.currentView === 'dm-chat') {
            return true;
        }
        return false;
    }

    _canEditMessage(msg) {
        if (!msg || msg.isSystem) return false;
        return msg.author === this.username;
    }

    _canReactToMessage(msg) {
        return !!msg && !msg.isSystem;
    }

    _getMessageActionLabel(actionId, msg) {
        if (actionId === 'pin') {
            return msg && msg.isPinned ? 'Unpin Message' : 'Pin Message';
        }
        const def = this._c.MESSAGE_ACTION_MENU.actions[actionId];
        return (def && def.label) || actionId;
    }

    _buildMessageContextActions(msg) {
        const menu = this._c.MESSAGE_ACTION_MENU || {};
        const order = menu.order || [];
        const defs = menu.actions || {};

        return order
            .map((actionId) => {
                const def = defs[actionId];
                if (!def) return null;

                const enabledCheck = def.enabledWhen;
                if (enabledCheck && typeof this[enabledCheck] === 'function' && !this[enabledCheck](msg)) {
                    return null;
                }

                return {
                    id: actionId,
                    label: this._getMessageActionLabel(actionId, msg),
                    icon: def.icon || '',
                    handler: def.handler,
                };
            })
            .filter(Boolean);
    }

    _showMessageContextMenu(msg, x, y) {
        if (!this._messageContextMenuEl || !msg || msg.isSystem) return;

        const actions = this._buildMessageContextActions(msg);
        if (!actions.length) return;

        this._messageContextTarget = msg;

        const itemsEl = document.getElementById('message-context-items');
        if (!itemsEl) return;
        itemsEl.innerHTML = '';

        actions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.innerHTML = `
                <span class="ctx-label">${this._esc(action.label)}</span>
                <span class="ctx-icon">${this._esc(action.icon)}</span>
            `;
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                this._hideMessageContextMenu();
                const handlerName = action.handler;
                if (handlerName && typeof this[handlerName] === 'function') {
                    await this[handlerName](msg);
                }
            });
            itemsEl.appendChild(item);
        });

        const menu = this._messageContextMenuEl;
        menu.style.display = 'block';
        menu.style.left = '0px';
        menu.style.top = '0px';

        const rect = menu.getBoundingClientRect();
        const maxX = Math.max(0, window.innerWidth - rect.width - 4);
        const maxY = Math.max(0, window.innerHeight - rect.height - 4);
        menu.style.left = `${Math.min(x, maxX)}px`;
        menu.style.top = `${Math.min(y, maxY)}px`;
    }

    _getActiveMessageCollectionPath() {
        if (this.currentView === 'server' && this.currentServer && this.currentChannel) {
            const channelKey = this._getChannelKey(this.currentServer, this.currentChannel);
            return `${this._cols.messages}/${channelKey}/msgs`;
        }
        if (this.currentView === 'dm-chat' && this.currentDmPartner) {
            const dmId = this._getDmId(this.username, this.currentDmPartner);
            return `${this._cols.dms}/${dmId}/messages`;
        }
        return '';
    }

    _getActiveMessageDocumentPath(messageId) {
        const colPath = this._getActiveMessageCollectionPath();
        if (!colPath || !messageId) return '';
        return `${colPath}/${messageId}`;
    }

    async _setMessagePinned(messageId, shouldPin) {
        const docPath = this._getActiveMessageDocumentPath(messageId);
        if (!docPath) return;

        const patch = shouldPin
            ? { isPinned: true, pinnedAt: Date.now(), pinnedBy: this.username }
            : { isPinned: false, pinnedAt: null, pinnedBy: null };

        await this._fbUpdate(docPath, patch);
    }

    async _runReplyMessageAction(msg) {
        if (!this._canReplyToMessage(msg)) return;
        this._setReplyTo(msg);
    }

    async _runPinMessageAction(msg) {
        if (!this._canPinMessage(msg)) return;
        await this._setMessagePinned(msg.id, !msg.isPinned);
        if (document.getElementById('pinned-messages-modal')?.classList.contains('active')) {
            await this._refreshPinnedMessagesModal();
        }
    }

    async _runEditMessageAction(msg) {
        if (!this._canEditMessage(msg)) return;

        const existing = String(msg.content || msg.text || '');
        const next = prompt('Edit message', existing);
        if (next === null) return;

        const trimmed = next.trim();
        if (!trimmed) {
            if (confirm('Edited message cannot be empty. Delete this message instead?')) {
                await this._deleteMessage(msg);
            }
            return;
        }
        if (trimmed === existing) return;

        const path = this._getActiveMessageDocumentPath(msg.id);
        if (!path) return;

        await this._fbUpdate(path, {
            content: trimmed,
            editedAt: Date.now(),
            editedBy: this.username,
        });
    }

    registerMessageReactionProvider(providerFn) {
        if (typeof providerFn !== 'function') return;
        this._reactionProviders.push(providerFn);
    }

    async _runReactionMessageAction(msg) {
        if (!this._canReactToMessage(msg)) return;

        for (const provider of this._reactionProviders) {
            try {
                const handled = await provider({
                    message: msg,
                    context: {
                        view: this.currentView,
                        serverId: this.currentServer,
                        channelId: this.currentChannel,
                        dmPartner: this.currentDmPartner,
                    }
                });
                if (handled) return;
            } catch (err) {
                console.error('[WigCord] Reaction provider error:', err);
            }
        }

        document.dispatchEvent(new CustomEvent('wigcord:reaction-requested', {
            detail: {
                messageId: msg.id,
                serverId: this.currentServer,
                channelId: this.currentChannel,
                dmPartner: this.currentDmPartner,
                author: msg.author,
            }
        }));
    }

    _setupPinnedMessagesUI() {
        const openBtn = document.getElementById('open-pinned-btn');
        const modal = document.getElementById('pinned-messages-modal');
        const closeBtn = document.getElementById('close-pinned-messages');
        if (!openBtn || !modal || !closeBtn) return;

        openBtn.addEventListener('click', async () => {
            await this._openPinnedMessagesModal();
        });

        closeBtn.addEventListener('click', () => this._closePinnedMessagesModal());
        modal.addEventListener('click', (e) => {
            const content = modal.querySelector('.pinned-messages-content');
            if (content && !content.contains(e.target)) {
                this._closePinnedMessagesModal();
            }
        });
    }

    _updatePinnedButtonVisibility() {
        const btn = document.getElementById('open-pinned-btn');
        if (!btn) return;

        const inServerThread = this.currentView === 'server' && !!this.currentServer && !!this.currentChannel;
        const inDmThread = this.currentView === 'dm-chat' && !!this.currentDmPartner;
        btn.style.display = (inServerThread || inDmThread) ? 'inline-flex' : 'none';
    }

    async _openPinnedMessagesModal() {
        const modal = document.getElementById('pinned-messages-modal');
        if (!modal) return;
        await this._refreshPinnedMessagesModal();
        modal.classList.add('active');
    }

    _closePinnedMessagesModal() {
        const modal = document.getElementById('pinned-messages-modal');
        if (modal) modal.classList.remove('active');
    }

    async _loadPinnedMessagesForActiveThread() {
        if (!this._online || !this._fb) return [];

        const colPath = this._getActiveMessageCollectionPath();
        if (!colPath) return [];

        const { collection, query, orderBy, limit, getDocs, where } = this._fb;
        if (!collection || !query || !getDocs || !orderBy || !limit) return [];

        const colRef = collection(this._fb.db, ...colPath.split('/'));
        const pinned = [];

        if (where) {
            try {
                const qPinned = query(
                    colRef,
                    where('isPinned', '==', true),
                    orderBy('pinnedAt', 'desc'),
                    limit(this._c.PINNED_MESSAGES.maxItems)
                );
                const snap = await getDocs(qPinned);
                snap.forEach(doc => pinned.push({ id: doc.id, ...doc.data() }));
            } catch (err) {
                console.warn('[WigCord] Pinned query fallback:', err);
            }
        }

        if (!pinned.length) {
            const scanQuery = query(colRef, orderBy('timestamp', 'desc'), limit(this._c.PINNED_MESSAGES.fallbackScanLimit));
            const scanSnap = await getDocs(scanQuery);
            scanSnap.forEach(doc => {
                const data = doc.data() || {};
                if (data.isPinned) pinned.push({ id: doc.id, ...data });
            });
            pinned.sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
        }

        return pinned;
    }

    async _refreshPinnedMessagesModal() {
        const listEl = document.getElementById('pinned-messages-list');
        if (!listEl) return;

        const pinned = await this._loadPinnedMessagesForActiveThread();
        this._activePinnedMessages = pinned;

        if (!pinned.length) {
            listEl.innerHTML = '<p class="pinned-empty">No pinned messages in this conversation yet.</p>';
            return;
        }

        listEl.innerHTML = '';
        pinned.forEach((msg) => {
            const item = document.createElement('div');
            item.className = 'pinned-message-item';

            const content = String(msg.content || msg.text || msg.imageUrl || '').trim();
            const preview = content.length > this._c.PINNED_MESSAGES.previewLength
                ? `${content.slice(0, this._c.PINNED_MESSAGES.previewLength)}...`
                : content || '[Attachment]';

            item.innerHTML = `
                <div class="pinned-message-main">
                    <div class="pinned-message-meta">
                        <span class="pinned-message-author">${this._esc(msg.author || 'Unknown')}</span>
                        <span class="pinned-message-time">${this._esc(this._formatTime(msg.timestamp || msg.pinnedAt || Date.now()))}</span>
                    </div>
                    <div class="pinned-message-preview">${this._esc(preview)}</div>
                </div>
                <div class="pinned-message-actions">
                    <button class="pinned-jump-btn" data-action="jump">Jump</button>
                    <button class="pinned-remove-btn" data-action="unpin" title="Unpin">×</button>
                </div>
            `;

            const jumpBtn = item.querySelector('[data-action="jump"]');
            const unpinBtn = item.querySelector('[data-action="unpin"]');

            if (jumpBtn) {
                jumpBtn.addEventListener('click', () => this._jumpToMessageById(msg.id));
            }
            if (unpinBtn) {
                unpinBtn.addEventListener('click', async () => {
                    await this._setMessagePinned(msg.id, false);
                    await this._refreshPinnedMessagesModal();
                });
            }

            listEl.appendChild(item);
        });
    }

    _jumpToMessageById(messageId) {
        if (!messageId) return;

        const target = Array.from(document.querySelectorAll('.message')).find(el => el.dataset.msgId === messageId);
        if (!target) {
            alert('Message is not loaded yet. Scroll up to load older messages and try again.');
            return;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('message-highlight');
        setTimeout(() => target.classList.remove('message-highlight'), 1500);
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
                this._notifSound = new Audio(encodeURI(this._c.NOTIFICATION_SOUND_SRC));
                this._notifSound.preload = 'auto';
                this._notifSound.volume = 1.0;
            }

            // Clone so fast consecutive pings are all audible.
            const sound = this._notifSound.cloneNode(true);
            sound.volume = this._notifSound.volume;
            sound.play().catch(() => {});
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
        const hasImage = !!this._pendingImage;
        if (!text && !hasImage) return;

        if (this.currentView === 'dm-chat' && this.currentDmPartner) {
            await this._sendDMMessage(text);
            input.value = '';
            this._clearPendingImage();
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

        // Attach image if pending
        if (this._pendingImage) {
            msgData.imageUrl = this._pendingImage;
            this._clearPendingImage();
        }

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

    _canOpenServerSettings(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return false;
        if (server.ownerId === this.username) return true;
        return this._hasPermission(serverId, 'manageRoles') || this._hasPermission(serverId, 'manageChannels');
    }

    _canManageMemberRoles(serverId, targetUsername) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server || !targetUsername) return false;
        if (!server.members || !server.members[targetUsername]) return false;
        if (targetUsername === server.ownerId) return false;
        if (targetUsername === this.username) return false;
        return server.ownerId === this.username || this._hasPermission(serverId, 'manageRoles');
    }

    async _assignMemberRole(serverId, targetUsername, roleId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;
        if (!this._canManageMemberRoles(serverId, targetUsername)) {
            alert('You do not have permission to manage this member role.');
            return;
        }

        const roleExists = (server.roles || []).some(r => r.id === roleId);
        if (!roleExists || roleId === 'owner') {
            alert('Invalid role selection.');
            return;
        }

        server.members[targetUsername].role = roleId;
        await this._saveServer(server);
        if (this.currentServer === serverId) {
            this._renderMemberList(server);
        }
    }

    _getServerCustomEmoji(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        return Array.isArray(server && server.customEmojis) ? server.customEmojis : [];
    }

    _getServerCustomStickers(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        return Array.isArray(server && server.customStickers) ? server.customStickers : [];
    }

    _updateServerActionVisibility(serverId) {
        const canManageChannels = !!serverId && this._hasPermission(serverId, 'manageChannels');
        document.querySelectorAll('.add-channel-btn').forEach(btn => {
            btn.style.display = canManageChannels ? 'inline-flex' : 'none';
        });
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
        this._startVoicePresenceWatchers(server);
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
            const voiceChannel = this._getUserVoiceChannelInServer(server, uname);
            const entry = { username: uname, ...data, profile: profileMap[uname] || {}, voiceChannel };
            if (uname === this.username || !!voiceChannel) {
                onlineMembers.push(entry);
            } else {
                offlineMembers.push(entry);
            }
        });

        let html = `<div class="member-header">ONLINE — ${onlineMembers.length}</div>`;
        onlineMembers.forEach(m => {
            const isOwner = m.role === 'owner' || server.ownerId === m.username;
            html += this._renderMemberItem(m.username, true, isOwner, m.role, m.profile, m.voiceChannel);
        });

        html += `<div class="member-header">OFFLINE — ${offlineMembers.length}</div>`;
        offlineMembers.forEach(m => {
            const isOwner = m.role === 'owner' || server.ownerId === m.username;
            html += this._renderMemberItem(m.username, false, isOwner, m.role, m.profile, m.voiceChannel);
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
    _renderMemberItem(username, online, isOwner, role, profile = {}, voiceChannel = null) {
        const displayName = profile.displayName || username;
        const pfp = profile.pfpUrl || ((username === this.username && this.userPfp) ? this.userPfp : null);
        const inVoice = !!voiceChannel;
        const letter = displayName.charAt(0).toUpperCase();
        const avatarPos = this._getAvatarObjectPosition(profile);
        const avatarScale = this._getAvatarZoomScale(profile);
        const avatarFit = this._getAvatarObjectFit(profile);
        const avatarContent = pfp
            ? `<img src="${pfp}" class="member-avatar-img" alt="pfp" style="object-fit:${avatarFit};object-position:${avatarPos};transform:scale(${avatarScale});transform-origin:center;">`
            : letter;
        const ownerBadge = isOwner
            ? `<span class="member-badge"><img src="${this._c.ASSET_BASE}/crown.svg" class="wc-icon-xs" alt="Owner"></span>`
            : '';

        const roleData = this.servers.find(s => s.id === this.currentServer)?.roles?.find(r => r.id === role);
        const nameColor = roleData ? `style="color:${roleData.color}"` : '';
        const voiceTag = inVoice
            ? `<span class="member-voice-tag"><img src="${this._c.ASSET_BASE}/speaker.svg" class="wc-icon-xs" alt="Voice"> ${this._esc(voiceChannel.name)}</span>`
            : '';
        const speakingClass = this._speakingUsers.has(String(username || '').toLowerCase()) ? ' voice-speaking' : '';

        return `
            <div class="member-item${inVoice ? ' in-voice' : ''}${speakingClass}" data-username="${this._esc(username)}">
                <div class="member-avatar ${online ? 'online' : ''}">${avatarContent}</div>
                <div class="member-info">
                    <span class="member-name" ${nameColor}>${this._esc(displayName)}</span>
                    ${ownerBadge}
                    ${voiceTag}
                </div>
            </div>
        `;
    }

    // =========================================================================
    // Friends System
    // =========================================================================

    _startFriendsListener() {
        if (!this._online || this.username === 'guest') {
            this._clearDmNotificationWatchers();
            return;
        }

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
            this._refreshDmNotificationWatchers();
        }, err => {
            console.error('[WigCord] Friends listener error:', err);
        });
    }

    _findFriendKey(friendMap, username) {
        const target = String(username || '').trim().toLowerCase();
        if (!target || !friendMap || typeof friendMap !== 'object') return null;
        return Object.keys(friendMap).find(k => String(k || '').toLowerCase() === target) || null;
    }

    async _resolveExistingUsername(inputUsername) {
        const raw = String(inputUsername || '').trim();
        if (!raw) return null;

        if (!this._online) return raw;

        const lower = raw.toLowerCase();
        const rawDoc = await this._fbGet(`${this._cols.users}/${raw}`);
        if (rawDoc) return raw;

        if (lower !== raw) {
            const lowerDoc = await this._fbGet(`${this._cols.users}/${lower}`);
            if (lowerDoc) return lower;
        }

        return null;
    }

    async _sendFriendRequest(targetUsername) {
        if (!this._online || !targetUsername) return;

        const resolvedTarget = await this._resolveExistingUsername(targetUsername);
        const myLower = String(this.username || '').trim().toLowerCase();
        const targetLower = String(resolvedTarget || '').trim().toLowerCase();

        if (!resolvedTarget) {
            alert(`User "${String(targetUsername).trim()}" doesn't exist.`);
            return;
        }

        if (targetLower === myLower) return;
        if (targetLower === 'guest') { alert('Cannot add guest as a friend.'); return; }

        // Update our friends doc
        const myData = await this._fbGet(`${this._cols.friends}/${this.username}`) || { friends: {} };
        myData.friends = myData.friends || {};

        const existingKey = this._findFriendKey(myData.friends, resolvedTarget);
        if (existingKey) {
            const existingStatus = myData.friends[existingKey] && myData.friends[existingKey].status;
            if (existingStatus === 'pending_in') {
                await this._acceptFriendRequest(existingKey);
                alert(`Friend request from ${existingKey} accepted.`);
                return;
            }
            alert(`You already have a relationship with ${existingKey}`);
            return;
        }

        myData.friends[resolvedTarget] = { status: 'pending_out', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });

        // Update target's friends doc
        const targetData = await this._fbGet(`${this._cols.friends}/${resolvedTarget}`) || { friends: {} };
        targetData.friends = targetData.friends || {};
        targetData.friends[this.username] = { status: 'pending_in', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${resolvedTarget}`, { friends: targetData.friends });

        alert(`Friend request sent to ${resolvedTarget}!`);
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
        myData.friends = myData.friends || {};
        myData.friends[targetUsername] = { status: 'accepted', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });

        // Update their record
        const targetData = await this._fbGet(`${this._cols.friends}/${targetUsername}`) || { friends: {} };
        targetData.friends = targetData.friends || {};
        targetData.friends[this.username] = { status: 'accepted', since: Date.now() };
        await this._fbSet(`${this._cols.friends}/${targetUsername}`, { friends: targetData.friends });
    }

    async _declineFriendRequest(targetUsername) {
        if (!this._online) return;

        const myData = await this._fbGet(`${this._cols.friends}/${this.username}`) || { friends: {} };
        myData.friends = myData.friends || {};
        delete myData.friends[targetUsername];
        await this._fbSet(`${this._cols.friends}/${this.username}`, { friends: myData.friends });

        const targetData = await this._fbGet(`${this._cols.friends}/${targetUsername}`) || { friends: {} };
        targetData.friends = targetData.friends || {};
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
        this._hideMessageContextMenu();
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
        this._updatePinnedButtonVisibility();

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
            const unread = this._dmUnreadCounts[username] || 0;
            const el = document.createElement('div');
            el.className = 'dm-item' + (this.currentView === 'dm-chat' && this.currentDmPartner === username ? ' active' : '');
            el.dataset.username = username;
            el.innerHTML = `
                <div class="dm-item-avatar">${username.charAt(0).toUpperCase()}</div>
                <div class="dm-item-name">${this._esc(username)}</div>
                ${unread > 0 ? `<span class="dm-unread-badge">${this._formatBadgeCount(unread)}</span>` : ''}
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
        this._hideMessageContextMenu();
        this._clearDmUnread(username);

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
        document.getElementById('voice-channel-view').style.display = 'none';
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
        this._renderVoiceRoomPanel();
        this._updatePinnedButtonVisibility();
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
                            const isCurrentDm = this.currentView === 'dm-chat' && this.currentDmPartner === username;
                            if (!isCurrentDm) {
                                this._incrementDmUnread(username);
                                this._playNotificationSound();
                            }
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

            this._renderMessageList(dmMsgsEl, msgs);

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
                let prevOlder = null;
                older.forEach(msg => {
                    const stackWithPrevious = this._shouldStackWithPreviousMessage(prevOlder, msg);
                    this._renderMessage(frag, msg, { stackWithPrevious });
                    prevOlder = msg;
                });
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

        // Attach image if pending
        if (this._pendingImage) {
            dmMsgData.imageUrl = this._pendingImage;
            this._clearPendingImage();
        }

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
            img.style.objectFit = this._getAvatarObjectFit(profile);
            img.style.objectPosition = this._getAvatarObjectPosition(profile);
            img.style.transform = `scale(${this._getAvatarZoomScale(profile)})`;
            img.style.transformOrigin = 'center';
            avatarEl.appendChild(img);
        } else {
            avatarEl.appendChild(document.createTextNode(username.charAt(0).toUpperCase()));
        }

        // Theme — smooth gradient below the banner: dark primary at bottom → accent at top
        const theme = profile.theme || {};
        const primary = theme.primary || this._c.THEME_DEFAULTS.primary;
        const accent  = theme.accent  || this._c.THEME_DEFAULTS.accent;
        const bannerEl = document.getElementById('viewer-banner');
        const bannerPos = this._getBannerBackgroundPosition(profile);
        const bannerSize = this._getBannerBackgroundSize(profile);
        if (profile.bannerUrl) {
            bannerEl.style.backgroundImage = `url(${profile.bannerUrl})`;
            bannerEl.style.backgroundSize = bannerSize;
            bannerEl.style.backgroundPosition = bannerPos;
            bannerEl.style.backgroundRepeat = 'no-repeat';
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
        const roleManagerSection = document.getElementById('viewer-role-manager-section');
        const roleSelect = document.getElementById('viewer-role-select');
        const assignRoleBtn = document.getElementById('viewer-assign-role');
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

                if (roleManagerSection && roleSelect && assignRoleBtn) {
                    const canManageRole = this._canManageMemberRoles(server.id, username);
                    if (canManageRole) {
                        const selectableRoles = server.roles.filter(r => r.id !== 'owner');
                        roleSelect.innerHTML = selectableRoles.map(r => {
                            const selected = r.id === userRoleId ? 'selected' : '';
                            return `<option value="${this._esc(r.id)}" ${selected}>${this._esc(r.name)}</option>`;
                        }).join('');
                        assignRoleBtn.onclick = async () => {
                            await this._assignMemberRole(server.id, username, roleSelect.value);
                            modal.classList.remove('active');
                            this._openProfileViewer(username);
                        };
                        roleManagerSection.style.display = 'block';
                    } else {
                        roleManagerSection.style.display = 'none';
                        roleSelect.innerHTML = '';
                        assignRoleBtn.onclick = null;
                    }
                }
            }
        }
        if (roleManagerSection && (!this.currentServer || this.currentView !== 'server')) {
            roleManagerSection.style.display = 'none';
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
        const bannerPos = this._getBannerBackgroundPosition(this.myProfile);
        const avatarPos = this._getAvatarObjectPosition(this.myProfile);
        const bannerZoom = this._getImageZoomPercent(this.myProfile.bannerZoom, 100);
        const avatarZoomScale = this._getAvatarZoomScale(this.myProfile);

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
            img.style.objectFit = this._getAvatarObjectFit(this.myProfile);
            img.style.objectPosition = avatarPos;
            img.style.transform = `scale(${avatarZoomScale})`;
            img.style.transformOrigin = 'center';
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
            bannerEl.style.backgroundSize = `${bannerZoom}%`;
            bannerEl.style.backgroundPosition = bannerPos;
            bannerEl.style.backgroundRepeat = 'no-repeat';
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
                const avatarFit = this._getAvatarObjectFit(this.myProfile);
                nameplateAvatar.innerHTML = `<img src="${this.userPfp}" class="nameplate-avatar-img" alt="pfp" style="object-fit:${avatarFit};object-position:${avatarPos};transform:scale(${avatarZoomScale});transform-origin:center;">`;
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

    _getImagePositionPercent(value, fallback = 50) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(0, Math.min(100, Math.round(n)));
    }

    _getImageZoomPercent(value, fallback = 100, min = 20, max = 300) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, Math.round(n)));
    }

    _getAvatarZoomScaleFromPercent(zoomPercent) {
        const zoom = this._getImageZoomPercent(zoomPercent, 100);
        // Keep zooming responsive above 100% but avoid an abrupt over-zoom feel.
        if (zoom <= 100) return zoom / 100;
        return 1 + ((zoom - 100) / 200);
    }

    _getAvatarObjectPosition(profile = {}) {
        const x = this._getImagePositionPercent(profile.avatarPositionX, 50);
        const y = this._getImagePositionPercent(
            profile.avatarPositionY !== undefined ? profile.avatarPositionY : profile.avatarPosition,
            50
        );
        return `${x}% ${y}%`;
    }

    _getAvatarZoomScale(profile = {}) {
        return this._getAvatarZoomScaleFromPercent(profile.avatarZoom);
    }

    _getAvatarObjectFit(profile = {}) {
        return 'cover';
    }

    _getBannerBackgroundPosition(profile = {}) {
        const x = this._getImagePositionPercent(profile.bannerPositionX, 50);
        const y = this._getImagePositionPercent(
            profile.bannerPositionY !== undefined ? profile.bannerPositionY : profile.bannerPosition,
            50
        );
        return `${x}% ${y}%`;
    }

    _getBannerBackgroundSize(profile = {}) {
        const zoom = this._getImageZoomPercent(profile.bannerZoom, 100);
        return `${zoom}%`;
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

    _openProfileImageEditor(target) {
        const isAvatar = target === 'avatar';
        this._profileImageEditor = {
            target,
            image: isAvatar ? this.userPfp : (this.myProfile.bannerUrl || null),
            positionX: this._getImagePositionPercent(isAvatar ? this.myProfile.avatarPositionX : this.myProfile.bannerPositionX, 50),
            positionY: this._getImagePositionPercent(
                isAvatar
                    ? (this.myProfile.avatarPositionY !== undefined ? this.myProfile.avatarPositionY : this.myProfile.avatarPosition)
                    : (this.myProfile.bannerPositionY !== undefined ? this.myProfile.bannerPositionY : this.myProfile.bannerPosition),
                50
            ),
            zoom: this._getImageZoomPercent(isAvatar ? this.myProfile.avatarZoom : this.myProfile.bannerZoom, 100),
            rotation: 0,
            dragging: false,
            dragStartX: 0,
            dragStartY: 0,
            dragStartPositionX: 50,
            dragStartPositionY: 50
        };

        const title = document.getElementById('profile-image-editor-title');
        if (title) title.textContent = isAvatar ? 'Edit Avatar' : 'Edit Banner';

        const focus = document.getElementById('profile-image-editor-focus');
        if (focus) {
            focus.classList.toggle('avatar', isAvatar);
            focus.classList.toggle('banner', !isAvatar);
        }

        const stage = document.getElementById('profile-image-editor-stage');
        if (stage) {
            stage.classList.toggle('avatar-target', isAvatar);
            stage.classList.toggle('banner-target', !isAvatar);
        }

        this._renderProfileImageEditor();
        document.getElementById('profile-image-editor-modal').classList.add('active');
    }

    _closeProfileImageEditor() {
        document.getElementById('profile-image-editor-modal').classList.remove('active');
        this._profileImageEditor = null;
        const fileInput = document.getElementById('profile-image-editor-input');
        if (fileInput) fileInput.value = '';
    }

    _renderProfileImageEditor() {
        const st = this._profileImageEditor;
        if (!st) return;

        const stage = document.getElementById('profile-image-editor-stage');
        const preview = document.getElementById('profile-image-editor-preview');
        const zoomInput = document.getElementById('profile-image-editor-zoom');
        const zoomValue = document.getElementById('profile-image-editor-zoom-value');
        const applyBtn = document.getElementById('apply-profile-image-editor');

        if (zoomInput) zoomInput.value = String(st.zoom);
        if (zoomValue) zoomValue.textContent = `${st.zoom}%`;

        if (!preview || !stage) return;

        if (!st.image) {
            preview.removeAttribute('src');
            preview.style.display = 'none';
            stage.style.background = 'linear-gradient(to right, #316ac5, #1e4088)';
            if (applyBtn) applyBtn.disabled = true;
            return;
        }

        preview.style.display = 'block';
        preview.src = st.image;
        preview.draggable = false;
        const fit = st.target === 'avatar'
            ? 'cover'
            : (st.zoom <= 100 ? 'contain' : 'cover');
        const scale = st.target === 'avatar'
            ? this._getAvatarZoomScaleFromPercent(st.zoom)
            : (st.zoom / 100);
        preview.style.objectFit = fit;
        preview.style.objectPosition = `${st.positionX}% ${st.positionY}%`;
        preview.style.transform = `scale(${scale}) rotate(${st.rotation}deg)`;
        stage.style.background = '#1a1f2b';
        stage.style.cursor = st.dragging ? 'grabbing' : 'grab';
        if (applyBtn) applyBtn.disabled = false;
    }

    _startProfileImageEditorDrag(clientX, clientY) {
        const st = this._profileImageEditor;
        if (!st || !st.image) return;
        st.dragging = true;
        st.dragStartX = clientX;
        st.dragStartY = clientY;
        st.dragStartPositionX = st.positionX;
        st.dragStartPositionY = st.positionY;
        this._renderProfileImageEditor();
    }

    _moveProfileImageEditorDrag(clientX, clientY) {
        const st = this._profileImageEditor;
        if (!st || !st.dragging) return;
        const stage = document.getElementById('profile-image-editor-stage');
        if (!stage) return;
        const stageWidth = Math.max(stage.clientWidth, 1);
        const stageHeight = Math.max(stage.clientHeight, 1);
        const deltaX = clientX - st.dragStartX;
        const deltaPx = clientY - st.dragStartY;
        const deltaXPct = (deltaX / stageWidth) * 100;
        const deltaPct = (deltaPx / stageHeight) * 100;
        st.positionX = this._getImagePositionPercent(st.dragStartPositionX + deltaXPct, st.dragStartPositionX);
        st.positionY = this._getImagePositionPercent(st.dragStartPositionY + deltaPct, st.dragStartPositionY);
        this._renderProfileImageEditor();
    }

    _endProfileImageEditorDrag() {
        const st = this._profileImageEditor;
        if (!st) return;
        st.dragging = false;
        this._renderProfileImageEditor();
    }

    async _rotateDataUrl(dataUrl, degrees) {
        const norm = ((degrees % 360) + 360) % 360;
        if (!norm) return dataUrl;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const radians = norm * Math.PI / 180;
                const swapSides = norm === 90 || norm === 270;
                const canvas = document.createElement('canvas');
                canvas.width = swapSides ? img.height : img.width;
                canvas.height = swapSides ? img.width : img.height;
                const ctx = canvas.getContext('2d');
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(radians);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    async _applyProfileImageEditor() {
        const st = this._profileImageEditor;
        if (!st) return;
        if (!st.image) {
            alert('Please upload an image first.');
            return;
        }

        const finalImage = await this._rotateDataUrl(st.image, st.rotation);

        if (st.target === 'avatar') {
            await this._fbSet(`${this._cols.profiles}/${this.username}`, { pfpUrl: finalImage });
            try { localStorage.setItem(`wigcord-pfp-${this.username}`, finalImage); } catch(e) {}
            try { localStorage.setItem(`wigcord-pfp-cache-${this.username}`, finalImage); } catch(e) {}
            this._pfpCache[this.username] = finalImage;
            this.userPfp = finalImage;
            this.myProfile.pfpUrl = finalImage;
            this.myProfile.avatarPositionX = st.positionX;
            this.myProfile.avatarPositionY = st.positionY;
            this.myProfile.avatarPosition = st.positionY;
            this.myProfile.avatarZoom = st.zoom;
        } else {
            this.myProfile.bannerUrl = finalImage;
            this.myProfile.bannerPositionX = st.positionX;
            this.myProfile.bannerPositionY = st.positionY;
            this.myProfile.bannerPosition = st.positionY;
            this.myProfile.bannerZoom = st.zoom;
        }

        this._updateProfilePreview();
        this._updateUserPanel();
        this._closeProfileImageEditor();
    }

    async _saveProfileFromEditor() {
        const td = this._c.THEME_DEFAULTS;
        const bannerPositionX = this._getImagePositionPercent(this.myProfile.bannerPositionX, 50);
        const bannerPositionY = this._getImagePositionPercent(
            this.myProfile.bannerPositionY !== undefined ? this.myProfile.bannerPositionY : this.myProfile.bannerPosition,
            50
        );
        const avatarPositionX = this._getImagePositionPercent(this.myProfile.avatarPositionX, 50);
        const avatarPositionY = this._getImagePositionPercent(
            this.myProfile.avatarPositionY !== undefined ? this.myProfile.avatarPositionY : this.myProfile.avatarPosition,
            50
        );
        const bannerZoom = this._getImageZoomPercent(this.myProfile.bannerZoom, 100);
        const avatarZoom = this._getImageZoomPercent(this.myProfile.avatarZoom, 100);
        const profileData = {
            displayName: document.getElementById('profile-display-name').value.trim() || this.username,
            pronouns: document.getElementById('profile-pronouns').value.trim(),
            bio: document.getElementById('profile-bio').value.trim().substring(0, this._c.BIO_MAX_LENGTH),
            bannerPositionX,
            bannerPositionY,
            bannerPosition: bannerPositionY,
            avatarPositionX,
            avatarPositionY,
            avatarPosition: avatarPositionY,
            bannerZoom,
            avatarZoom,
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
            if (e.key === 'Enter') {
                if (this._isMentionPickerOpen() && this._applySelectedMention()) {
                    e.preventDefault();
                    return;
                }
                this.sendMessage();
            }
        });

        this._setupMentionPicker();

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
        this._setupMessageContextMenu();
        this._setupPinnedMessagesUI();

        // Server menu dropdown button (▼)
        document.getElementById('server-menu-btn').addEventListener('click', (e) => {
            if (this.currentServer && this._showContextMenu) {
                const rect = e.target.getBoundingClientRect();
                this._showContextMenu(this.currentServer, rect.left, rect.bottom);
            }
        });

        // Mute/Deafen voice controls
        document.getElementById('btn-mute').addEventListener('click', async () => {
            await this._toggleVoiceMute();
        });
        document.getElementById('btn-deafen').addEventListener('click', () => {
            this._toggleVoiceDeafen();
        });
        document.getElementById('btn-leave-vc').addEventListener('click', async () => {
            await this._leaveVoiceFromControl();
        });

        // Server settings
        this._setupServerSettings();

        // Channel creation
        this._setupChannelCreationModal();

        // Emoji and GIF pickers
        this._setupEmojiPicker();
        this._setupStickerPicker();
        this._setupGifPicker();
        this._setupImageUpload();

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

        // Avatar/banner image editor popup
        document.getElementById('profile-change-banner').addEventListener('click', () => {
            this._openProfileImageEditor('banner');
        });
        document.getElementById('profile-change-avatar').addEventListener('click', () => {
            this._openProfileImageEditor('avatar');
        });

        document.getElementById('close-profile-image-editor').addEventListener('click', () => this._closeProfileImageEditor());
        document.getElementById('cancel-profile-image-editor').addEventListener('click', () => this._closeProfileImageEditor());
        document.getElementById('apply-profile-image-editor').addEventListener('click', () => this._applyProfileImageEditor());
        document.getElementById('profile-image-editor-modal').addEventListener('click', (e) => {
            const content = document.querySelector('#profile-image-editor-modal .profile-image-editor-content');
            if (content && !content.contains(e.target)) {
                this._closeProfileImageEditor();
            }
        });

        document.getElementById('profile-image-editor-zoom').addEventListener('input', (e) => {
            if (!this._profileImageEditor) return;
            this._profileImageEditor.zoom = this._getImageZoomPercent(e.target.value, 100);
            this._renderProfileImageEditor();
        });

        document.getElementById('profile-image-rotate-btn').addEventListener('click', () => {
            if (!this._profileImageEditor) return;
            this._profileImageEditor.rotation = (this._profileImageEditor.rotation + 90) % 360;
            this._renderProfileImageEditor();
        });

        document.getElementById('profile-image-upload-btn').addEventListener('click', () => {
            document.getElementById('profile-image-editor-input').click();
        });

        document.getElementById('profile-image-editor-input').addEventListener('change', (e) => {
            if (!this._profileImageEditor) return;
            const file = e.target.files[0];
            if (!file || !file.type.startsWith('image/')) {
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const isAvatar = this._profileImageEditor.target === 'avatar';
                const maxW = isAvatar ? 512 : 600;
                const maxH = isAvatar ? 512 : 240;
                this._compressImage(ev.target.result, maxW, maxH, 0.85).then(compressed => {
                    this._profileImageEditor.image = compressed;
                    this._profileImageEditor.positionX = 50;
                    this._profileImageEditor.positionY = 50;
                    this._profileImageEditor.zoom = 100;
                    this._profileImageEditor.rotation = 0;
                    this._renderProfileImageEditor();
                });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });

        const imageEditorStage = document.getElementById('profile-image-editor-stage');
        if (imageEditorStage) {
            imageEditorStage.addEventListener('pointerdown', (e) => {
                if (!this._profileImageEditor || !this._profileImageEditor.image) return;
                this._startProfileImageEditorDrag(e.clientX, e.clientY);
                try { imageEditorStage.setPointerCapture(e.pointerId); } catch (err) {}
            });
            imageEditorStage.addEventListener('pointermove', (e) => {
                this._moveProfileImageEditorDrag(e.clientX, e.clientY);
            });
            imageEditorStage.addEventListener('pointerup', () => {
                this._endProfileImageEditorDrag();
            });
            imageEditorStage.addEventListener('pointercancel', () => {
                this._endProfileImageEditorDrag();
            });
        }

        document.getElementById('profile-remove-banner').addEventListener('click', () => {
            delete this.myProfile.bannerUrl;
            this.myProfile.bannerPositionX = 50;
            this.myProfile.bannerPositionY = 50;
            this.myProfile.bannerPosition = 50;
            this.myProfile.bannerZoom = 100;
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
                this._hideMessageContextMenu();
            }
            this._handlePushToTalkKeyDown(e);
        });
        document.addEventListener('keyup', (e) => this._handlePushToTalkKeyUp(e));
        window.addEventListener('beforeunload', () => {
            this._leaveVoiceChannel();
        });

        this._updatePinnedButtonVisibility();
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
        if (!this._canOpenServerSettings(serverId)) {
            alert('You do not have permission to view server settings.');
            return;
        }
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
            case 'emoji':
                title.textContent = 'EMOJI';
                preview.style.display = 'none';
                contentArea.innerHTML = this._getEmojiSettingsContent();
                this._initCustomEmojiSettings();
                break;
            case 'stickers':
                title.textContent = 'STICKERS';
                preview.style.display = 'none';
                contentArea.innerHTML = this._getStickersSettingsContent();
                this._initCustomStickerSettings();
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

    _getEmojiSettingsContent() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return '<p>Server not found.</p>';

        const max = this._c.MAX_CUSTOM_EMOJIS_PER_SERVER;
        const custom = this._getServerCustomEmoji(server.id);
        const canAdd = custom.length < max;

        const items = custom.length
            ? custom.map(item => `
                <div class="custom-asset-item" data-emoji-id="${this._esc(item.id)}">
                    <div class="custom-asset-preview"><img src="${this._esc(item.imageUrl)}" alt="${this._esc(item.name)}"></div>
                    <div class="custom-asset-meta">
                        <div class="custom-asset-name">${this._esc(item.name)}</div>
                        <div class="custom-asset-token">:${this._esc(item.name)}:</div>
                    </div>
                    <button class="choose-image-btn custom-asset-remove" data-remove-emoji="${this._esc(item.id)}">Remove</button>
                </div>
            `).join('')
            : '<div class="settings-subtitle">No custom emojis yet.</div>';

        return `
            <div class="custom-assets-header">
                <div>
                    <h3 style="font-size: 12px; margin: 0;">Custom Emojis</h3>
                    <div class="settings-subtitle">Upload custom emojis for this server.</div>
                </div>
                <div class="custom-assets-count">${custom.length}/${max}</div>
            </div>
            <div class="custom-assets-upload">
                <input id="custom-emoji-name" class="modal-input" maxlength="32" placeholder="emoji_name">
                <input id="custom-emoji-file" type="file" accept="image/*">
                <button id="add-custom-emoji-btn" class="choose-image-btn" ${canAdd ? '' : 'disabled'}>Add Emoji</button>
            </div>
            <div class="custom-assets-list">${items}</div>
        `;
    }

    _getStickersSettingsContent() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return '<p>Server not found.</p>';

        const max = this._c.MAX_CUSTOM_STICKERS_PER_SERVER;
        const custom = this._getServerCustomStickers(server.id);
        const canAdd = custom.length < max;

        const items = custom.length
            ? custom.map(item => `
                <div class="custom-asset-item" data-sticker-id="${this._esc(item.id)}">
                    <div class="custom-asset-preview"><img src="${this._esc(item.imageUrl)}" alt="${this._esc(item.name)}"></div>
                    <div class="custom-asset-meta">
                        <div class="custom-asset-name">${this._esc(item.name)}</div>
                    </div>
                    <button class="choose-image-btn custom-asset-remove" data-remove-sticker="${this._esc(item.id)}">Remove</button>
                </div>
            `).join('')
            : '<div class="settings-subtitle">No custom stickers yet.</div>';

        return `
            <div class="custom-assets-header">
                <div>
                    <h3 style="font-size: 12px; margin: 0;">Custom Stickers</h3>
                    <div class="settings-subtitle">Upload up to ${max} stickers for this server.</div>
                </div>
                <div class="custom-assets-count">${custom.length}/${max}</div>
            </div>
            <div class="custom-assets-upload">
                <input id="custom-sticker-name" class="modal-input" maxlength="32" placeholder="Sticker name">
                <input id="custom-sticker-file" type="file" accept="image/*">
                <button id="add-custom-sticker-btn" class="choose-image-btn" ${canAdd ? '' : 'disabled'}>Add Sticker</button>
            </div>
            <div class="custom-assets-list">${items}</div>
        `;
    }

    _initCustomEmojiSettings() {
        const addBtn = document.getElementById('add-custom-emoji-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this._addCustomEmojiFromSettings());
        }
        document.querySelectorAll('[data-remove-emoji]').forEach(btn => {
            btn.addEventListener('click', () => this._removeCustomEmojiFromSettings(btn.dataset.removeEmoji));
        });
    }

    _initCustomStickerSettings() {
        const addBtn = document.getElementById('add-custom-sticker-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this._addCustomStickerFromSettings());
        }
        document.querySelectorAll('[data-remove-sticker]').forEach(btn => {
            btn.addEventListener('click', () => this._removeCustomStickerFromSettings(btn.dataset.removeSticker));
        });
    }

    _fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async _addCustomEmojiFromSettings() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return;
        if (!this._canOpenServerSettings(server.id)) {
            alert('You do not have permission to add custom emojis.');
            return;
        }

        server.customEmojis = this._getServerCustomEmoji(server.id);
        if (server.customEmojis.length >= this._c.MAX_CUSTOM_EMOJIS_PER_SERVER) {
            alert(`This server already has ${this._c.MAX_CUSTOM_EMOJIS_PER_SERVER} custom emojis.`);
            return;
        }

        const nameInput = document.getElementById('custom-emoji-name');
        const fileInput = document.getElementById('custom-emoji-file');
        const rawName = (nameInput && nameInput.value || '').trim().toLowerCase();
        const file = fileInput && fileInput.files && fileInput.files[0];

        if (!/^[a-z0-9_]{2,32}$/.test(rawName)) {
            alert('Emoji name must be 2-32 characters and use letters, numbers, or underscore.');
            return;
        }
        if (server.customEmojis.some(e => String(e.name || '').toLowerCase() === rawName)) {
            alert('An emoji with that name already exists.');
            return;
        }
        if (!file || !file.type.startsWith('image/')) {
            alert('Please choose an image file for the emoji.');
            return;
        }

        const dataUrl = await this._fileToDataUrl(file);
        const imageUrl = await this._compressImage(dataUrl, 128, 128, 0.9);
        server.customEmojis.push({
            id: `ce-${Date.now()}`,
            name: rawName,
            imageUrl,
            createdBy: this.username,
            createdAt: Date.now()
        });

        await this._saveServer(server);
        if (this.currentServer === server.id) this._serverCustomEmoji = server.customEmojis;
        this._loadSettingsTab('emoji');
    }

    async _removeCustomEmojiFromSettings(emojiId) {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server || !emojiId) return;
        if (!this._canOpenServerSettings(server.id)) {
            alert('You do not have permission to remove custom emojis.');
            return;
        }
        server.customEmojis = this._getServerCustomEmoji(server.id).filter(e => e.id !== emojiId);
        await this._saveServer(server);
        if (this.currentServer === server.id) this._serverCustomEmoji = server.customEmojis;
        this._loadSettingsTab('emoji');
    }

    async _addCustomStickerFromSettings() {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server) return;
        if (!this._canOpenServerSettings(server.id)) {
            alert('You do not have permission to add stickers.');
            return;
        }

        server.customStickers = this._getServerCustomStickers(server.id);
        if (server.customStickers.length >= this._c.MAX_CUSTOM_STICKERS_PER_SERVER) {
            alert(`This server already has ${this._c.MAX_CUSTOM_STICKERS_PER_SERVER} stickers.`);
            return;
        }

        const nameInput = document.getElementById('custom-sticker-name');
        const fileInput = document.getElementById('custom-sticker-file');
        const rawName = (nameInput && nameInput.value || '').trim();
        const stickerName = rawName || `sticker-${server.customStickers.length + 1}`;
        const file = fileInput && fileInput.files && fileInput.files[0];

        if (stickerName.length > 32) {
            alert('Sticker name must be 32 characters or fewer.');
            return;
        }
        if (server.customStickers.some(s => String(s.name || '').toLowerCase() === stickerName.toLowerCase())) {
            alert('A sticker with that name already exists.');
            return;
        }
        if (!file || !file.type.startsWith('image/')) {
            alert('Please choose an image file for the sticker.');
            return;
        }

        const dataUrl = await this._fileToDataUrl(file);
        const imageUrl = await this._compressImage(dataUrl, 320, 320, 0.9);
        server.customStickers.push({
            id: `cs-${Date.now()}`,
            name: stickerName,
            imageUrl,
            createdBy: this.username,
            createdAt: Date.now()
        });

        await this._saveServer(server);
        if (this.currentServer === server.id) this._serverCustomStickers = server.customStickers;
        this._loadSettingsTab('stickers');
    }

    async _removeCustomStickerFromSettings(stickerId) {
        const server = this.servers.find(s => s.id === this.currentSettingsServer);
        if (!server || !stickerId) return;
        if (!this._canOpenServerSettings(server.id)) {
            alert('You do not have permission to remove stickers.');
            return;
        }
        server.customStickers = this._getServerCustomStickers(server.id).filter(s => s.id !== stickerId);
        await this._saveServer(server);
        if (this.currentServer === server.id) this._serverCustomStickers = server.customStickers;
        this._loadSettingsTab('stickers');
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
        const serverSettingsItem = document.getElementById('ctx-server-settings');
        const createChannelItem = document.getElementById('ctx-create-channel');
        const createCategoryItem = document.getElementById('ctx-create-category');
        const deleteServerItem = document.getElementById('ctx-delete-server');
        let currentCtxServer = null;

        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) contextMenu.style.display = 'none';
        });

        document.getElementById('ctx-invite-people').addEventListener('click', () => {
            this._openInviteModal();
            contextMenu.style.display = 'none';
        });
        serverSettingsItem.addEventListener('click', () => {
            this._openServerSettings(currentCtxServer);
            contextMenu.style.display = 'none';
        });
        createChannelItem.addEventListener('click', () => {
            if (currentCtxServer && this._hasPermission(currentCtxServer, 'manageChannels')) {
                this.openChannelCreationModal();
            } else {
                alert('You do not have permission to create channels!');
            }
            contextMenu.style.display = 'none';
        });
        createCategoryItem.addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-notification-settings').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        document.getElementById('ctx-edit-profile').addEventListener('click', () => {
            this._openProfileEditor();
            contextMenu.style.display = 'none';
        });
        document.getElementById('ctx-hide-muted').addEventListener('click', () => { alert('Coming soon!'); contextMenu.style.display = 'none'; });
        deleteServerItem.addEventListener('click', () => {
            this.deleteServer(currentCtxServer);
            contextMenu.style.display = 'none';
        });

        this._showContextMenu = (serverId, x, y) => {
            currentCtxServer = serverId;
            const server = this.servers.find(s => s.id === serverId);
            const canManageChannels = this._hasPermission(serverId, 'manageChannels');
            const canOpenSettings = this._canOpenServerSettings(serverId);
            const canDeleteServer = !!server && server.ownerId === this.username;

            serverSettingsItem.style.display = canOpenSettings ? 'flex' : 'none';
            createChannelItem.style.display = canManageChannels ? 'flex' : 'none';
            createCategoryItem.style.display = canManageChannels ? 'flex' : 'none';
            deleteServerItem.style.display = canDeleteServer ? 'flex' : 'none';

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

    _stripInviteLinksFromText(text) {
        if (!text) return '';

        const cleaned = String(text)
            // Full URL with invite query (?invite=CODE)
            .replace(/https?:\/\/[^\s]*[?&]invite=[A-Za-z0-9_-]+[^\s]*/gi, ' ')
            // Full URL with invite path (/invite/CODE)
            .replace(/https?:\/\/[^\s]*\/invite\/[A-Za-z0-9_-]+[^\s]*/gi, ' ')
            // Relative invite links
            .replace(/(^|\s)(\/invite\/[A-Za-z0-9_-]+[^\s]*)/gi, '$1')
            .replace(/(^|\s)(\?invite=[A-Za-z0-9_-]+[^\s]*)/gi, '$1')
            .replace(/\s{2,}/g, ' ')
            .trim();

        return cleaned;
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
        this._hideMessageContextMenu();
        document.querySelectorAll('.dm-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('dm-requests-nav').classList.add('active');

        document.getElementById('dm-main-view').style.display = 'none';
        document.getElementById('dm-requests-view').style.display = 'flex';
        document.getElementById('dm-chat-view').style.display = 'none';
        document.getElementById('messages-container').style.display = 'none';
        document.getElementById('voice-channel-view').style.display = 'none';
        document.getElementById('current-channel').textContent = 'Message Requests';
        document.getElementById('header-icon').textContent = '📨';
        document.getElementById('message-input-area').classList.add('hidden');
        document.getElementById('member-list').classList.add('hidden');
        this._renderVoiceRoomPanel();
        this._updatePinnedButtonVisibility();
    }

    // =========================================================================
    // Image Upload
    // =========================================================================

    _setupImageUpload() {
        const attachBtn = document.getElementById('attach-btn');
        const fileInput = document.getElementById('image-upload-input');
        const preview = document.getElementById('image-upload-preview');
        const previewImg = document.getElementById('image-preview-img');
        const removeBtn = document.getElementById('image-preview-remove');

        attachBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file || !file.type.startsWith('image/')) {
                fileInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = async (ev) => {
                const compressed = await this._compressImage(
                    ev.target.result,
                    this._c.IMAGE_MAX_WIDTH,
                    this._c.IMAGE_MAX_HEIGHT,
                    this._c.IMAGE_QUALITY
                );
                this._pendingImage = compressed;
                previewImg.src = compressed;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });

        removeBtn.addEventListener('click', () => {
            this._pendingImage = null;
            previewImg.src = '';
            preview.style.display = 'none';
        });
    }

    _clearPendingImage() {
        this._pendingImage = null;
        const preview = document.getElementById('image-upload-preview');
        const previewImg = document.getElementById('image-preview-img');
        if (preview) preview.style.display = 'none';
        if (previewImg) previewImg.src = '';
    }

    // =========================================================================
    // Mention Picker
    // =========================================================================

    _setupMentionPicker() {
        const input = document.getElementById('message-input');
        const area = document.getElementById('message-input-area');
        if (!input || !area) return;

        let picker = document.getElementById('mention-picker');
        if (!picker) {
            picker = document.createElement('div');
            picker.id = 'mention-picker';
            picker.className = 'mention-picker';
            picker.style.display = 'none';
            area.appendChild(picker);
        }
        this._mentionPickerEl = picker;

        input.addEventListener('input', () => this._updateMentionPicker());
        input.addEventListener('click', () => this._updateMentionPicker());

        input.addEventListener('keydown', (e) => {
            if (!this._isMentionPickerOpen()) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._moveMentionSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._moveMentionSelection(-1);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (this._applySelectedMention()) {
                    e.preventDefault();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this._hideMentionPicker();
            }
        });

        picker.addEventListener('mousedown', (e) => {
            const item = e.target.closest('.mention-item');
            if (!item) return;
            e.preventDefault();
            const idx = Number(item.dataset.index);
            if (!Number.isNaN(idx)) {
                this._mentionSelectedIndex = idx;
                this._applySelectedMention();
            }
        });

        document.addEventListener('click', (e) => {
            if (!this._isMentionPickerOpen()) return;
            if (e.target === input || picker.contains(e.target)) return;
            this._hideMentionPicker();
        });
    }

    _isMentionPickerOpen() {
        return !!(this._mentionPickerEl && this._mentionPickerEl.style.display !== 'none');
    }

    _getMentionCandidates(queryText) {
        const query = String(queryText || '').toLowerCase();
        const candidates = [];

        if (this.currentView === 'server' && this.currentServer) {
            const server = this.servers.find(s => s.id === this.currentServer);
            const members = Object.keys((server && server.members) || {});
            members.forEach(username => {
                if (!username) return;
                const profile = this.friendProfiles[username] || {};
                const displayName = profile.displayName || username;
                candidates.push({
                    username,
                    displayName,
                    avatarUrl: profile.pfpUrl || null
                });
            });
        } else if (this.currentView === 'dm-chat' && this.currentDmPartner) {
            const username = this.currentDmPartner;
            const profile = this.friendProfiles[username] || {};
            candidates.push({
                username,
                displayName: profile.displayName || username,
                avatarUrl: profile.pfpUrl || null
            });
        }

        const filtered = candidates.filter(c => {
            const uname = String(c.username || '').toLowerCase();
            const dname = String(c.displayName || '').toLowerCase();
            if (!query) return true;
            return uname.includes(query) || dname.includes(query);
        });

        filtered.sort((a, b) => {
            const au = String(a.username || '').toLowerCase();
            const bu = String(b.username || '').toLowerCase();
            const aStarts = query ? au.startsWith(query) : false;
            const bStarts = query ? bu.startsWith(query) : false;
            if (aStarts !== bStarts) return aStarts ? -1 : 1;
            return au.localeCompare(bu);
        });

        const unique = [];
        const seen = new Set();
        filtered.forEach(c => {
            const key = String(c.username || '').toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            unique.push(c);
        });
        return unique.slice(0, 8);
    }

    _updateMentionPicker() {
        const input = document.getElementById('message-input');
        if (!input || input.disabled) {
            this._hideMentionPicker();
            return;
        }

        const caret = input.selectionStart;
        const left = input.value.slice(0, caret);
        const match = left.match(/(^|\s)@([A-Za-z0-9_]*)$/);
        if (!match) {
            this._hideMentionPicker();
            return;
        }

        const query = match[2] || '';
        const mentionStart = caret - query.length - 1;
        const candidates = this._getMentionCandidates(query);
        if (!candidates.length) {
            this._hideMentionPicker();
            return;
        }

        this._mentionCandidates = candidates;
        this._mentionAnchor = { start: mentionStart, end: caret, query };
        if (this._mentionSelectedIndex < 0 || this._mentionSelectedIndex >= candidates.length) {
            this._mentionSelectedIndex = 0;
        }
        this._renderMentionPicker();
    }

    _renderMentionPicker() {
        if (!this._mentionPickerEl) return;
        const html = this._mentionCandidates.map((candidate, idx) => {
            const selected = idx === this._mentionSelectedIndex ? ' selected' : '';
            const avatar = candidate.avatarUrl
                ? `<img src="${this._esc(candidate.avatarUrl)}" class="mention-avatar-img" alt="">`
                : this._esc((candidate.displayName || candidate.username || '?').charAt(0).toUpperCase());
            return `
                <button type="button" class="mention-item${selected}" data-index="${idx}">
                    <span class="mention-avatar">${avatar}</span>
                    <span class="mention-meta">
                        <span class="mention-name">${this._esc(candidate.displayName || candidate.username)}</span>
                        <span class="mention-username">@${this._esc(candidate.username)}</span>
                    </span>
                </button>
            `;
        }).join('');

        this._mentionPickerEl.innerHTML = html;
        this._mentionPickerEl.style.display = 'block';
    }

    _moveMentionSelection(delta) {
        const len = this._mentionCandidates.length;
        if (!len) return;
        const next = (this._mentionSelectedIndex + delta + len) % len;
        this._mentionSelectedIndex = next;
        this._renderMentionPicker();
    }

    _applySelectedMention() {
        const input = document.getElementById('message-input');
        if (!input || !this._mentionAnchor || !this._mentionCandidates.length) return false;

        const idx = this._mentionSelectedIndex >= 0 ? this._mentionSelectedIndex : 0;
        const chosen = this._mentionCandidates[idx];
        if (!chosen || !chosen.username) return false;

        const before = input.value.slice(0, this._mentionAnchor.start);
        const after = input.value.slice(this._mentionAnchor.end);
        // Invisible separator keeps mentions detectable without adding a visible space.
        const mentionText = `@${chosen.username}\u200B`;
        const nextValue = before + mentionText + after;
        const nextCaret = before.length + mentionText.length;

        input.value = nextValue;
        input.focus();
        input.setSelectionRange(nextCaret, nextCaret);

        this._hideMentionPicker();
        return true;
    }

    _hideMentionPicker() {
        if (!this._mentionPickerEl) return;
        this._mentionPickerEl.style.display = 'none';
        this._mentionPickerEl.innerHTML = '';
        this._mentionCandidates = [];
        this._mentionSelectedIndex = -1;
        this._mentionAnchor = null;
    }

    // =========================================================================
    // Emoji Picker
    // =========================================================================

    async _setupEmojiPicker() {
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiGrid = document.getElementById('emoji-grid');
        const emojiSearch = document.getElementById('emoji-search');
        const emojiClose = document.getElementById('emoji-close');
        const emojiCategories = document.getElementById('emoji-categories');

        // Load emoji data from CDN
        await this._loadEmojiData();

        // Build category tabs and grid
        this._buildEmojiCategories(emojiCategories, emojiGrid);
        this._renderEmojiGrid(emojiGrid, null, '');

        // Toggle picker
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = emojiPicker.style.display === 'flex';
            document.getElementById('gif-picker').style.display = 'none';
            document.getElementById('sticker-picker').style.display = 'none';
            emojiPicker.style.display = isVisible ? 'none' : 'flex';
        });

        // Close button
        emojiClose.addEventListener('click', () => emojiPicker.style.display = 'none');

        // Search
        let searchTimeout;
        emojiSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const q = e.target.value.trim().toLowerCase();
                this._renderEmojiGrid(emojiGrid, null, q);
                // Deselect category buttons when searching
                emojiCategories.querySelectorAll('.emoji-category-btn').forEach(b => b.classList.remove('active'));
            }, 200);
        });

        // Click outside closes
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    async _loadEmojiData() {
        try {
            const resp = await fetch(this._c.EMOJI_DATA_URL);
            if (!resp.ok) throw new Error('Failed to fetch');
            const data = await resp.json();

            const normalized = {};

            if (Array.isArray(data)) {
                // Format like unicode-emoji-json data-by-group.json:
                // [{ name: 'Smileys & Emotion', emojis: [...] }, ...]
                data.forEach(groupObj => {
                    const groupName = groupObj && groupObj.name;
                    const emojis = groupObj && groupObj.emojis;
                    if (!groupName || groupName === 'Component' || !Array.isArray(emojis)) return;

                    normalized[groupName] = emojis
                        .filter(e => e && typeof e.emoji === 'string')
                        .map(e => ({
                            emoji: e.emoji,
                            name: e.name || e.slug || ''
                        }));
                });
            } else if (data && typeof data === 'object') {
                // Backward-compatible format:
                // { 'Smileys & Emotion': [...], ... }
                for (const [groupName, emojis] of Object.entries(data)) {
                    if (groupName === 'Component' || !Array.isArray(emojis)) continue;

                    normalized[groupName] = emojis
                        .filter(e => e && typeof e.emoji === 'string')
                        .map(e => ({
                            emoji: e.emoji,
                            name: e.name || e.slug || ''
                        }));
                }
            }

            if (Object.keys(normalized).length === 0) {
                throw new Error('Emoji data payload did not contain any valid groups');
            }

            this._emojiData = normalized;
        } catch(e) {
            console.warn('[WigCord] Emoji CDN unavailable, using fallback:', e);
            this._emojiData = {
                'Smileys & Emotion': this._c.EMOJIS_FALLBACK.map(em => ({ emoji: em, name: '' }))
            };
        }
    }

    _buildEmojiCategories(container, grid) {
        container.innerHTML = '';
        const groups = Object.keys(this._getEmojiGroupsForPicker());
        groups.forEach((group, i) => {
            const btn = document.createElement('button');
            btn.className = 'emoji-category-btn' + (i === 0 ? ' active' : '');
            btn.textContent = group === 'Custom'
                ? '✨'
                : (this._c.EMOJI_CATEGORY_ICONS[group] || '📦');
            btn.title = group;
            btn.addEventListener('click', () => {
                container.querySelectorAll('.emoji-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('emoji-search').value = '';
                this._renderEmojiGrid(grid, group, '');
            });
            container.appendChild(btn);
        });
    }

    _getEmojiGroupsForPicker() {
        const groups = { ...(this._emojiData || {}) };
        if (this.currentServer) {
            const custom = this._getServerCustomEmoji(this.currentServer);
            if (custom.length > 0) {
                groups.Custom = custom.map(item => ({
                    emoji: item.imageUrl,
                    name: item.name,
                    isCustom: true,
                    token: `:${item.name}:`
                }));
            }
        }
        return groups;
    }

    _renderEmojiGrid(grid, category, searchQuery) {
        grid.innerHTML = '';
        const allGroups = this._getEmojiGroupsForPicker();
        const groups = category ? { [category]: allGroups[category] || [] } : allGroups;

        for (const [group, emojis] of Object.entries(groups)) {
            const filtered = searchQuery
                ? emojis.filter(e => (e.name || '').toLowerCase().includes(searchQuery))
                : emojis;
            if (filtered.length === 0) continue;

            // Group label
            if (!category || Object.keys(groups).length > 1) {
                const label = document.createElement('div');
                label.className = 'emoji-grid-label';
                label.textContent = group;
                grid.appendChild(label);
            }

            filtered.forEach(({ emoji, isCustom, token }) => {
                const el = document.createElement('div');
                el.className = 'emoji-item';
                if (isCustom) {
                    const img = document.createElement('img');
                    img.src = emoji;
                    img.alt = token || ':custom:';
                    img.className = 'message-custom-emoji';
                    el.appendChild(img);
                } else {
                    el.textContent = emoji;
                }
                el.addEventListener('click', () => {
                    this._insertEmoji(isCustom ? token : emoji);
                    document.getElementById('emoji-picker').style.display = 'none';
                });
                grid.appendChild(el);
            });
        }

        if (grid.children.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#888;font-size:11px;">No emoji found</div>';
        }
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
            document.getElementById('sticker-picker').style.display = 'none';
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

    // =========================================================================
    // Sticker Picker
    // =========================================================================

    _setupStickerPicker() {
        const stickerBtn = document.getElementById('sticker-btn');
        const stickerPicker = document.getElementById('sticker-picker');
        const stickerGrid = document.getElementById('sticker-grid');
        const stickerClose = document.getElementById('sticker-close');
        if (!stickerBtn || !stickerPicker || !stickerGrid || !stickerClose) return;

        const renderStickers = () => {
            stickerGrid.innerHTML = '';
            if (!this.currentServer) {
                stickerGrid.innerHTML = '<div class="sticker-empty">Open a server to use stickers.</div>';
                return;
            }

            const stickers = this._getServerCustomStickers(this.currentServer);
            if (!stickers.length) {
                stickerGrid.innerHTML = '<div class="sticker-empty">No custom stickers uploaded for this server.</div>';
                return;
            }

            stickers.forEach(sticker => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'sticker-item';
                item.title = sticker.name || 'Sticker';
                item.innerHTML = `<img src="${this._esc(sticker.imageUrl)}" alt="${this._esc(sticker.name || 'Sticker')}">`;
                item.addEventListener('click', async () => {
                    this._pendingImage = sticker.imageUrl;
                    await this.sendMessage();
                    stickerPicker.style.display = 'none';
                });
                stickerGrid.appendChild(item);
            });
        };

        stickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = stickerPicker.style.display === 'flex';
            document.getElementById('emoji-picker').style.display = 'none';
            document.getElementById('gif-picker').style.display = 'none';
            if (isVisible) {
                stickerPicker.style.display = 'none';
                return;
            }
            renderStickers();
            stickerPicker.style.display = 'flex';
        });

        stickerClose.addEventListener('click', () => {
            stickerPicker.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (!stickerPicker.contains(e.target) && e.target !== stickerBtn) {
                stickerPicker.style.display = 'none';
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

    _parseCustomServerEmojis(html) {
        if (!html || !this.currentServer) return html;
        const custom = this._getServerCustomEmoji(this.currentServer);
        if (!custom.length) return html;

        let output = html;
        custom.forEach(item => {
            const rawName = String(item && item.name || '').trim();
            const imageUrl = String(item && item.imageUrl || '').trim();
            if (!rawName || !imageUrl) return;
            const tokenPattern = new RegExp(`:${rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'g');
            const imgTag = `<img src="${this._esc(imageUrl)}" class="message-custom-emoji" alt=":${this._esc(rawName)}:">`;
            output = output.replace(tokenPattern, imgTag);
        });
        return output;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.wigcord = new WigCord();
});
