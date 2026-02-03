// game.js - Logica specifica per il gioco

let gameDataset = [];
let quizScore = 0;
let currentQuizMatch = null;

async function initGame() {
    console.log('🎮 Inizializzazione gioco...');
    
    try {
        await loadGameData();
        setupEventListeners();
        nextQuestion();
        updateScoreDisplay();
    } catch (error) {
        console.error('❌ Errore inizializzazione gioco:', error);
        setupSimpleGame();
    }
}

async function loadGameData() {
    const response = await fetch('../assets/datasets/dataset.csv');
    const csvText = await response.text();
    gameDataset = parseCSV(csvText);
    console.log(`🎲 ${gameDataset.length} partite caricate per il gioco`);
}

function setupEventListeners() {
    document.getElementById('steppo-btn').addEventListener('click', () => checkAnswer('Steppo'));
    document.getElementById('guzzo-btn').addEventListener('click', () => checkAnswer('Guzzo'));
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
}

function nextQuestion() {
    // Filtra partite con Steppo o Guzzo
    const validMatches = gameDataset.filter(match => 
        match.Tifoso === 'Steppo' || match.Tifoso === 'Guzzo'
    );
    
    if (validMatches.length === 0) {
        showError('Nessuna partita disponibile');
        return;
    }
    
    currentQuizMatch = validMatches[Math.floor(Math.random() * validMatches.length)];
    updateMatchDisplay();
    
    // Reset UI
    document.getElementById('feedback').style.display = 'none';
    enableButtons(true);
}

function checkAnswer(player) {
    if (!currentQuizMatch) return;
    
    const correct = currentQuizMatch.Tifoso === player;
    const feedback = document.getElementById('feedback');
    
    if (correct) {
        quizScore++;
        feedback.textContent = `✅ ESATTO! C'era ${player}!`;
        feedback.className = 'feedback correct';
    } else {
        feedback.textContent = `❌ SBAGLIATO! C'era ${currentQuizMatch.Tifoso}...`;
        feedback.className = 'feedback wrong';
    }
    
    feedback.style.display = 'block';
    updateScoreDisplay();
    enableButtons(false);
    
    // Salva punteggio nel localStorage
    localStorage.setItem('al-sinigaglia-score', quizScore.toString());
}

function updateMatchDisplay() {
    if (!currentQuizMatch) return;
    
    const isComoHome = currentQuizMatch.HomeTeam === 'Como';
    const opponent = isComoHome ? currentQuizMatch.AwayTeam : currentQuizMatch.HomeTeam;
    const comoGoals = isComoHome ? currentQuizMatch.FTHG : currentQuizMatch.FTAG;
    const oppGoals = isComoHome ? currentQuizMatch.FTAG : currentQuizMatch.FTHG;
    
    // Aggiorna display
    document.getElementById('como-score').textContent = comoGoals;
    document.getElementById('opponent-score').textContent = oppGoals;
    document.getElementById('opponent-name').textContent = opponent;
    
    // Dettagli
    const details = `
        <div><strong>${currentQuizMatch.Competizione}</strong></div>
        <div>${currentQuizMatch.Date} • ${currentQuizMatch.Time}</div>
        <div>📍 ${currentQuizMatch.Location}</div>
        <div>📊 ${currentQuizMatch.HS} tiri (${currentQuizMatch.HST} in porta)</div>
    `;
    document.getElementById('match-details').innerHTML = details;
    
    document.getElementById('match-date').textContent = currentQuizMatch.Date;
}

function enableButtons(enabled) {
    document.getElementById('steppo-btn').disabled = !enabled;
    document.getElementById('guzzo-btn').disabled = !enabled;
}

function updateScoreDisplay() {
    document.getElementById('quiz-score').textContent = `Punteggio: ${quizScore}`;
}

function resetGame() {
    quizScore = 0;
    updateScoreDisplay();
    nextQuestion();
}

function showError(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `⚠️ ${message}`;
    feedback.className = 'feedback wrong';
    feedback.style.display = 'block';
}

// Helper functions (potrebbero essere importate da main.js)
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });
}