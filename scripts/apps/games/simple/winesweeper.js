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
        this.qteKey = '';
        this.qteStartTime = 0;
        this.qteDuration = 1500; // 1.5 seconds to complete QTE
        this.qteAnimationFrame = null;
        this.pendingBombCell = null;
        this.qteRound = 0;
        this.qteMaxRounds = 5;
        this.qteTargetPosition = 0.5; // Will be randomized each round
        
        this.initGame();
        this.setupEventListeners();
    }
    
    initGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.clearTimer();
        
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
        
        // QTE key listener
        document.addEventListener('keydown', (e) => {
            if (this.qteActive) {
                this.handleQTEKeyPress(e.key);
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
        
        // Set rounds based on difficulty
        if (this.currentDifficulty === 'impossible') {
            this.qteMaxRounds = 25;
        } else {
            this.qteMaxRounds = 5;
        }
        
        this.qteRound = 1;
        this.startQTERound();
    }
    
    startQTERound() {
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
            // Rounds 1-5: Very slow progression (2000-1800ms)
            // Rounds 6-15: Moderate acceleration (1800-1200ms)
            // Rounds 16-25: Rapid acceleration (1200-1000ms) with 1000ms cap
            const roundProgress = (this.qteRound - 1) / (this.qteMaxRounds - 1);
            const exponentialProgress = Math.pow(roundProgress, 2.5); // Exponential curve
            const baseSpeed = 2000 - (exponentialProgress * 1300); // Changed from 1400 to 1300 (2000-700)
            // Add distance variance (±200ms)
            const calculatedSpeed = baseSpeed + (distanceFromCenter * 2 * 200);
            // Cap at 1000ms minimum for rounds 16-25
            this.qteDuration = this.qteRound >= 16 ? Math.max(1000, calculatedSpeed) : calculatedSpeed;
        } else {
            // Normal mode: Speed ranges from 1000ms (close) to 1700ms (far)
            this.qteDuration = 1000 + (distanceFromCenter * 2 * 700);
        }
        
        const overlay = document.getElementById('qteOverlay');
        const keyDisplay = document.getElementById('qteKeyDisplay');
        const resultDisplay = document.getElementById('qteResult');
        const timerFill = document.getElementById('qteTimerFill');
        const targetZone = document.querySelector('.qte-target-zone');
        
        overlay.style.display = 'flex';
        keyDisplay.textContent = this.qteKeyDisplay;
        resultDisplay.textContent = `Round ${this.qteRound}/${this.qteMaxRounds}`;
        resultDisplay.style.color = '#0054E3';
        timerFill.style.width = '0%';
        
        // Position the target zone (center it on the target position)
        // Target zone is 20% wide, so subtract 10% to center it
        targetZone.style.left = (this.qteTargetPosition * 100 - 10) + '%';
        
        this.animateQTE();
    }
    
    animateQTE() {
        if (!this.qteActive) return;
        
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
    
    handleQTEKeyPress(key) {
        const normalizedKey = this.qteKeyMode === 'wasd' ? key.toLowerCase() : key;
        if (!this.qteActive || normalizedKey !== this.qteKey) return;
        
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
    
    successQTE() {
        this.qteActive = false;
        if (this.qteAnimationFrame) {
            cancelAnimationFrame(this.qteAnimationFrame);
        }
        
        const resultDisplay = document.getElementById('qteResult');
        resultDisplay.textContent = 'ALL ROUNDS COMPLETE! 💚';
        resultDisplay.style.color = '#00FF00';
        
        // Flag the bomb
        if (this.pendingBombCell) {
            const { row, col } = this.pendingBombCell;
            this.flagged[row][col] = true;
            this.minesLeft--;
            this.updateCell(row, col);
            this.updateMineCounter();
            
            // In impossible mode, reveal 60 random bombs and give vague safe zone hint
            if (this.currentDifficulty === 'impossible') {
                const unrevealedMines = [];
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        if (this.board[r][c] === -1 && !this.revealed[r][c] && !this.flagged[r][c]) {
                            unrevealedMines.push([r, c]);
                        }
                    }
                }
                
                const toReveal = Math.min(60, unrevealedMines.length);
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
                resultDisplay.textContent = `ALL ROUNDS COMPLETE! 💚\n+60 BOMBS REVEALED!`;
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
