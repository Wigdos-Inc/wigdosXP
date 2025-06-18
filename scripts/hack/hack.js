// script.js

// Keep track of game state
let overlayActive = false;  // Is the hacking overlay currently active?
let timerInterval = null;   // Reference to the countdown timer
let timeLeft = 15;          // Countdown timer (seconds)
let currency = 0;           // User currency (defaults to 0)
let currentGame = null;     // Reference to current mini-game

// Update the currency display element
function updateCurrencyDisplay() {
    document.getElementById('currency-display').innerText = 'Currency: ' + currency;
}

// Show the hacking overlay and start a random mini-game
function triggerHack() {
    if (overlayActive) return;  // Already active
    overlayActive = true;

    // Show overlay div
    const overlay = document.getElementById('hacking-overlay');
    overlay.style.display = 'block';

    // Reset and display timer
    timeLeft = 15;
    document.getElementById('timer').innerText = timeLeft;
    // Start countdown: decrease timeLeft every second (using setInterval):contentReference[oaicite:4]{index=4}
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            failGame();
        } else {
            document.getElementById('timer').innerText = timeLeft;
        }
    }, 1000);  // 1000ms = 1 second

    // Pick and start one of the mini-games at random
    pickRandomGame();
}

// Hide the overlay and stop the timer
function endHack() {
    overlayActive = false;
    clearInterval(timerInterval);
    document.getElementById('hacking-overlay').style.display = 'none';
    // Clear game content
    document.getElementById('game-container').innerHTML = '';
}

// Called when the player successfully completes a mini-game
function winGame() {
    currency += 34;
    updateCurrencyDisplay();
    clearInterval(timerInterval);
    overlayActive = false;
    // (Optional: play win sound here)
    endHack();
}

// Called when the player fails a mini-game or runs out of time
function failGame() {
    // Deduct currency on failure
    currency -= 17;
    updateCurrencyDisplay();
    clearInterval(timerInterval);
    overlayActive = false;
    // (Optional: play fail sound here)
    endHack();
}

// Choose a random mini-game and start it
function pickRandomGame() {
    const games = [symbolMatchingGame, typingGame, patternGame, reflexGame];
    const game = games[Math.floor(Math.random() * games.length)];
    currentGame = game;
    game();
}

/* 1) Symbol Matching: match pairs of symbols */
function symbolMatchingGame() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '';  // Clear previous content

    // Define a set of possible symbols
    const symbols = ['★','▲','❤','⚙','◆','✿','✈','♬'];
    // Pick 4 random unique symbols
    const chosen = [];
    while (chosen.length < 4) {
        const s = symbols[Math.floor(Math.random() * symbols.length)];
        if (!chosen.includes(s)) chosen.push(s);
    }
    // Create pairs and shuffle them
    let cards = chosen.concat(chosen);
    cards.sort(() => 0.5 - Math.random());

    let firstCard = null;
    let matchedCount = 0;

    // Create card elements
    cards.forEach(symbol => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.symbol = symbol;
        card.innerText = '';
        gameContainer.appendChild(card);

        // Click handler to reveal cards
        card.addEventListener('click', () => {
            // Ignore if already revealed/matched or same card
            if (card.classList.contains('revealed') || card.classList.contains('matched') || firstCard === card) {
                return;
            }
            // Reveal this card
            card.classList.add('revealed');
            card.innerText = symbol;
            if (!firstCard) {
                // This is the first card flipped
                firstCard = card;
            } else {
                // This is the second card flipped
                if (firstCard.dataset.symbol === card.dataset.symbol) {
                    // Match found
                    firstCard.classList.add('matched');
                    card.classList.add('matched');
                    matchedCount += 2;
                    firstCard = null;
                    // Win if all pairs matched
                    if (matchedCount === cards.length) {
                        winGame();
                    }
                } else {
                    // Not a match: hide both after a short delay
                    setTimeout(() => {
                        firstCard.classList.remove('revealed');
                        firstCard.innerText = '';
                        card.classList.remove('revealed');
                        card.innerText = '';
                        firstCard = null;
                    }, 500);
                }
            }
        });
    });
}

