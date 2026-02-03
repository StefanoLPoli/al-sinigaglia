// game-tournament.js - Torneo a 5 partite

let gameDataset = [];
let currentGame = null;
let userAnswers = [];
let currentMatchIndex = 0;
const TOTAL_MATCHES = 5;

// Stato del gioco
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    RESULTS: 'results'
};

let gameState = GameState.START;

// Inizializzazione
async function initGame() {
    console.log('🎮 Inizializzazione torneo...');
    
    try {
        await loadGameData();
        setupEventListeners();
        showStartScreen();
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        setupFallbackGame();
    }
}

// Carica dati
async function loadGameData() {
    const response = await fetch('./assets/datasets/dataset.csv');
    const csvText = await response.text();
    gameDataset = parseCSV(csvText);
    
    // Filtra solo partite con Steppo o Guzzo
    gameDataset = gameDataset.filter(match => 
        match.Tifoso === 'Steppo' || match.Tifoso === 'Guzzo'
    );
    
    console.log(`🎲 ${gameDataset.length} partite disponibili per il torneo`);
    
    if (gameDataset.length < TOTAL_MATCHES) {
        throw new Error(`Servono almeno ${TOTAL_MATCHES} partite per il torneo`);
    }
}

// Parsing CSV (uguale a main.js)
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', startTournament);
    document.getElementById('steppo-btn').addEventListener('click', () => checkAnswer('Steppo'));
    document.getElementById('guzzo-btn').addEventListener('click', () => checkAnswer('Guzzo'));
    //document.getElementById('next-btn').addEventListener('click', nextMatch);
    document.getElementById('play-again-btn').addEventListener('click', restartTournament);
}

// Schermate
function showStartScreen() {
    gameState = GameState.START;
    document.getElementById('start-screen').style.display = 'block';
    document.getElementById('match-display').style.display = 'none';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
}

function showGameScreen() {
    gameState = GameState.PLAYING;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('match-display').style.display = 'block';
    document.getElementById('progress-container').style.display = 'block';
    document.getElementById('results-screen').style.display = 'none';
}

function showResultsScreen() {
    gameState = GameState.RESULTS;
    document.getElementById('match-display').style.display = 'none';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    
    displayResults();
}

// Inizia il torneo
function startTournament() {
    console.log('🚀 Inizio torneo!');
    
    // Reset variabili
    currentGame = {
        matches: [],
        score: 0
    };
    
    userAnswers = [];
    currentMatchIndex = 0;
    
    // Seleziona 5 partite casuali UNICHE
    const shuffled = [...gameDataset].sort(() => 0.5 - Math.random());
    currentGame.matches = shuffled.slice(0, TOTAL_MATCHES);
    
    console.log(`🎲 Partite selezionate:`, currentGame.matches.map(m => ({
        data: m.Date,
        risultato: `${m.FTHG}-${m.FTAG}`,
        tifoso: m.Tifoso
    })));
    
    showGameScreen();
    updateProgress();
    displayCurrentMatch();
}

// Mostra partita corrente
function displayCurrentMatch() {
    if (currentMatchIndex >= currentGame.matches.length) {
        endTournament();
        return;
    }
    
    const match = currentGame.matches[currentMatchIndex];
    
    // Aggiorna display
    document.getElementById('match-competition').textContent = match.Competizione || 'Partita';
    document.getElementById('match-date').textContent = match.Date || '';
    document.getElementById('match-location').textContent = match.Location || '';
    document.getElementById('match-time').textContent = match.Time || '';
    
    const isComoHome = match.HomeTeam === 'Como';
    const opponent = isComoHome ? match.AwayTeam : match.HomeTeam;
    const comoGoals = isComoHome ? match.FTHG : match.FTAG;
    const oppGoals = isComoHome ? match.FTAG : match.FTHG;
    
    document.getElementById('como-score').textContent = comoGoals;
    document.getElementById('opponent-score').textContent = oppGoals;
    document.getElementById('opponent-name').textContent = opponent;
    
    // Statistiche
    const shots = `${match.HS || '?'} (${match.HST || '?'} in porta)`;
    document.getElementById('match-shots').textContent = shots;
    
    // Reset UI per nuova partita
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none'; // Nascondi sempre
    enableButtons(true);
    
    // Aggiorna progresso
    updateProgress();
}

// Controlla risposta
function checkAnswer(player) {
    if (gameState !== GameState.PLAYING) return;
    
    const match = currentGame.matches[currentMatchIndex];
    const correct = match.Tifoso === player;
    const feedback = document.getElementById('feedback');
    
    // Salva risposta utente
    userAnswers.push({
        match: match,
        userGuess: player,
        correct: correct,
        matchIndex: currentMatchIndex
    });
    
    // Aggiorna punteggio
    if (correct) {
        currentGame.score++;
        feedback.textContent = `✅ CORRETTO! C'era ${player}!`;
        feedback.className = 'feedback correct';
        
        // Animazione extra per risposta corretta
        feedback.style.animation = 'pulse 0.5s ease-in-out';
    } else {
        feedback.textContent = `❌ SBAGLIATO! C'era ${match.Tifoso}...`;
        feedback.className = 'feedback wrong';
        
        // Animazione shake per risposta sbagliata
        feedback.style.animation = 'shake 0.5s ease-in-out';
    }
    
    feedback.style.display = 'block';
    updateScore();
    
    // Disabilita pulsanti
    enableButtons(false);
    
    // Animazione punteggio
    document.getElementById('quiz-score').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('quiz-score').classList.remove('pulse');
    }, 500);
    
    // AUTO-AVANZA dopo 1.5 secondi
    setTimeout(() => {
        currentMatchIndex++;
        
        if (currentMatchIndex < TOTAL_MATCHES) {
            displayCurrentMatch();
        } else {
            endTournament();
        }
    }, 1500); // 1.5 secondi
}

