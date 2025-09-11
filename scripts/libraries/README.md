# Simple Save System for WigdosXP Games

A single JavaScript file that receives save data from Firebase and stores it in localStorage for games running in WigdosXP.

## Usage

1. Include the script in your game:
```html
<script src="simple-save.js"></script>
```

2. Use it in your game:
```javascript
const saves = new SimpleSaveSystem();

// Load save data
const data = await saves.load('undertale');
if (data) {
    // Use the loaded data
    console.log('Loaded game data:', data);
}

// Save game data  
const gameData = { level: 5, score: 1000, playerName: 'Frisk' };
await saves.save('undertale', gameData);
```

## How it works

- Automatically uses WigdosXP's existing Firebase connection
- Receives data from Firebase and stores it in localStorage
- Always saves to localStorage as backup
- Simple and lightweight - just 2KB

## Requirements

- Must be used within WigdosXP (requires `window.firebaseAPI`)
- User must be logged in for Firebase sync (guests use localStorage only)

That's it! No complex setup, no configuration needed.