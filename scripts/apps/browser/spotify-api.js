/**
 * Spotify Web API Integration for WigCord
 * Uses Authorization Code with PKCE (no server/secret needed)
 *
 * Setup:
 *   1. Go to https://developer.spotify.com/dashboard and create an app
 *   2. Set the Client ID below
 *   3. Add your redirect URI in the Spotify app settings:
 *      e.g. https://your-domain.com/apps/browser/pages/spotify-callback.html
 *   4. Update REDIRECT_URI below to match
 *
 * Usage:
 *   - SpotifyAPI.login()              → opens auth popup
 *   - SpotifyAPI.isConnected()        → true if tokens exist
 *   - SpotifyAPI.getCurrentlyPlaying()→ returns track info or null
 *   - SpotifyAPI.disconnect()         → clears tokens
 */

const SpotifyAPI = (() => {

    // ===================== CONFIGURATION =====================
    // Replace with your Spotify app's Client ID
    const CLIENT_ID = 'e8807a92765148fda8f4149b0323b373';

    // Must match what you registered in the Spotify Developer Dashboard
    // Adjust based on where WigdosXP is hosted
    // Redirect URI — must match EXACTLY what's in Spotify Developer Dashboard
    // Add all of these to your Spotify app's Redirect URIs:
    //   https://wigdos-inc.web.app/apps/browser/pages/spotify-callback.html
    const REDIRECT_URI = (() => {
        // Try to find the top-level origin (escape nested iframes)
        let topOrigin = window.location.origin;
        try {
            let w = window;
            while (w.parent && w.parent !== w) {
                w = w.parent;
                if (w.location && w.location.origin) {
                    topOrigin = w.location.origin;
                }
            }
        } catch(e) {} // cross-origin guard
        return `${topOrigin}/apps/browser/pages/spotify-callback.html`;
    })();

    const SCOPES = [
        'user-read-currently-playing',
        'user-read-playback-state',
    ].join(' ');

    const AUTH_URL = 'https://accounts.spotify.com/authorize';
    const TOKEN_URL = 'https://accounts.spotify.com/api/token';
    const API_BASE = 'https://api.spotify.com/v1';

    // Storage keys
    const KEYS = {
        accessToken:  'spotify_access_token',
        refreshToken: 'spotify_refresh_token',
        expiresAt:    'spotify_expires_at',
        codeVerifier: 'spotify_code_verifier',
    };

    // ===================== PKCE HELPERS =====================

    function _generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values, v => chars[v % chars.length]).join('');
    }

    async function _sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return crypto.subtle.digest('SHA-256', data);
    }

    function _base64urlEncode(buffer) {
        const bytes = new Uint8Array(buffer);
        let str = '';
        bytes.forEach(b => str += String.fromCharCode(b));
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async function _generateCodeChallenge(verifier) {
        const hashed = await _sha256(verifier);
        return _base64urlEncode(hashed);
    }

    // ===================== TOKEN MANAGEMENT =====================

    function _getToken(key) {
        try { return localStorage.getItem(key); } catch(e) { return null; }
    }

    function _setToken(key, value) {
        try { localStorage.setItem(key, value); } catch(e) {}
    }

    function _clearTokens() {
        Object.values(KEYS).forEach(k => {
            try { localStorage.removeItem(k); } catch(e) {}
        });
    }

    function _isTokenExpired() {
        const expiresAt = parseInt(_getToken(KEYS.expiresAt) || '0', 10);
        return Date.now() >= expiresAt;
    }

    function _storeTokenData(data) {
        _setToken(KEYS.accessToken, data.access_token);
        if (data.refresh_token) {
            _setToken(KEYS.refreshToken, data.refresh_token);
        }
        const expiresAt = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
        _setToken(KEYS.expiresAt, expiresAt.toString());
    }

    // ===================== AUTH FLOW =====================

    async function login() {
        if (CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID_HERE') {
            console.error('[Spotify] Client ID not configured! Edit scripts/apps/browser/spotify-api.js');
            alert('Spotify Client ID not configured.\n\nTo set up:\n1. Go to https://developer.spotify.com/dashboard\n2. Create an app\n3. Copy the Client ID\n4. Paste it in scripts/apps/browser/spotify-api.js');
            return false;
        }

        const codeVerifier = _generateRandomString(128);
        _setToken(KEYS.codeVerifier, codeVerifier);

        const codeChallenge = await _generateCodeChallenge(codeVerifier);

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            scope: SCOPES,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
        });

        const authUrl = `${AUTH_URL}?${params.toString()}`;

        // Open popup for auth
        const width = 500, height = 700;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const popup = window.open(
            authUrl,
            'SpotifyAuth',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );

        // Wait for callback to post the auth code back
        return new Promise((resolve) => {
            const handler = async (event) => {
                // Accept messages from our callback page
                if (event.data && event.data.type === 'spotify-auth-callback') {
                    window.removeEventListener('message', handler);
                    clearInterval(checkClosed);

                    if (event.data.code) {
                        const success = await _exchangeCode(event.data.code);
                        resolve(success);
                    } else {
                        console.error('[Spotify] Auth error:', event.data.error);
                        resolve(false);
                    }
                }
            };

            window.addEventListener('message', handler);

            // Also check if popup was closed without completing
            const checkClosed = setInterval(() => {
                if (popup && popup.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', handler);
                    resolve(false);
                }
            }, 500);
        });
    }

    async function _exchangeCode(code) {
        const codeVerifier = _getToken(KEYS.codeVerifier);
        if (!codeVerifier) {
            console.error('[Spotify] No code verifier found');
            return false;
        }

        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('[Spotify] Token exchange failed:', err);
                return false;
            }

            const data = await response.json();
            _storeTokenData(data);
            console.log('[Spotify] Successfully authenticated!');
            return true;
        } catch (error) {
            console.error('[Spotify] Token exchange error:', error);
            return false;
        }
    }

    async function _refreshAccessToken() {
        const refreshToken = _getToken(KEYS.refreshToken);
        if (!refreshToken) return false;

        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            });

            if (!response.ok) {
                console.error('[Spotify] Token refresh failed');
                _clearTokens();
                return false;
            }

            const data = await response.json();
            _storeTokenData(data);
            return true;
        } catch (error) {
            console.error('[Spotify] Token refresh error:', error);
            return false;
        }
    }

    async function _getValidToken() {
        if (_isTokenExpired()) {
            const refreshed = await _refreshAccessToken();
            if (!refreshed) return null;
        }
        return _getToken(KEYS.accessToken);
    }

    // ===================== API METHODS =====================

    async function getCurrentlyPlaying() {
        const token = await _getValidToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE}/me/player/currently-playing`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            // 204 = nothing playing
            if (response.status === 204) return null;
            if (!response.ok) {
                if (response.status === 401) {
                    // Token invalid, try refresh once
                    const refreshed = await _refreshAccessToken();
                    if (refreshed) return getCurrentlyPlaying();
                    return null;
                }
                return null;
            }

            const data = await response.json();
            if (!data.is_playing || !data.item) return null;

            const track = data.item;
            return {
                isPlaying: data.is_playing,
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                album: track.album.name,
                albumArt: track.album.images[0]?.url || '',
                albumArtSmall: (track.album.images[2] || track.album.images[0])?.url || '',
                trackUrl: track.external_urls.spotify || '',
                duration: track.duration_ms,
                progress: data.progress_ms,
                trackId: track.id,
            };
        } catch (error) {
            console.error('[Spotify] Error fetching currently playing:', error);
            return null;
        }
    }

    async function getUserProfile() {
        const token = await _getValidToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) return null;
            const data = await response.json();
            return {
                name: data.display_name,
                id: data.id,
                url: data.external_urls?.spotify || '',
                image: data.images?.[0]?.url || '',
            };
        } catch (error) {
            console.error('[Spotify] Error fetching user profile:', error);
            return null;
        }
    }

    function isConnected() {
        return !!_getToken(KEYS.accessToken) && !!_getToken(KEYS.refreshToken);
    }

    function disconnect() {
        _clearTokens();
        console.log('[Spotify] Disconnected');
    }

    // ===================== PUBLIC API =====================

    return {
        login,
        disconnect,
        isConnected,
        getCurrentlyPlaying,
        getUserProfile,
        // Expose for testing
        get CLIENT_ID() { return CLIENT_ID; },
        get REDIRECT_URI() { return REDIRECT_URI; },
    };

})();