// Prossima partita
function nextMatch() {
    currentMatchIndex++;
    
    if (currentMatchIndex < TOTAL_MATCHES) {
        displayCurrentMatch();
    } else {
        endTournament();
    }
}

// Fine torneo
function endTournament() {
    console.log('🏁 Torneo completato! Punteggio:', currentGame.score);
    showResultsScreen();
}

// Mostra risultati
function displayResults() {
    const finalScore = currentGame.score;
    const totalMatches = TOTAL_MATCHES;
    
    // Punteggio finale
    document.getElementById('final-score').textContent = `${finalScore}/${totalMatches}`;
    
    // Messaggio in base al punteggio
    let message = '';
    if (finalScore === totalMatches) {
        message = '🎯 PERFEZIONE! Sei un vero esperto!';
    } else if (finalScore >= totalMatches * 0.8) {
        message = '👏 ECCELLENTE! Conosci bene le statistiche!';
    } else if (finalScore >= totalMatches * 0.6) {
        message = '👍 BUONO! Hai un buon intuito!';
    } else if (finalScore >= totalMatches * 0.4) {
        message = '😐 DISCRETO! Puoi fare meglio!';
    } else {
        message = '😅 PUÒ ANDARE MEGLIO! Prova ancora!';
    }
    
    document.getElementById('score-message').textContent = message;
    
    // Dettaglio partite
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
    
    userAnswers.forEach((answer, index) => {
        const match = answer.match;
        const isComoHome = match.HomeTeam === 'Como';
        const comoGoals = isComoHome ? match.FTHG : match.FTAG;
        const oppGoals = isComoHome ? match.FTAG : match.FTHG;
        const opponent = isComoHome ? match.AwayTeam : match.HomeTeam;
        
        const resultDiv = document.createElement('div');
        resultDiv.className = `match-result ${answer.correct ? 'correct' : 'wrong'}`;
        
        resultDiv.innerHTML = `
            <div class="match-summary">
                <div><strong>${match.Date}</strong> - Como ${comoGoals}-${oppGoals} ${opponent}</div>
                <div style="font-size: 0.9rem; color: #666;">
                    Tu: ${answer.userGuess} | Reale: ${match.Tifoso}
                </div>
            </div>
            <div class="match-verdict ${answer.correct ? 'correct' : 'wrong'}">
                ${answer.correct ? '✅ Giusto' : '❌ Sbagliato'}
            </div>
        `;
        
        resultsList.appendChild(resultDiv);
    });
}

// Aggiorna progresso
function updateProgress() {
    document.getElementById('current-match').textContent = currentMatchIndex + 1;
    document.getElementById('progress-fill').style.width = `${((currentMatchIndex + 1) / TOTAL_MATCHES) * 100}%`;
    updateScore();
}

function updateScore() {
    document.getElementById('quiz-score').textContent = `Punteggio: ${currentGame.score}/${TOTAL_MATCHES}`;
}

// Abilita/disabilita pulsanti
function enableButtons(enabled) {
    document.getElementById('steppo-btn').disabled = !enabled;
    document.getElementById('guzzo-btn').disabled = !enabled;
}

// Riavvia torneo
function restartTournament() {
    startTournament();
}

// Fallback se ci sono problemi
function setupFallbackGame() {
    console.log('⚠️  Setup fallback game');
    
    // Dati di esempio
    gameDataset = [
        {
            "Competizione": "Serie A",
            "Date": "24/08/2025",
            "HomeTeam": "Como",
            "AwayTeam": "Lazio",
            "Tifoso": "Steppo",
            "FTHG": "2",
            "FTAG": "0",
            "FTR": "H",
            "Location": "Giuseppe Sinigaglia",
            "Time": "17:30",
            "HS": "19",
            "HST": "6"
        },
        {
            "Competizione": "Coppa Italia",
            "Date": "16/08/2025",
            "HomeTeam": "Como",
            "AwayTeam": "Sudtirol",
            "Tifoso": "Guzzo",
            "FTHG": "3",
            "FTAG": "1",
            "FTR": "H",
            "Location": "Giuseppe Sinigaglia",
            "Time": "18:30",
            "HS": "16",
            "HST": "9"
        }
    ];
    
    setupEventListeners();
    showStartScreen();
}

// Inizializza quando la pagina è pronta
document.addEventListener('DOMContentLoaded', initGame);

// Funzioni di debug
window.debugGame = {
    showMatches: () => {
        console.log('🎲 Partite correnti:', currentGame?.matches);
        console.log('📊 Risposte utente:', userAnswers);
        console.log('🏆 Punteggio:', currentGame?.score || 0);
    },
    
    forceWin: () => {
        if (currentGame && currentGame.matches.length > 0) {
            const match = currentGame.matches[currentMatchIndex];
            checkAnswer(match.Tifoso);
        }
    },
    
    skipToResults: () => {
        while (currentMatchIndex < TOTAL_MATCHES) {
            const match = currentGame.matches[currentMatchIndex];
            userAnswers.push({
                match: match,
                userGuess: Math.random() > 0.5 ? 'Steppo' : 'Guzzo',
                correct: Math.random() > 0.5,
                matchIndex: currentMatchIndex
            });
            currentMatchIndex++;
        }
        endTournament();
    }
};