/* 2) Typing Challenge: type a random sequence quickly */
function typingGame() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '';

    // Generate a random 6-character alphanumeric sequence
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sequence = '';
    for (let i = 0; i < 6; i++) {
        sequence += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Display the sequence
    const seqElem = document.createElement('div');
    seqElem.id = 'typing-sequence';
    seqElem.innerText = sequence;
    gameContainer.appendChild(seqElem);

    // Create an input box for the player to type
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'typing-input';
    gameContainer.appendChild(input);
    input.focus();

    // Check input on each keystroke
    input.addEventListener('input', () => {
        if (input.value.toUpperCase() === sequence) {
            winGame();
        }
    });
}

/* 3) Pattern Recognition: identify the next symbol in a pattern */
function patternGame() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '';

    // Define some simple patterns
    const patterns = [
        { given: ['●','■','●','■'], answer: '●', options: ['●','■'] },
        { given: ['▲','△','▲','△'], answer: '▲', options: ['▲','△'] },
        { given: ['◆','☆','◆','☆'], answer: '◆', options: ['◆','☆'] },
        { given: ['★','♡','★','♡'], answer: '★', options: ['★','♡'] }
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    // Show the given sequence with a question mark
    const patElem = document.createElement('div');
    patElem.id = 'pattern-sequence';
    patElem.innerText = pattern.given.join(' ') + ' ?';
    gameContainer.appendChild(patElem);

    // Create option buttons
    pattern.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'pattern-option';
        btn.innerText = opt;
        gameContainer.appendChild(btn);
        btn.addEventListener('click', () => {
            if (opt === pattern.answer) {
                winGame();
            } else {
                failGame();
            }
        });
    });
}

/* 4) Reflex Clicking: click a button as soon as it appears */
function reflexGame() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '';

    // Instruction text
    const instruction = document.createElement('div');
    instruction.id = 'reflex-instruction';
    instruction.innerText = 'Wait for GO...';
    gameContainer.appendChild(instruction);

    // Hidden button that will appear
    const button = document.createElement('button');
    button.id = 'reflex-button';
    button.innerText = 'CLICK';
    button.style.display = 'none';
    gameContainer.appendChild(button);

    let clickedTooEarly = false;
    let goShown = false;

    // If the player clicks anywhere before "GO", they fail
    function earlyClick(e) {
        if (!goShown && e.target.id !== 'reflex-button') {
            clickedTooEarly = true;
            document.getElementById('hacking-overlay').removeEventListener('click', earlyClick);
            failGame();
        }
    }
    document.getElementById('hacking-overlay').addEventListener('click', earlyClick);

    // After a random delay (1–5 sec), show the "GO" prompt and button
    const delay = Math.random() * 4000 + 1000;
    setTimeout(() => {
        goShown = true;
        instruction.innerText = 'CLICK!';
        button.style.display = 'inline-block';
    }, delay);

    // Clicking the button after "GO" is a win
    button.addEventListener('click', () => {
        if (!clickedTooEarly && goShown) {
            document.getElementById('hacking-overlay').removeEventListener('click', earlyClick);
            winGame();
        }
    });
}

// Initialize: set up the click handler for random trigger and manual button
document.addEventListener('DOMContentLoaded', () => {
    updateCurrencyDisplay();

    // Global click listener: ~1/1000 chance to trigger hacking overlay:contentReference[oaicite:5]{index=5}
    document.addEventListener('click', (e) => {
        // Ignore clicks when overlay is active or on the manual trigger button
        if (overlayActive || e.target.id === 'manual-trigger') return;
        if (Math.random() < 0.001) {  // ~1-in-1000 chance
            triggerHack();
        }
    });

    // Manual override button triggers hack immediately
    document.getElementById('manual-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHack();
    });
});
