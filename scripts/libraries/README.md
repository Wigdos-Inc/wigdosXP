# Simple Save System for WigdosXP Games

A single JavaScript file that reads save data from iframe localStorage and pushes it to Firestore using WigdosXP's existing Firebase connection.

## Usage

1. Include the script in WigdosXP (parent window):
```html
<script src="simple-save.js"></script>
```

2. Use it from the parent window to sync iframe saves:
```javascript
// Push iframe save data to Firestore
const saved = await pushIframeSaveToFirestore('undertale');

// Load Firestore data into iframe localStorage
const loaded = await loadFirestoreToIframe('undertale');
```

## How it works

- Runs from parent window (WigdosXP) 
- Accesses iframe localStorage directly (same-origin required)
- Uses existing WigdosXP Firebase connection
- Handles the `${gameId}SaveData` format automatically
- Simple two-function approach

## Requirements

- iframe must have id `gameIframe`
- Game must be served from same origin as WigdosXP
- User must be logged in for Firebase sync (guests ignored)

Perfect for games like Undertale that need simple save/load functionality.