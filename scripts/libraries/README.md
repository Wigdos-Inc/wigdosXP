# Universal Game Save System

A standalone JavaScript library for receiving and managing game save data from Firebase Firestore. This system can be used across multiple game repositories to provide cloud save functionality with offline fallback.

## Features

- **Firebase Firestore Integration**: Automatically connects to Firebase for cloud saves
- **Offline Mode Support**: Falls back to localStorage when offline or Firebase is unavailable
- **User Authentication**: Supports authenticated users and guest mode
- **Game-Agnostic**: Works with any game data structure
- **Cross-Repository**: Can be copied to any project that needs save functionality
- **Automatic Fallbacks**: Multiple layers of fallback for reliability

## Quick Start

### 1. Include the Library

Copy `universal-save.js` to your project and include it:

```html
<script src="path/to/universal-save.js"></script>
```

Or import as a module:

```javascript
const UniversalSaveSystem = require('./universal-save.js');
```

### 2. Basic Usage

```javascript
// Create and initialize the save system
const saveSystem = new UniversalSaveSystem();
await saveSystem.initialize();

// Load game data (returns default data if no save exists)
const gameData = await saveSystem.loadGameData('mygame', defaultData);

// Save game data
await saveSystem.saveGameData('mygame', gameData);

// Delete save data
await saveSystem.deleteGameData('mygame');
```

### 3. Integration Example

```javascript
class MyGame {
    constructor() {
        this.saveSystem = new UniversalSaveSystem();
        this.gameId = "mygame"; // Unique identifier
        this.gameData = null;
    }

    async initialize() {
        await this.saveSystem.initialize();
        this.gameData = await this.saveSystem.loadGameData(this.gameId, {
            level: 1,
            score: 0,
            settings: { volume: 0.8 }
        });
    }

    async save() {
        return await this.saveSystem.saveGameData(this.gameId, this.gameData);
    }
}
```

## API Reference

### UniversalSaveSystem

#### `constructor()`
Creates a new instance of the save system.

#### `async initialize(firebaseConfig?)`
Initializes the save system with Firebase connection.
- `firebaseConfig` (optional): Custom Firebase configuration object
- Returns: `Promise<boolean>` - true if Firebase connected, false if offline mode

#### `async loadGameData(gameId, defaultData?)`
Loads save data for a specific game.
- `gameId`: Unique identifier for your game
- `defaultData` (optional): Default data to return if no save exists
- Returns: `Promise<Object|null>` - The loaded save data

#### `async saveGameData(gameId, data)`
Saves game data.
- `gameId`: Unique identifier for your game
- `data`: The save data object to store
- Returns: `Promise<boolean>` - true if saved successfully

#### `async deleteGameData(gameId)`
Deletes save data for a specific game.
- `gameId`: Unique identifier for your game
- Returns: `Promise<boolean>` - true if deleted successfully

#### `getStatus()`
Returns system status information.
- Returns: `Object` with `initialized`, `isOnline`, `currentUser`, `hasFirebase`

#### `async listSaveData()`
Lists all available save data for the current user.
- Returns: `Promise<Array>` - Array of game IDs that have save data

## Firebase Configuration

### Using Default Configuration
The library includes a default Firebase configuration for WigdosXP. If you're integrating with other WigdosXP games, you don't need to provide a configuration.

```javascript
// Uses WigdosXP Firebase by default
await saveSystem.initialize();
```

### Using Custom Configuration
For standalone projects, provide your own Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    // ... other config
};

await saveSystem.initialize(firebaseConfig);
```

### Firestore Database Structure
The system stores data in the following structure:
```
game_saves/
  {username}/
    {gameId}: "{JSON_string_of_save_data}"
    undertale: "{\"level\":5,\"progress\":\"waterfall\"}"
    mygame: "{\"score\":1000,\"level\":10}"
```

## User Authentication

The system automatically detects users from these sources (in order):
1. `localStorage.username` (WigdosXP style)
2. `localStorage.user`
3. `sessionStorage.username`
4. Falls back to "guest"

Guest users save to localStorage only, while authenticated users save to both Firebase and localStorage.

## Error Handling and Fallbacks

The system includes multiple fallback layers:

1. **Primary**: Firebase Firestore (online, authenticated users)
2. **Secondary**: localStorage (offline mode, guests, or Firebase failure)
3. **Tertiary**: Default data (if no save exists anywhere)

This ensures your game always has save data to work with, even if Firebase is unavailable.

## Offline Mode

The system automatically detects when Firebase is unavailable and switches to offline mode:
- Saves go to localStorage only
- Loads come from localStorage
- No error messages for failed Firebase connections
- Seamless transition back to online mode when available

## Integration with Existing Games

### For WigdosXP Games
If you're already using the WigdosXP ecosystem, the library will automatically use the existing Firebase connection:

```javascript
// Will use existing window.firebaseAPI if available
const saveSystem = new UniversalSaveSystem();
await saveSystem.initialize();
```

### For External Games
Copy the library to your project and use with your own Firebase configuration:

```javascript
const saveSystem = new UniversalSaveSystem();
await saveSystem.initialize(yourFirebaseConfig);
```

## Example Implementation

See `universal-save-example.js` for a complete example of implementing the save system in a game called "Undertale". The example shows:

- Game initialization with save loading
- Auto-saving after important events
- Manual save/load operations
- Settings management
- Progress tracking

## Security Considerations

- The library uses client-side Firebase authentication
- All saves are tied to the authenticated user
- Guest saves are stored locally only
- Implement proper Firestore security rules in production
- Consider encrypting sensitive save data before storing

## File Size and Performance

- Library size: ~13KB minified
- No external dependencies beyond Firebase SDK
- Lazy-loads Firebase modules only when needed
- Minimal performance impact on games

## Troubleshooting

### Firebase Connection Issues
- Check your Firebase configuration
- Verify Firestore is enabled in your Firebase project
- Ensure your domain is authorized in Firebase settings

### Save Data Not Persisting
- Check browser localStorage quota
- Verify user authentication status with `getStatus()`
- Check browser console for error messages

### Cross-Domain Issues
- Ensure Firebase domain is properly configured
- Check CORS settings if serving from custom domain
- Verify localStorage is accessible in your environment