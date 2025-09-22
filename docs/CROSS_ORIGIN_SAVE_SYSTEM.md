# WigdosXP Cross-Origin Save System

This document explains the cross-origin save system implementation that allows WigdosXP to manage save data for games hosted on different domains.

## Problem

Previously, WigdosXP attempted to directly access the `localStorage` of games running in iframes using `iframe.contentWindow.localStorage`. This approach only works when the iframe content is served from the same origin as WigdosXP. When games are hosted on different domains (like `https://wigdos-inc.github.io/Undertale-HTML/`), browsers block this access due to same-origin policy, causing the save system to fail.

## Solution

The save system now preserves the game's **entire localStorage**, maintaining all the game's natural save data structure and keys. It uses `postMessage` communication to work around cross-origin restrictions:

1. **Detection**: The system first attempts direct localStorage access (for same-origin content)
2. **Fallback**: If cross-origin error is detected, it switches to postMessage communication
3. **Complete Preservation**: All localStorage keys and values are saved/restored
4. **Timeout**: Operations have a 5-second timeout to handle unresponsive games

## How It Works

### Save Operation
1. WigdosXP sends a `getAllLocalStorageData` message to the game iframe
2. Game responds with `saveDataResponse` containing **all localStorage data**
3. WigdosXP uploads the entire localStorage to Firebase (if user is not a guest)

### Load Operation
1. WigdosXP downloads save data from Firebase
2. WigdosXP sends a `setAllLocalStorageData` message with **all data** to the game iframe
3. Game clears its localStorage and restores all keys/values
4. Game responds with `loadDataResponse` confirming success

## For Game Developers

Your game can now use localStorage **naturally** without any special setup:

```javascript
// Your game can use localStorage normally:
localStorage.setItem('level', '5');
localStorage.setItem('playerName', 'Alice');
localStorage.setItem('gameSettings', JSON.stringify({sound: true}));

// ALL of these will be automatically preserved by WigdosXP!
```

To enable save system support:

1. Include the `wigdosxp-save-integration.js` script in your game
2. Configure the gameId to match your game
3. The integration script handles all postMessage communication automatically
4. Optionally listen for save data restoration events

See `wigdosxp-save-integration.js` for detailed integration instructions and examples.

## Benefits

- ✅ Works with cross-origin games
- ✅ Preserves **entire localStorage** structure
- ✅ Games can use localStorage naturally without restrictions
- ✅ Maintains backward compatibility with same-origin content  
- ✅ Graceful fallback when games don't support postMessage
- ✅ Timeout handling prevents hanging operations
- ✅ Clear console logging for debugging

## Console Messages

When working correctly, you'll see these messages:

- `"Cross-origin iframe detected, using postMessage for save operation"`
- `"Cross-origin iframe detected, using postMessage for load operation"`  
- `"📁 No remote save data found or guest user"` (for guests)
- `"📝 No save data to upload or guest user"` (for guests)
- `"✅ Game data saved to Firestore"` (for logged-in users)

## Testing

The system has been tested with:
- Cross-origin iframe simulation using different ports
- PostMessage communication verification
- Complete localStorage preservation verification
- Save/load operation flow testing
- Timeout handling verification
- Error handling for unsupported games