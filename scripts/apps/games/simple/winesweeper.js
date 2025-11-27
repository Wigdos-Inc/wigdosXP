// Winesweeper - Classic Minesweeper Game

class Winesweeper {
    constructor() {
        this.difficulties = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 32, cols: 32, mines: 200 },
            impossible: { rows: 50, cols: 50, mines: 2490 }
        };
        
        this.currentDifficulty = 'beginner';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameStarted = false;
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.minesLeft = 0;
        
        this.points = 0;
        this.safeClicksRemaining = 0;
        this.consecutiveReveals = 0;
        this.lastRevealTime = 0;
        this.comboTimeout = null;
        this.qteActive = false;
        this.usedAbilities = false; // Track if any abilities were used
        this.qteKey = '';
        this.qteStartTime = 0;
        this.qteDuration = 1500; // 1.5 seconds to complete QTE
        this.qteAnimationFrame = null;
        this.pendingBombCell = null;
        this.qteRound = 0;
        this.qteMaxRounds = 5;
        this.qteTargetPosition = 0.5; // Will be randomized each round
        this.qteType = 'timing'; // 'timing' or 'centering'
        this.qteLinePosition = 0.5;
        this.qteLineVelocity = 0;
        this.qteDrift = 0.001; // Natural drift away from center
        this.qteControlSpeed = 0.015;
        this.qteCenterPosition = 0.5;
        this.qteLeftPressed = false;
        this.qteRightPressed = false;
        this.qteCenteringStartTime = 0;
        this.qteCenteringDuration = 3000; // 3 seconds to keep centered
        this.qteGracePeriod = 5000; // Time allowed outside zone
        this.qteOutsideZoneStart = 0; // When player left the zone
        this.qteCompletedCount = 0; // Track QTEs completed in impossible mode
        
        this.badges = []; // Player's earned badges
        this.achievementsConfig = null; // Will hold loaded achievements config
        this.badgesLoaded = false; // Track if badges have been loaded
        
        // Initialize async resources
        this.init();
    }
    
    async init() {
        // Wait for Firebase to be ready before loading badges
        await this.waitForFirebase();
        await this.loadBadges(); // Load badges from Firebase
        await this.loadAchievementsConfig(); // Load achievements config from JSON
        this.initGame();
        this.setupEventListeners();
    }
    
    async waitForFirebase() {
        console.log('Winesweeper: Waiting for Firebase and AchievementsDB...');
        
        // Check both current window and parent window (for iframe context)
        const checkAvailable = () => {
            const firebaseAPI = window.firebaseAPI || (window.parent && window.parent !== window && window.parent.firebaseAPI);
            const achievementsDB = window.AchievementsDB || (window.parent && window.parent !== window && window.parent.AchievementsDB);
            console.log('  - firebaseAPI:', typeof firebaseAPI);
            console.log('  - AchievementsDB:', typeof achievementsDB);
            return firebaseAPI && achievementsDB;
        };
        
        // If both are already ready, continue immediately
        if (checkAvailable()) {
            console.log('Winesweeper: Firebase and AchievementsDB already available');
            return;
        }
        
        // Wait for achievementsSystemReady event which fires after both Firebase and AchievementsDB are ready
        return new Promise((resolve) => {
            if (checkAvailable()) {
                resolve();
            } else {
                console.log('Winesweeper: Waiting for achievementsSystemReady event...');
                const handler = () => {
                    console.log('Winesweeper: achievementsSystemReady event received');
                    // Verify availability after event with a small delay
                    setTimeout(() => {
                        if (checkAvailable()) {
                            console.log('Winesweeper: Both systems confirmed available');
                        } else {
                            console.warn('Winesweeper: Systems not available after delay');
                        }
                        resolve();
                    }, 100);
                };
                
                // Listen on both current window and parent window
                window.addEventListener('achievementsSystemReady', handler, { once: true });
                if (window.parent && window.parent !== window) {
                    window.parent.addEventListener('achievementsSystemReady', handler, { once: true });
                }
                
                // Fallback timeout in case event doesn't fire
                setTimeout(() => {
                    console.warn('Winesweeper: Timeout waiting for achievementsSystemReady, proceeding anyway');
                    resolve();
                }, 3000);
            }
        });
    }
    
    initGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.clearTimer();
        this.usedAbilities = false; // Reset ability usage tracking
        this.qteCompletedCount = 0; // Reset QTE counter
        
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        this.minesLeft = this.totalMines;
        
        // Give 10 safe clicks for impossible mode
        if (this.currentDifficulty === 'impossible') {
            this.safeClicksRemaining = 10;
        }
        this.updateSafeClicksDisplay();
        
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        
        this.updateMineCounter();
        this.updateTimer();
        this.renderBoard();
        this.updateResetButton('🙂');
        this.updatePointsDisplay();
        this.updateAbilityButtons();
    }
    
    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentDifficulty = e.target.dataset.difficulty;
                this.points = 0;
                this.safeClicksRemaining = 0;
                this.initGame();
                this.updateSafeClicksDisplay();
            });
        });
        
        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.points = 0;
            this.safeClicksRemaining = 0;
            this.initGame();
            this.updateSafeClicksDisplay();
        });
        
        // Ability buttons
        document.getElementById('revealBombs3').addEventListener('click', () => {
            this.useAbility('reveal3', 100, 3);
        });
        
        document.getElementById('safeClick').addEventListener('click', () => {
            this.useAbility('safe', 100, 3);
        });
        
        document.getElementById('revealBombs10').addEventListener('click', () => {
            this.useAbility('reveal10', 250, 10);
        });
        
        // QTE key listeners
        document.addEventListener('keydown', (e) => {
            if (this.qteActive) {
                this.handleQTEKeyDown(e.key);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.qteActive) {
                this.handleQTEKeyUp(e.key);
            }
        });
        
        // QTE key mode toggle
        document.getElementById('qteToggle').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (this.qteKeyMode === 'arrows') {
                this.qteKeyMode = 'wasd';
                btn.dataset.mode = 'wasd';
            } else {
                this.qteKeyMode = 'arrows';
                btn.dataset.mode = 'arrows';
            }
        });
    }
    
    useAbility(type, cost, amount) {
        if (this.gameOver) {
            alert('Game is over! Start a new game.');
            return;
        }
        
        if (this.points < cost) {
            alert(`Not enough points! You need ${cost} points.`);
            return;
        }
        
        // Mark that abilities have been used this game
        this.usedAbilities = true;
        
        // Check for Overkill achievement (using 10 bombs ability in beginner mode)
        if (type === 'reveal10' && this.currentDifficulty === 'beginner' && !this.badges.includes('winesweeper_beginner_10bombs')) {
            this.awardSingleBadge('winesweeper_beginner_10bombs');
        }
        
        if (type === 'reveal3' || type === 'reveal10') {
            // Reveal random bombs
            const unrevealedMines = [];
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.board[row][col] === -1 && !this.revealed[row][col] && !this.flagged[row][col]) {
                        unrevealedMines.push([row, col]);
                    }
                }
            }
            
            if (unrevealedMines.length === 0) {
                alert('No unrevealed bombs to flag!');
                return;
            }
            
            const toReveal = Math.min(amount, unrevealedMines.length);
            for (let i = 0; i < toReveal; i++) {
                const randomIndex = Math.floor(Math.random() * unrevealedMines.length);
                const [row, col] = unrevealedMines.splice(randomIndex, 1)[0];
                this.flagged[row][col] = true;
                this.minesLeft--;
                this.updateCell(row, col);
            }
            
            this.updateMineCounter();
            this.points -= cost;
            this.updatePointsDisplay();
            this.updateAbilityButtons();
        } else if (type === 'safe') {
            this.safeClicksRemaining += amount;
            this.points -= cost;
            this.updatePointsDisplay();
            this.updateAbilityButtons();
            this.updateSafeClicksDisplay();
        }
    }
    
    updatePointsDisplay() {
        const pointsDisplay = document.getElementById('pointsDisplay');
        pointsDisplay.textContent = this.points;
        
        // Show combo multiplier if active
        if (this.consecutiveReveals >= 3) {
            let multiplier = 1;
            if (this.consecutiveReveals >= 10) {
                multiplier = 5;
            } else if (this.consecutiveReveals >= 5) {
                multiplier = 3;
            } else if (this.consecutiveReveals >= 3) {
                multiplier = 2;
            }
            pointsDisplay.textContent = `${this.points} (×${multiplier}!)`;
        }
    }
    
    updateAbilityButtons() {
        const buttons = [
            { id: 'revealBombs3', cost: 100 },
            { id: 'safeClick', cost: 100 },
            { id: 'revealBombs10', cost: 250 }
        ];
        
        buttons.forEach(btn => {
            const element = document.getElementById(btn.id);
            if (this.points >= btn.cost && !this.gameOver) {
                element.classList.remove('disabled');
                element.disabled = false;
            } else {
                element.classList.add('disabled');
                element.disabled = true;
            }
        });
    }
    
    updateSafeClicksDisplay() {
        const safeClicksDisplay = document.getElementById('safeClicksDisplay');
        if (safeClicksDisplay) {
            safeClicksDisplay.textContent = this.safeClicksRemaining;
        }
    }
    
    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        const totalCells = this.rows * this.cols;
        
        // Normal mine placement for all difficulties including impossible
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or adjacent cells
            const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
            
            if (this.board[row][col] !== -1 && !isExcluded) {
                this.board[row][col] = -1; // -1 represents a mine
                minesPlaced++;
                
                // Increment adjacent cells
                this.getAdjacentCells(row, col).forEach(([r, c]) => {
                    if (this.board[r][c] !== -1) {
                        this.board[r][c]++;
                    }
                });
            }
        }
    }
    
    getAdjacentCells(row, col) {
        const adjacent = [];
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && !(r === row && c === col)) {
                    adjacent.push([r, c]);
                }
            }
        }
        return adjacent;
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 20px)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.rows}, 20px)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    handleCellClick(e, row, col) {
        e.preventDefault();
        
        if (this.gameOver || this.revealed[row][col] || this.flagged[row][col]) {
            return;
        }
        
        // First click - place mines
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.startTimer();
        }
        
        this.revealCell(row, col);
    }
    
    handleRightClick(e, row, col) {
        e.preventDefault();
        
        if (this.gameOver || this.revealed[row][col]) {
            return;
        }
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.minesLeft += this.flagged[row][col] ? -1 : 1;
        this.updateMineCounter();
        this.updateCell(row, col);
    }
    
    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || this.revealed[row][col]) {
            return;
        }
        
        this.revealed[row][col] = true;
        this.updateCell(row, col);
        
        // Hit a mine
        if (this.board[row][col] === -1) {
            // Check if player has safe clicks remaining
            if (this.safeClicksRemaining > 0) {
                this.safeClicksRemaining--;
                this.updateSafeClicksDisplay();
                this.revealed[row][col] = false; // Unrevealed the mine
                this.pendingBombCell = { row, col };
                this.startQTE();
                return;
            }
            
            this.gameOver = true;
            this.updateResetButton('😵');
            this.revealAllMines();
            this.clearTimer();
            this.updateAbilityButtons();
            this.resetCombo();
            return;
        }
        
        // Award points for revealing a safe cell with combo multiplier
        const currentTime = Date.now();
        const timeSinceLastReveal = currentTime - this.lastRevealTime;
        
        // If less than 2 seconds since last reveal, continue combo
        if (timeSinceLastReveal < 2000 && this.lastRevealTime > 0) {
            this.consecutiveReveals++;
        } else {
            this.consecutiveReveals = 1;
        }
        
        this.lastRevealTime = currentTime;
        
        // Calculate points with multiplier
        let pointsEarned = 1;
        if (this.consecutiveReveals >= 10) {
            pointsEarned = 5; // 5x multiplier
        } else if (this.consecutiveReveals >= 5) {
            pointsEarned = 3; // 3x multiplier
        } else if (this.consecutiveReveals >= 3) {
            pointsEarned = 2; // 2x multiplier
        }
        
        this.points += pointsEarned;
        this.updatePointsDisplay();
        this.updateAbilityButtons();
        
        // Reset combo timer
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, 2000);
        
        // Empty cell - reveal adjacent cells
        if (this.board[row][col] === 0) {
            this.getAdjacentCells(row, col).forEach(([r, c]) => {
                if (!this.flagged[r][c]) {
                    this.revealCell(r, c);
                }
            });
        }
        
        this.checkWin();
    }
    
    resetCombo() {
        this.consecutiveReveals = 0;
        this.lastRevealTime = 0;
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
            this.comboTimeout = null;
        }
    }
    
    updateCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.revealed[row][col]) {
            cell.classList.add('revealed');
            const value = this.board[row][col];
            
            if (value === -1) {
                cell.textContent = '💣';
                cell.classList.add('mine');
            } else if (value > 0) {
                cell.textContent = value;
                cell.classList.add(`number-${value}`);
            }
        } else if (this.flagged[row][col]) {
            cell.textContent = '🚩';
            cell.classList.add('flagged');
        } else {
            cell.textContent = '';
            cell.classList.remove('flagged');
        }
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === -1) {
                    this.revealed[row][col] = true;
                    this.updateCell(row, col);
                }
            }
        }
    }
    
    checkWin() {
        let revealedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col]) {
                    revealedCount++;
                }
            }
        }
        
        const totalCells = this.rows * this.cols;
        if (revealedCount === totalCells - this.totalMines) {
            this.gameOver = true;
            this.updateResetButton('😎');
            this.clearTimer();
            
            // Award badges based on difficulty and ability usage
            this.awardBadges();
            
            // Flag all remaining mines
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.board[row][col] === -1 && !this.flagged[row][col]) {
                        this.flagged[row][col] = true;
                        this.updateCell(row, col);
                    }
                }
            }
            this.minesLeft = 0;
            this.updateMineCounter();
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            if (this.timer > 999) this.timer = 999;
            this.updateTimer();
        }, 1000);
    }
    
    async loadAchievementsConfig() {
        try {
            const response = await fetch('/scripts/global/achievements.json?t=' + Date.now());
            const data = await response.json();
            this.achievementsConfig = data.categories;
            console.log('Achievements config loaded:', this.achievementsConfig);
        } catch (error) {
            console.error('Error loading achievements config:', error);
        }
    }
    
    async loadBadges() {
        // Load badges using centralized AchievementsDB module
        // Check both current window and parent window (for iframe context)
        const AchievementsDB = window.AchievementsDB || (window.parent && window.parent !== window && window.parent.AchievementsDB);
        
        if (!AchievementsDB) {
            console.error('AchievementsDB not available - badges will not be loaded');
            this.badgesLoaded = true;
            this.badges = [];
            return;
        }
        
        try {
            this.badges = await AchievementsDB.loadAchievements();
            console.log('✓ Loaded badges via AchievementsDB:', this.badges);
        } catch (error) {
            console.error('Error loading badges:', error);
            this.badges = [];
        }
        
        this.badgesLoaded = true;
    }
    
    async saveBadges() {
        // Save badges using centralized AchievementsDB module
        // Check both current window and parent window (for iframe context)
        const AchievementsDB = window.AchievementsDB || (window.parent && window.parent !== window && window.parent.AchievementsDB);
        
        if (!AchievementsDB) {
            console.error('AchievementsDB not available - badges will not be saved');
            return false;
        }
        
        // Get username from current or parent window
        const getUser = window.getUser || (window.parent && window.parent !== window && window.parent.getUser);
        const username = getUser ? getUser() : 'guest';
        
        console.log('Attempting to save badges via AchievementsDB for user:', username);
        console.log('Badges to save:', this.badges);
        
        try {
            const success = await AchievementsDB.saveAchievements(this.badges, username);
            console.log('✓ Badges successfully saved via AchievementsDB:', success);
            
            // Dispatch events to notify taskbar to refresh badges
            if (window.parent && window.parent !== window) {
                window.parent.dispatchEvent(new Event('achievementSaved'));
                window.parent.dispatchEvent(new Event('badgesUpdated'));
            }
            window.dispatchEvent(new Event('achievementSaved'));
            window.dispatchEvent(new Event('badgesUpdated'));
            
            return success;
        } catch (error) {
            console.error('Error saving badges:', error);
            return false;
        }
    }
    
    async awardSingleBadge(badgeId) {
        // Get badge info from config
        if (!this.achievementsConfig) {
            console.error('Achievements config not loaded yet');
            return;
        }
        
        let badgeInfo = null;
        for (const categoryKey in this.achievementsConfig) {
            const category = this.achievementsConfig[categoryKey];
            if (category.badges[badgeId]) {
                badgeInfo = category.badges[badgeId];
                break;
            }
        }
        
        if (!badgeInfo) {
            console.error('Badge not found in config:', badgeId);
            return;
        }
        
        // Check if badge already exists before adding
        if (this.badges.includes(badgeId)) {
            console.log('Badge already earned:', badgeId);
            return;
        }
        
        console.log('Awarding badge:', badgeId);
        this.badges.push(badgeId);
        this.showBadgeNotification(badgeInfo);
        await this.saveBadges();
    }
    
    async awardBadges() {
        console.log('Checking badges - Difficulty:', this.currentDifficulty, 'Used abilities:', this.usedAbilities);
        console.log('Current badges:', this.badges);
        
        if (!this.achievementsConfig) {
            console.error('Achievements config not loaded');
            return;
        }
        
        const badgesToAward = [];
        const winesweeperBadges = this.achievementsConfig.winesweeper.badges;
        
        // Badge 1: Beat Impossible difficulty
        if (this.currentDifficulty === 'impossible' && !this.badges.includes('winesweeper_impossible')) {
            badgesToAward.push({
                id: 'winesweeper_impossible',
                ...winesweeperBadges.winesweeper_impossible
            });
        }
        
        // Badge 2: Beat Expert with abilities
        if (this.currentDifficulty === 'expert' && this.usedAbilities && !this.badges.includes('winesweeper_expert_abilities')) {
            badgesToAward.push({
                id: 'winesweeper_expert_abilities',
                ...winesweeperBadges.winesweeper_expert_abilities
            });
        }
        
        // Badge 3: Beat Expert without abilities
        if (this.currentDifficulty === 'expert' && !this.usedAbilities && !this.badges.includes('winesweeper_expert_no_abilities')) {
            badgesToAward.push({
                id: 'winesweeper_expert_no_abilities',
                ...winesweeperBadges.winesweeper_expert_no_abilities
            });
        }
        
        // Badge 4: Beat Intermediate with abilities
        if (this.currentDifficulty === 'intermediate' && this.usedAbilities && !this.badges.includes('winesweeper_intermediate_abilities')) {
            badgesToAward.push({
                id: 'winesweeper_intermediate_abilities',
                ...winesweeperBadges.winesweeper_intermediate_abilities
            });
        }
        
        // Badge 5: Beat Intermediate without abilities
        if (this.currentDifficulty === 'intermediate' && !this.usedAbilities && !this.badges.includes('winesweeper_intermediate_no_abilities')) {
            badgesToAward.push({
                id: 'winesweeper_intermediate_no_abilities',
                ...winesweeperBadges.winesweeper_intermediate_no_abilities
            });
        }
        
        // Badge 6: Beat Beginner with abilities
        if (this.currentDifficulty === 'beginner' && this.usedAbilities && !this.badges.includes('winesweeper_beginner_abilities')) {
            badgesToAward.push({
                id: 'winesweeper_beginner_abilities',
                ...winesweeperBadges.winesweeper_beginner_abilities
            });
        }
        
        // Badge 7: Beat any difficulty without abilities (beginner or higher)
        if (!this.usedAbilities && !this.badges.includes('winesweeper_no_abilities')) {
            badgesToAward.push({
                id: 'winesweeper_no_abilities',
                ...winesweeperBadges.winesweeper_no_abilities
            });
        }
        
        // Badge 8: Overkill (awarded during gameplay, not on win - checked here for reference)
        // This badge is awarded immediately in useAbility() when player uses 10 bombs ability in beginner mode
        
        // Award badges and save to database
        if (badgesToAward.length > 0) {
            console.log('Awarding badges:', badgesToAward.map(b => b.id));
            for (const badge of badgesToAward) {
                // Double-check to prevent duplicates
                if (!this.badges.includes(badge.id)) {
                    this.badges.push(badge.id);
                    this.showBadgeNotification(badge);
                }
            }
            
            await this.saveBadges();
        } else {
            console.log('No new badges to award');
        }
    }
    
    showBadgeNotification(badge) {
        // Play achievement sound
        const achievementSound = new Audio('/assets/audio/system/achievment.mp3');
        achievementSound.volume = 0.5;
        achievementSound.play().catch(err => console.log('Audio play failed:', err));
        
        // Create a notification overlay to show the earned badge
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        
        // Check if this is the impossible badge for special effects
        const badgeId = badge.id || 'unknown';
        const isImpossible = badgeId === 'winesweeper_impossible';
        const sparkleClass = isImpossible ? 'badge-icon-sparkle' : '';
        
        notification.innerHTML = `
            <div class="badge-notification-content">
                <div class="badge-notification-header">
                    <div class="badge-notification-icon"><img src="/assets/images/icons/achievment/info.gif" alt="Achievement"></div>
                    <div class="badge-notification-title">Achievement Unlocked</div>
                </div>
                <div class="badge-notification-body">
                    <div class="badge-icon ${sparkleClass}"><img src="${badge.icon}" alt="${badge.name}"></div>
                    <div class="badge-info">
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-desc">${badge.description}</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles dynamically if not already present
        if (!document.getElementById('badge-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'badge-notification-styles';
            style.textContent = `
                .badge-notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideIn 0.5s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                
                .badge-notification-content {
                    background: linear-gradient(to bottom, #0054e3, #0041b8);
                    border: 2px solid #003399;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5),
                                inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    width: 320px;
                    font-family: 'Tahoma', 'Segoe UI', sans-serif;
                    overflow: hidden;
                }
                
                .badge-notification-header {
                    background: linear-gradient(to bottom, #0078d7, #0054e3);
                    border-bottom: 1px solid #003d99;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .badge-notification-icon {
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .badge-notification-icon img {
                    width: 16px;
                    height: 16px;
                }
                
                .badge-notification-title {
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: bold;
                    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
                }
                
                .badge-notification-body {
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: linear-gradient(to bottom, #d6e8ff, #c3ddf9);
                }
                
                .badge-icon {
                    flex-shrink: 0;
                    width: 64px;
                    height: 64px;
                    border: 2px solid #0054e3;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5),
                                0 2px 4px rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                
                .badge-icon img {
                    max-width: 100%;
                    max-height: 100%;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .badge-icon-sparkle {
                    animation: sparkle 1s ease-in-out infinite;
                    border-color: gold;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.6),
                                inset 0 0 0 1px rgba(255, 215, 0, 0.3);
                }
                
                @keyframes sparkle {
                    0%, 100% { 
                        box-shadow: 0 0 10px rgba(255, 215, 0, 0.6),
                                    inset 0 0 0 1px rgba(255, 215, 0, 0.3);
                    }
                    50% { 
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.9),
                                    inset 0 0 0 1px rgba(255, 215, 0, 0.6);
                    }
                }
                
                .badge-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .badge-name {
                    color: #003d99;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 6px;
                    line-height: 1.3;
                    word-wrap: break-word;
                }
                
                .badge-desc {
                    color: #0054e3;
                    font-size: 11px;
                    line-height: 1.4;
                    word-wrap: break-word;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 4000);
    }
    
    async awardQTEMasterBadge() {
        // Award badge for completing 10 QTEs in impossible mode
        const badgeId = 'winesweeper_qte_master';
        if (this.badges.includes(badgeId)) {
            return; // Already has this badge
        }
        
        if (!this.achievementsConfig) {
            console.error('Achievements config not loaded');
            return;
        }
        
        const badgeInfo = this.achievementsConfig.winesweeper.badges[badgeId];
        if (badgeInfo) {
            console.log('Awarding QTE Master badge');
            this.badges.push(badgeId);
            this.showBadgeNotification({
                id: badgeId,
                ...badgeInfo
            });
            await this.saveBadges();
        }
    }
    
    async awardQTESurvivorBadge() {
        // Award badge for completing a QTE on non-impossible mode
        const badgeId = 'winesweeper_qte_survivor';
        if (this.badges.includes(badgeId)) {
            return; // Already has this badge
        }
        
        if (!this.achievementsConfig) {
            console.error('Achievements config not loaded');
            return;
        }
        
        const badgeInfo = this.achievementsConfig.winesweeper.badges[badgeId];
        if (badgeInfo) {
            console.log('Awarding QTE Survivor badge');
            this.badges.push(badgeId);
            this.showBadgeNotification({
                id: badgeId,
                ...badgeInfo
            });
            await this.saveBadges();
        }
    }
    
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        document.getElementById('timerDisplay').textContent = this.timer.toString().padStart(3, '0');
    }
    
    updateMineCounter() {
        const count = Math.max(0, Math.min(999, this.minesLeft));
        document.getElementById('mineCounter').textContent = count.toString().padStart(3, '0');
    }
    
    updateResetButton(emoji) {
        document.getElementById('resetButton').textContent = emoji;
    }
    
    startQTE() {
        this.qteActive = true;
        
        // Random chance to pick QTE type (1/3 each)
        const rand = Math.random();
        if (rand < 0.33) {
            this.qteType = 'timing';
        } else if (rand < 0.66) {
            this.qteType = 'centering';
        } else {
            this.qteType = 'sequence';
        }
        
        // Set rounds based on difficulty and QTE type
        if (this.currentDifficulty === 'impossible') {
            // Timing QTE gets 25 rounds, Centering QTE gets 15 rounds, Sequence gets 15 rounds
            if (this.qteType === 'timing') {
                this.qteMaxRounds = 25;
            } else if (this.qteType === 'centering') {
                this.qteMaxRounds = 15;
            } else {
                this.qteMaxRounds = 15;
            }
        } else {
            this.qteMaxRounds = 5;
        }
        
        this.qteRound = 1;
        this.startQTERound();
    }
    
    startQTERound() {
        if (this.qteType === 'timing') {
            this.startTimingQTE();
        } else if (this.qteType === 'centering') {
            this.startCenteringQTE();
        } else {
            this.startSequenceQTE();
        }
    }
    
    startTimingQTE() {
        const randomIndex = Math.floor(Math.random() * 4);
        
        if (this.qteKeyMode === 'arrows') {
            const keys = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
            const keyDisplays = ['↑', '←', '↓', '→'];
            this.qteKey = keys[randomIndex];
            this.qteKeyDisplay = keyDisplays[randomIndex];
        } else {
            const keys = ['w', 'a', 's', 'd'];
            const keyDisplays = ['W', 'A', 'S', 'D'];
            this.qteKey = keys[randomIndex];
            this.qteKeyDisplay = keyDisplays[randomIndex];
        }
        
        this.qteStartTime = Date.now();
        
        // Randomize target position (between 30% and 70% to avoid edges)
        this.qteTargetPosition = 0.3 + Math.random() * 0.4;
        
        // Calculate speed based on distance from center (0.5)
        // Closer to center = slower, further from center = faster
        const distanceFromCenter = Math.abs(this.qteTargetPosition - 0.5);
        
        // Progressive speed for impossible mode: starts slow, gets faster each round
        if (this.currentDifficulty === 'impossible') {
            // Use exponential curve for acceleration - slower start, faster end
            // Rounds 1-5: Very slow progression (2200-2000ms)
            // Rounds 6-15: Moderate acceleration (2000-1400ms)
            // Rounds 16-25: Rapid acceleration (1400-1000ms) with 1000ms cap
            const roundProgress = (this.qteRound - 1) / (this.qteMaxRounds - 1);
            const exponentialProgress = Math.pow(roundProgress, 2.5); // Exponential curve
            const baseSpeed = 2200 - (exponentialProgress * 1200); // Increased from 2000 to 2200, reduced multiplier from 1300 to 1200
            // Add distance variance (±200ms)
            const calculatedSpeed = baseSpeed + (distanceFromCenter * 2 * 200);
            // Cap at 600ms minimum for rounds 16-25
            this.qteDuration = this.qteRound >= 16 ? Math.max(600, calculatedSpeed) : calculatedSpeed;
        } else {
            // Normal mode: Speed ranges from 1200ms (close) to 1900ms (far)
            this.qteDuration = 1200 + (distanceFromCenter * 2 * 700);
        }
        
        const overlay = document.getElementById('qteOverlay');
        const keyDisplay = document.getElementById('qteKeyDisplay');
        const resultDisplay = document.getElementById('qteResult');
        const timerFill = document.getElementById('qteTimerFill');
        const targetZone = document.querySelector('.qte-target-zone');
        
        overlay.style.display = 'flex';
        overlay.dataset.qteType = 'timing';
        keyDisplay.textContent = this.qteKeyDisplay;
        keyDisplay.style.display = 'block'; // Make sure it's visible for timing mode
        resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - TIMING`;
        resultDisplay.style.color = '#0054E3';
        timerFill.style.width = '0%';
        timerFill.style.opacity = '1'; // Make sure it's visible
        timerFill.style.display = 'block';
        
        // Hide sequence keys container
        const keysContainer = document.getElementById('qteSequenceKeysContainer');
        if (keysContainer) keysContainer.style.display = 'none';
        
        // Position the target zone (center it on the target position)
        // Target zone is 20% wide, so subtract 10% to center it
        targetZone.style.left = (this.qteTargetPosition * 100 - 10) + '%';
        targetZone.style.width = '20%'; // Reset to default width
        targetZone.style.display = 'block';
        
        // Hide all boxes if they exist
        const leftBox = document.getElementById('qteLeftBox');
        const rightBox = document.getElementById('qteRightBox');
        const cornerLeftBox = document.getElementById('qteCornerLeftBox');
        const cornerRightBox = document.getElementById('qteCornerRightBox');
        const extraBox1 = document.getElementById('qteExtraBox1');
        const extraBox2 = document.getElementById('qteExtraBox2');
        if (leftBox) leftBox.style.display = 'none';
        if (rightBox) rightBox.style.display = 'none';
        if (cornerLeftBox) cornerLeftBox.style.display = 'none';
        if (cornerRightBox) cornerRightBox.style.display = 'none';
        if (extraBox1) extraBox1.style.display = 'none';
        if (extraBox2) extraBox2.style.display = 'none';
        
        this.animateQTE();
    }
    
    startCenteringQTE() {
        // Randomize center position (can be anywhere from 0% to 100%)
        this.qteCenterPosition = Math.random();
        
        // Calculate box size first to determine safe starting position
        // Increased from 0.02 to 0.04 per round for faster growth
        this.qteBoxSize = 0.1 + ((this.qteRound - 1) * 0.04);
        this.qteBoxSize = Math.min(0.75, this.qteBoxSize); // Increased cap from 0.7 to 0.75
        
        // Only set initial position on first round, otherwise keep last position
        if (this.qteRound === 1) {
            // Start player outside the danger zone (randomly left or right of it)
            const dangerMin = this.qteCenterPosition - (this.qteBoxSize / 2);
            const dangerMax = this.qteCenterPosition + (this.qteBoxSize / 2);
            
            if (Math.random() < 0.5) {
                // Start to the left of danger zone
                this.qteLinePosition = Math.max(0, dangerMin - 0.1);
            } else {
                // Start to the right of danger zone
                this.qteLinePosition = Math.min(1, dangerMax + 0.1);
            }
        }
        // else: keep this.qteLinePosition at its last value from previous round
        
        this.qteLineVelocity = 0;
        this.qteLeftPressed = false;
        this.qteRightPressed = false;
        this.qteOutsideZoneStart = 0; // Reset outside zone timer
        
        // Constant drift speed (reduced and constant across all rounds)
        let baseDrift = 0.0003;
        
        // Base 5 seconds to keep centered, decrease 0.2 seconds per round
        this.qteCenteringDuration = 5000 - ((this.qteRound - 1) * 200);
        // Minimum 1 second
        this.qteCenteringDuration = Math.max(1000, this.qteCenteringDuration);
        
        // Grace period: 5 seconds allowed outside zone, decrease 0.2 seconds per round
        this.qteGracePeriod = 5000 - ((this.qteRound - 1) * 200);
        // Minimum 1 second
        this.qteGracePeriod = Math.max(1000, this.qteGracePeriod);
        
        if (this.currentDifficulty === 'impossible') {
            baseDrift = 0.0005; // Constant drift for impossible mode too
        }
        this.qteDrift = baseDrift;
        
        // Set keys based on mode
        if (this.qteKeyMode === 'arrows') {
            this.qteKeyDisplay = '← / →';
        } else {
            this.qteKeyDisplay = 'A / D';
        }
        
        const overlay = document.getElementById('qteOverlay');
        const keyDisplay = document.getElementById('qteKeyDisplay');
        const resultDisplay = document.getElementById('qteResult');
        const targetZone = document.querySelector('.qte-target-zone');
        const timerFill = document.getElementById('qteTimerFill');
        
        overlay.style.display = 'flex';
        overlay.dataset.qteType = 'centering';
        keyDisplay.textContent = this.qteKeyDisplay;
        resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - AVOID BOX`;
        resultDisplay.style.color = '#0054E3';
        
        // Hide key display for centering mode, show timer fill
        keyDisplay.style.display = 'none';
        timerFill.style.opacity = '1';
        timerFill.style.display = 'block';
        
        // Hide sequence keys container
        const keysContainer = document.getElementById('qteSequenceKeysContainer');
        if (keysContainer) keysContainer.style.display = 'none';
        
        // Position and size the main target zone (center it on the target position)
        targetZone.style.left = (this.qteCenterPosition * 100 - (this.qteBoxSize * 100 / 2)) + '%';
        targetZone.style.width = (this.qteBoxSize * 100) + '%';
        targetZone.style.display = 'block'; // Show the target zone for centering QTE
        
        // For rounds above 7, create two additional small danger boxes on the sides
        if (this.qteRound > 7) {
            // Create left side box if it doesn't exist
            let leftBox = document.getElementById('qteLeftBox');
            if (!leftBox) {
                leftBox = document.createElement('div');
                leftBox.id = 'qteLeftBox';
                leftBox.className = 'qte-target-zone';
                leftBox.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                document.querySelector('.qte-timer-bar').appendChild(leftBox);
            }
            
            // Create right side box if it doesn't exist
            let rightBox = document.getElementById('qteRightBox');
            if (!rightBox) {
                rightBox = document.createElement('div');
                rightBox.id = 'qteRightBox';
                rightBox.className = 'qte-target-zone';
                rightBox.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                document.querySelector('.qte-timer-bar').appendChild(rightBox);
            }
            
            // Small box size (5% of bar)
            const smallBoxSize = 0.05;
            
            // Position left box at 10% from left
            leftBox.style.left = '10%';
            leftBox.style.width = (smallBoxSize * 100) + '%';
            leftBox.style.display = 'block';
            
            // Position right box at 85% from left (10% from right edge)
            rightBox.style.left = '85%';
            rightBox.style.width = (smallBoxSize * 100) + '%';
            rightBox.style.display = 'block';
            
            // Store small box positions for collision detection
            this.qteLeftBoxMin = 0.10;
            this.qteLeftBoxMax = 0.10 + smallBoxSize;
            this.qteRightBoxMin = 0.85;
            this.qteRightBoxMax = 0.85 + smallBoxSize;
            
            // For round 10+, add corner boxes
            if (this.qteRound >= 10) {
                // Create corner boxes if they don't exist
                let cornerLeftBox = document.getElementById('qteCornerLeftBox');
                if (!cornerLeftBox) {
                    cornerLeftBox = document.createElement('div');
                    cornerLeftBox.id = 'qteCornerLeftBox';
                    cornerLeftBox.className = 'qte-target-zone';
                    cornerLeftBox.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                    document.querySelector('.qte-timer-bar').appendChild(cornerLeftBox);
                }
                
                let cornerRightBox = document.getElementById('qteCornerRightBox');
                if (!cornerRightBox) {
                    cornerRightBox = document.createElement('div');
                    cornerRightBox.id = 'qteCornerRightBox';
                    cornerRightBox.className = 'qte-target-zone';
                    cornerRightBox.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                    document.querySelector('.qte-timer-bar').appendChild(cornerRightBox);
                }
                
                // Position corner left box at 0% (far left corner)
                cornerLeftBox.style.left = '0%';
                cornerLeftBox.style.width = (smallBoxSize * 100) + '%';
                cornerLeftBox.style.display = 'block';
                
                // Position corner right box at 95% from left (far right corner)
                cornerRightBox.style.left = '95%';
                cornerRightBox.style.width = (smallBoxSize * 100) + '%';
                cornerRightBox.style.display = 'block';
                
                // Store corner box positions for collision detection
                this.qteCornerLeftBoxMin = 0;
                this.qteCornerLeftBoxMax = smallBoxSize;
                this.qteCornerRightBoxMin = 0.95;
                this.qteCornerRightBoxMax = 0.95 + smallBoxSize;
            } else {
                // Hide corner boxes if they exist
                const cornerLeftBox = document.getElementById('qteCornerLeftBox');
                const cornerRightBox = document.getElementById('qteCornerRightBox');
                if (cornerLeftBox) cornerLeftBox.style.display = 'none';
                if (cornerRightBox) cornerRightBox.style.display = 'none';
            }
            
            // For round 13-15, add 2 more boxes at 30% and 65%
            if (this.qteRound >= 13) {
                // Create extra boxes if they don't exist
                let extraBox1 = document.getElementById('qteExtraBox1');
                if (!extraBox1) {
                    extraBox1 = document.createElement('div');
                    extraBox1.id = 'qteExtraBox1';
                    extraBox1.className = 'qte-target-zone';
                    extraBox1.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                    document.querySelector('.qte-timer-bar').appendChild(extraBox1);
                }
                
                let extraBox2 = document.getElementById('qteExtraBox2');
                if (!extraBox2) {
                    extraBox2 = document.createElement('div');
                    extraBox2.id = 'qteExtraBox2';
                    extraBox2.className = 'qte-target-zone';
                    extraBox2.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                    document.querySelector('.qte-timer-bar').appendChild(extraBox2);
                }
                
                // Position extra boxes
                extraBox1.style.left = '30%';
                extraBox1.style.width = (smallBoxSize * 100) + '%';
                extraBox1.style.display = 'block';
                
                extraBox2.style.left = '65%';
                extraBox2.style.width = (smallBoxSize * 100) + '%';
                extraBox2.style.display = 'block';
                
                // Store extra box positions for collision detection
                this.qteExtraBox1Min = 0.30;
                this.qteExtraBox1Max = 0.30 + smallBoxSize;
                this.qteExtraBox2Min = 0.65;
                this.qteExtraBox2Max = 0.65 + smallBoxSize;
            } else {
                // Hide extra boxes if they exist
                const extraBox1 = document.getElementById('qteExtraBox1');
                const extraBox2 = document.getElementById('qteExtraBox2');
                if (extraBox1) extraBox1.style.display = 'none';
                if (extraBox2) extraBox2.style.display = 'none';
            }
        } else {
            // Hide side boxes if they exist
            const leftBox = document.getElementById('qteLeftBox');
            const rightBox = document.getElementById('qteRightBox');
            const cornerLeftBox = document.getElementById('qteCornerLeftBox');
            const cornerRightBox = document.getElementById('qteCornerRightBox');
            const extraBox1 = document.getElementById('qteExtraBox1');
            const extraBox2 = document.getElementById('qteExtraBox2');
            if (leftBox) leftBox.style.display = 'none';
            if (rightBox) rightBox.style.display = 'none';
            if (cornerLeftBox) cornerLeftBox.style.display = 'none';
            if (cornerRightBox) cornerRightBox.style.display = 'none';
            if (extraBox1) extraBox1.style.display = 'none';
            if (extraBox2) extraBox2.style.display = 'none';
        }
        
        // Calculate grace period - 4 seconds base, decrease 0.2s per round
        this.qteBoxGracePeriod = 4000 - ((this.qteRound - 1) * 200);
        this.qteBoxGracePeriod = Math.max(500, this.qteBoxGracePeriod); // Minimum 0.5 seconds
        this.qteInsideBoxStart = 0; // Track when player enters box
        
        this.qteCenteringStartTime = Date.now();
        this.animateCenteringQTE();
    }
    
    animateCenteringQTE() {
        if (!this.qteActive || this.qteType !== 'centering') return;
        
        // Check if time is up
        const elapsed = Date.now() - this.qteCenteringStartTime;
        const timeRemaining = this.qteCenteringDuration - elapsed;
        
        // Apply drift TOWARDS the danger zone (opposite of away)
        const distanceFromCenter = this.qteLinePosition - this.qteCenterPosition;
        const driftForce = distanceFromCenter > 0 ? -this.qteDrift : this.qteDrift;
        this.qteLineVelocity += driftForce;
        
        // Apply player control - reduced speed for slower movement
        if (this.qteLeftPressed) {
            this.qteLineVelocity -= 0.005;
        }
        if (this.qteRightPressed) {
            this.qteLineVelocity += 0.005;
        }
        
        // Apply damping to velocity for smoother control
        this.qteLineVelocity *= 0.88;
        
        // Update position
        this.qteLinePosition += this.qteLineVelocity;
        
        // Clamp to edges with bounce
        if (this.qteLinePosition <= 0) {
            this.qteLinePosition = 0;
            this.qteLineVelocity *= -0.3;
        } else if (this.qteLinePosition >= 1) {
            this.qteLinePosition = 1;
            this.qteLineVelocity *= -0.3;
        }
        
        // Update line position visual (still update width even though invisible, for bar position)
        const timerFill = document.getElementById('qteTimerFill');
        timerFill.style.width = (this.qteLinePosition * 100) + '%';
        
        // Check if BAR (the end of the timer fill) is inside the danger zone
        // The bar position is at qteLinePosition
        // The danger zone is centered at qteCenterPosition with size qteBoxSize
        const dangerMin = this.qteCenterPosition - (this.qteBoxSize / 2);
        const dangerMax = this.qteCenterPosition + (this.qteBoxSize / 2);
        
        let isInDangerZone = false;
        
        // Check main danger zone
        if (this.qteLinePosition >= dangerMin && this.qteLinePosition <= dangerMax) {
            isInDangerZone = true;
        }
        
        // Check side boxes if round > 7
        if (this.qteRound > 7) {
            if ((this.qteLinePosition >= this.qteLeftBoxMin && this.qteLinePosition <= this.qteLeftBoxMax) ||
                (this.qteLinePosition >= this.qteRightBoxMin && this.qteLinePosition <= this.qteRightBoxMax)) {
                isInDangerZone = true;
            }
            
            // Check corner boxes if round >= 10
            if (this.qteRound >= 10) {
                if ((this.qteLinePosition >= this.qteCornerLeftBoxMin && this.qteLinePosition <= this.qteCornerLeftBoxMax) ||
                    (this.qteLinePosition >= this.qteCornerRightBoxMin && this.qteLinePosition <= this.qteCornerRightBoxMax)) {
                    isInDangerZone = true;
                }
            }
            
            // Check extra boxes if round >= 13
            if (this.qteRound >= 13) {
                if ((this.qteLinePosition >= this.qteExtraBox1Min && this.qteLinePosition <= this.qteExtraBox1Max) ||
                    (this.qteLinePosition >= this.qteExtraBox2Min && this.qteLinePosition <= this.qteExtraBox2Max)) {
                    isInDangerZone = true;
                }
            }
        }
        
        if (isInDangerZone) {
            // Bar is inside danger zone - start grace period timer
            if (this.qteInsideBoxStart === 0) {
                // Just entered the box
                this.qteInsideBoxStart = Date.now();
            } else {
                // Check how long we've been inside
                const timeInside = Date.now() - this.qteInsideBoxStart;
                if (timeInside >= this.qteBoxGracePeriod) {
                    // Grace period expired - FAIL
                    this.failQTE();
                    return;
                }
            }
        } else {
            // Outside danger zone - reset grace period timer
            this.qteInsideBoxStart = 0;
        }
        
        // Update the display to show remaining time and controls
        const resultDisplay = document.getElementById('qteResult');
        const timeLeft = Math.max(0, (this.qteCenteringDuration - elapsed) / 1000).toFixed(1);
        
        // Show grace period info if inside box
        if (this.qteInsideBoxStart > 0) {
            const graceTimeInside = Date.now() - this.qteInsideBoxStart;
            const graceTimeLeft = Math.max(0, (this.qteBoxGracePeriod - graceTimeInside) / 1000).toFixed(1);
            resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - AVOID BOX | Time: ${timeLeft}s | IN BOX: ${graceTimeLeft}s!`;
            resultDisplay.style.color = '#FF0000';
        } else {
            resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - AVOID BOX | Time: ${timeLeft}s | Controls: ${this.qteKeyDisplay}`;
            resultDisplay.style.color = '#0054E3';
        }
        
        // Check if time is up while in zone - success
        if (timeRemaining <= 0) {
            this.successCenteringRound();
            return;
        }
        
        this.qteAnimationFrame = requestAnimationFrame(() => this.animateCenteringQTE());
    }
    
    animateQTE() {
        if (!this.qteActive || this.qteType !== 'timing') return;
        
        const elapsed = Date.now() - this.qteStartTime;
        const progress = Math.min(elapsed / this.qteDuration, 1);
        
        const timerFill = document.getElementById('qteTimerFill');
        timerFill.style.width = (progress * 100) + '%';
        
        if (progress >= 1) {
            // Failed - time ran out
            this.failQTE();
        } else {
            this.qteAnimationFrame = requestAnimationFrame(() => this.animateQTE());
        }
    }
    
    handleQTEKeyDown(key) {
        if (!this.qteActive) return;
        
        if (this.qteType === 'timing') {
            const normalizedKey = this.qteKeyMode === 'wasd' ? key.toLowerCase() : key;
            if (normalizedKey === this.qteKey) {
                this.handleTimingQTEPress();
            }
        } else if (this.qteType === 'centering') {
            // Handle left/right controls
            if (this.qteKeyMode === 'arrows') {
                if (key === 'ArrowLeft') {
                    this.qteLeftPressed = true;
                } else if (key === 'ArrowRight') {
                    this.qteRightPressed = true;
                }
            } else {
                const normalizedKey = key.toLowerCase();
                if (normalizedKey === 'a') {
                    this.qteLeftPressed = true;
                } else if (normalizedKey === 'd') {
                    this.qteRightPressed = true;
                }
            }
        } else if (this.qteType === 'sequence') {
            this.handleSequenceKeyPress(key);
        }
    }
    
    handleQTEKeyUp(key) {
        if (!this.qteActive || this.qteType !== 'centering') return;
        
        // Handle key release for centering mode
        if (this.qteKeyMode === 'arrows') {
            if (key === 'ArrowLeft') {
                this.qteLeftPressed = false;
            } else if (key === 'ArrowRight') {
                this.qteRightPressed = false;
            }
        } else {
            const normalizedKey = key.toLowerCase();
            if (normalizedKey === 'a') {
                this.qteLeftPressed = false;
            } else if (normalizedKey === 'd') {
                this.qteRightPressed = false;
            }
        }
    }
    
    handleTimingQTEPress() {
        const elapsed = Date.now() - this.qteStartTime;
        const progress = elapsed / this.qteDuration;
        
        // Success zone is ±10% around the target position (matching the 20% wide visual zone)
        const successMin = this.qteTargetPosition - 0.1;
        const successMax = this.qteTargetPosition + 0.1;
        
        if (progress >= successMin && progress <= successMax) {
            // Success for this round
            if (this.qteRound < this.qteMaxRounds) {
                // More rounds to go
                this.qteRound++;
                if (this.qteAnimationFrame) {
                    cancelAnimationFrame(this.qteAnimationFrame);
                }
                this.startQTERound();
            } else {
                // All rounds completed
                this.successQTE();
            }
        } else {
            this.failQTE();
        }
    }
    
    successCenteringRound() {
        // Success for this round
        if (this.qteRound < this.qteMaxRounds) {
            // More rounds to go - continue immediately without pause
            this.qteRound++;
            if (this.qteAnimationFrame) {
                cancelAnimationFrame(this.qteAnimationFrame);
            }
            
            // Reset key states
            this.qteLeftPressed = false;
            this.qteRightPressed = false;
            this.qteOutsideZoneStart = 0; // Reset grace period timer
            this.qteInsideBoxStart = 0; // Reset box grace period timer
            
            // Start next round immediately
            this.startQTERound();
        } else {
            // All rounds completed
            this.successQTE();
        }
    }
    
    successQTE() {
        this.qteActive = false;
        if (this.qteAnimationFrame) {
            cancelAnimationFrame(this.qteAnimationFrame);
        }
        
        const resultDisplay = document.getElementById('qteResult');
        resultDisplay.textContent = 'ALL ROUNDS COMPLETE! 💚';
        resultDisplay.style.color = '#00FF00';
        
        // Increment QTE counter for impossible mode
        if (this.currentDifficulty === 'impossible') {
            this.qteCompletedCount++;
            // Check for 10 QTEs achievement
            if (this.qteCompletedCount >= 10) {
                this.awardQTEMasterBadge();
            }
        } else {
            // Award achievement for beating QTE on non-impossible modes
            this.awardQTESurvivorBadge();
        }
        
        // Flag the bomb
        if (this.pendingBombCell) {
            const { row, col } = this.pendingBombCell;
            this.flagged[row][col] = true;
            this.minesLeft--;
            this.updateCell(row, col);
            this.updateMineCounter();
            
            // In impossible mode, reveal 98 random bombs and give vague safe zone hint
            if (this.currentDifficulty === 'impossible') {
                const unrevealedMines = [];
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        if (this.board[r][c] === -1 && !this.revealed[r][c] && !this.flagged[r][c]) {
                            unrevealedMines.push([r, c]);
                        }
                    }
                }
                
                const toReveal = Math.min(98, unrevealedMines.length);
                for (let i = 0; i < toReveal; i++) {
                    const randomIndex = Math.floor(Math.random() * unrevealedMines.length);
                    const [r, c] = unrevealedMines.splice(randomIndex, 1)[0];
                    this.flagged[r][c] = true;
                    this.minesLeft--;
                    this.updateCell(r, c);
                }
                
                this.updateMineCounter();
                
                // Give vague directional hint about safe zones
                this.giveSafeZoneHint(row, col);
                
                // Update result display to show bonus
                resultDisplay.textContent = `ALL ROUNDS COMPLETE! 💚\n+98 BOMBS REVEALED!`;
            }
        }
        
        setTimeout(() => {
            document.getElementById('qteOverlay').style.display = 'none';
            this.pendingBombCell = null;
        }, 1000);
    }
    
    giveSafeZoneHint(fromRow, fromCol) {
        // Find all unrevealed safe cells (non-bombs)
        const safeCells = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== -1 && !this.revealed[r][c]) {
                    safeCells.push({ row: r, col: c });
                }
            }
        }
        
        if (safeCells.length === 0) return;
        
        // Pick a random safe cell
        const targetSafe = safeCells[Math.floor(Math.random() * safeCells.length)];
        
        // Calculate very vague direction (quadrant-based)
        const rowDiff = targetSafe.row - fromRow;
        const colDiff = targetSafe.col - fromCol;
        
        let direction = '';
        let arrow = '';
        
        // Divide board into vague quadrants
        if (rowDiff < 0 && colDiff < 0) {
            direction = 'NORTHWEST';
            arrow = '↖️';
        } else if (rowDiff < 0 && colDiff > 0) {
            direction = 'NORTHEAST';
            arrow = '↗️';
        } else if (rowDiff > 0 && colDiff < 0) {
            direction = 'SOUTHWEST';
            arrow = '↙️';
        } else if (rowDiff > 0 && colDiff > 0) {
            direction = 'SOUTHEAST';
            arrow = '↘️';
        } else if (rowDiff === 0 && colDiff < 0) {
            direction = 'WEST';
            arrow = '⬅️';
        } else if (rowDiff === 0 && colDiff > 0) {
            direction = 'EAST';
            arrow = '➡️';
        } else if (rowDiff < 0 && colDiff === 0) {
            direction = 'NORTH';
            arrow = '⬆️';
        } else {
            direction = 'SOUTH';
            arrow = '⬇️';
        }
        
        // Show vague hint message
        const hintOverlay = document.createElement('div');
        hintOverlay.className = 'hint-overlay';
        hintOverlay.innerHTML = `
            <div class="hint-message">
                <div class="hint-title">💡 SAFE ZONE HINT</div>
                <div class="hint-direction">${arrow} ${direction}</div>
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Possible safe cells in this general direction</div>
            </div>
        `;
        document.body.appendChild(hintOverlay);
        
        setTimeout(() => {
            hintOverlay.remove();
        }, 2500);
    }
    
    failQTE() {
        this.qteActive = false;
        if (this.qteAnimationFrame) {
            cancelAnimationFrame(this.qteAnimationFrame);
        }
        
        // Reset key states
        this.qteLeftPressed = false;
        this.qteRightPressed = false;
        
        const resultDisplay = document.getElementById('qteResult');
        resultDisplay.textContent = 'FAILED! 💥';
        resultDisplay.style.color = '#FF0000';
        
        setTimeout(() => {
            document.getElementById('qteOverlay').style.display = 'none';
            
            // Explode the bomb
            if (this.pendingBombCell) {
                const { row, col } = this.pendingBombCell;
                this.revealed[row][col] = true;
                this.updateCell(row, col);
            }
            
            this.gameOver = true;
            this.updateResetButton('😵');
            this.revealAllMines();
            this.clearTimer();
            this.updateAbilityButtons();
            this.resetCombo();
            this.pendingBombCell = null;
        }, 1000);
    }
    
    startSequenceQTE() {
        // Generate random sequence of keys
        let sequenceLength;
        if (this.qteRound >= 10) {
            sequenceLength = 14;
        } else if (this.qteRound >= 5) {
            sequenceLength = 7;
        } else {
            sequenceLength = Math.min(3 + this.qteRound, 6); // Start at 4 keys, up to 6 keys
        }
        
        if (this.qteKeyMode === 'arrows') {
            const keys = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
            const keyDisplays = ['↑', '←', '↓', '→'];
            this.qteSequence = [];
            this.qteSequenceDisplay = [];
            for (let i = 0; i < sequenceLength; i++) {
                const randomIndex = Math.floor(Math.random() * 4);
                this.qteSequence.push(keys[randomIndex]);
                this.qteSequenceDisplay.push(keyDisplays[randomIndex]);
            }
        } else {
            const keys = ['w', 'a', 's', 'd'];
            const keyDisplays = ['W', 'A', 'S', 'D'];
            this.qteSequence = [];
            this.qteSequenceDisplay = [];
            for (let i = 0; i < sequenceLength; i++) {
                const randomIndex = Math.floor(Math.random() * 4);
                this.qteSequence.push(keys[randomIndex]);
                this.qteSequenceDisplay.push(keyDisplays[randomIndex]);
            }
        }
        
        this.qteSequenceIndex = 0; // Track current position in sequence
        this.qteSequenceStartTime = Date.now();
        
        // Time limit: 1 second per key + 1 second base, plus bonus time for higher rounds
        // Add 100ms per round completed (so round 5 gets +500ms, round 10 gets +1000ms, etc.)
        const roundBonus = (this.qteRound - 1) * 100;
        this.qteSequenceDuration = 1000 + (sequenceLength * 1000) + roundBonus;
        
        const overlay = document.getElementById('qteOverlay');
        const keyDisplay = document.getElementById('qteKeyDisplay');
        const resultDisplay = document.getElementById('qteResult');
        const timerFill = document.getElementById('qteTimerFill');
        const targetZone = document.querySelector('.qte-target-zone');
        const timerBar = document.querySelector('.qte-timer-bar');
        
        overlay.style.display = 'flex';
        overlay.dataset.qteType = 'sequence';
        
        // Hide the old key display box and timer bar components
        keyDisplay.style.display = 'none';
        timerFill.style.display = 'none';
        targetZone.style.display = 'none';
        
        // Create keys container inside the timer bar
        let keysContainer = document.getElementById('qteSequenceKeysContainer');
        if (!keysContainer) {
            keysContainer = document.createElement('div');
            keysContainer.id = 'qteSequenceKeysContainer';
            keysContainer.className = 'qte-sequence-keys-container';
            timerBar.appendChild(keysContainer);
        }
        
        keysContainer.innerHTML = this.qteSequenceDisplay.map((key, idx) => 
            `<span class="qte-sequence-key ${idx === 0 ? 'active' : ''}">${key}</span>`
        ).join('');
        keysContainer.style.display = 'flex';
        
        resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - SEQUENCE | Time: ${(this.qteSequenceDuration / 1000).toFixed(1)}s | Controls: ${this.qteKeyMode === 'arrows' ? '↑ ← ↓ →' : 'W / A / S / D'}`;
        resultDisplay.style.color = '#0054E3';
        
        // Hide all boxes
        const leftBox = document.getElementById('qteLeftBox');
        const rightBox = document.getElementById('qteRightBox');
        const cornerLeftBox = document.getElementById('qteCornerLeftBox');
        const cornerRightBox = document.getElementById('qteCornerRightBox');
        const extraBox1 = document.getElementById('qteExtraBox1');
        const extraBox2 = document.getElementById('qteExtraBox2');
        if (leftBox) leftBox.style.display = 'none';
        if (rightBox) rightBox.style.display = 'none';
        if (cornerLeftBox) cornerLeftBox.style.display = 'none';
        if (cornerRightBox) cornerRightBox.style.display = 'none';
        if (extraBox1) extraBox1.style.display = 'none';
        if (extraBox2) extraBox2.style.display = 'none';
        
        // Add CSS for sequence keys if not already present
        if (!document.getElementById('qte-sequence-styles')) {
            const style = document.createElement('style');
            style.id = 'qte-sequence-styles';
            style.textContent = `
                .qte-sequence-keys-container {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                    padding: 4px;
                    width: 100%;
                    height: 100%;
                }
                .qte-sequence-key {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 50px;
                    height: 32px;
                    padding: 4px 8px;
                    margin: 0;
                    background: #d4d0c8;
                    border: 2px solid #ffffff;
                    border-right-color: #808080;
                    border-bottom-color: #808080;
                    font-size: 20px;
                    font-weight: bold;
                    color: #808080;
                    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.8),
                                inset -1px -1px 0 rgba(0, 0, 0, 0.2);
                }
                .qte-sequence-key.active {
                    background: #0078d7;
                    color: #ffffff;
                    border-color: #0054e3;
                    box-shadow: 0 0 10px rgba(0, 120, 215, 0.6),
                                inset 1px 1px 0 rgba(255, 255, 255, 0.3);
                    animation: pulse 0.5s ease-in-out infinite;
                }
                .qte-sequence-key.completed {
                    background: #00aa00;
                    color: #ffffff;
                    border-color: #008800;
                    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.3);
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.animateSequenceQTE();
    }
    
    animateSequenceQTE() {
        if (!this.qteActive || this.qteType !== 'sequence') return;
        
        const elapsed = Date.now() - this.qteSequenceStartTime;
        const progress = Math.min(elapsed / this.qteSequenceDuration, 1);
        const timeRemaining = Math.max(0, (this.qteSequenceDuration - elapsed) / 1000).toFixed(1);
        
        // Update result display with time remaining
        const resultDisplay = document.getElementById('qteResult');
        resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - SEQUENCE | Time: ${timeRemaining}s | Controls: ${this.qteKeyMode === 'arrows' ? '↑ ← ↓ →' : 'W / A / S / D'}`;
        
        if (progress >= 1) {
            // Time ran out
            this.failQTE();
            return;
        }
        
        this.qteAnimationFrame = requestAnimationFrame(() => this.animateSequenceQTE());
    }
    
    handleSequenceKeyPress(key) {
        const normalizedKey = this.qteKeyMode === 'wasd' ? key.toLowerCase() : key;
        const expectedKey = this.qteSequence[this.qteSequenceIndex];
        
        if (normalizedKey === expectedKey) {
            // Correct key pressed
            this.qteSequenceIndex++;
            
            // Update visual feedback
            const keysContainer = document.getElementById('qteSequenceKeysContainer');
            const keyElements = keysContainer.querySelectorAll('.qte-sequence-key');
            keyElements[this.qteSequenceIndex - 1].classList.remove('active');
            keyElements[this.qteSequenceIndex - 1].classList.add('completed');
            
            if (this.qteSequenceIndex < this.qteSequence.length) {
                // More keys to press
                keyElements[this.qteSequenceIndex].classList.add('active');
            } else {
                // Sequence complete!
                if (this.qteRound < this.qteMaxRounds) {
                    // More rounds to go
                    this.qteRound++;
                    if (this.qteAnimationFrame) {
                        cancelAnimationFrame(this.qteAnimationFrame);
                    }
                    this.startQTERound();
                } else {
                    // All rounds completed
                    this.successQTE();
                }
            }
        } else {
            // Wrong key pressed - restart the sequence from the beginning
            this.qteSequenceIndex = 0;
            
            // Reset visual feedback - mark all keys as not completed
            const keysContainer = document.getElementById('qteSequenceKeysContainer');
            const keyElements = keysContainer.querySelectorAll('.qte-sequence-key');
            keyElements.forEach((element, idx) => {
                element.classList.remove('active');
                element.classList.remove('completed');
                if (idx === 0) {
                    element.classList.add('active');
                }
            });
            
            // Flash error message briefly
            const resultDisplay = document.getElementById('qteResult');
            const originalText = resultDisplay.textContent;
            resultDisplay.textContent = 'WRONG KEY! START OVER!';
            resultDisplay.style.color = '#FF0000';
            
            setTimeout(() => {
                const timeRemaining = Math.max(0, (this.qteSequenceDuration - (Date.now() - this.qteSequenceStartTime)) / 1000).toFixed(1);
                resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds} - SEQUENCE | Time: ${timeRemaining}s | Controls: ${this.qteKeyMode === 'arrows' ? '↑ ← ↓ →' : 'W / A / S / D'}`;
                resultDisplay.style.color = '#0054E3';
            }, 500);
        }
    }
    
    giveDirectionalHint(fromRow, fromCol) {
        // Find all unrevealed mines
        const unrevealedMines = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === -1 && !this.revealed[r][c] && !this.flagged[r][c]) {
                    unrevealedMines.push({ row: r, col: c });
                }
            }
        }
        
        if (unrevealedMines.length === 0) return;
        
        // Pick a random unrevealed mine
        const targetMine = unrevealedMines[Math.floor(Math.random() * unrevealedMines.length)];
        
        // Calculate direction
        const rowDiff = targetMine.row - fromRow;
        const colDiff = targetMine.col - fromCol;
        
        let direction = '';
        if (Math.abs(rowDiff) > Math.abs(colDiff)) {
            // More vertical than horizontal
            direction = rowDiff > 0 ? '⬇️ SOUTH' : '⬆️ NORTH';
        } else {
            // More horizontal than vertical
            direction = colDiff > 0 ? '➡️ EAST' : '⬅️ WEST';
        }
        
        // Show hint message
        const hintOverlay = document.createElement('div');
        hintOverlay.className = 'hint-overlay';
        hintOverlay.innerHTML = `
            <div class="hint-message">
                <div class="hint-title">💡 MINE HINT</div>
                <div class="hint-direction">${direction}</div>
            </div>
        `;
        document.body.appendChild(hintOverlay);
        
        setTimeout(() => {
            hintOverlay.remove();
        }, 2000);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Winesweeper();
});
