// script.js

// VARIABILI GLOBALI
let dataset = [];
let quizScore = 0;
let currentQuizMatch = null;
let steppoStats = null;
let guzzoStats = null;

// 1. INIZIALIZZAZIONE
async function initSite() {
    console.log('🚀 Inizializzazione sito...');
    
    try {
        // Carica il dataset CSV
        await loadDataset();
        
        // Calcola le statistiche
        calculateAllStats();
        
        // Aggiorna la dashboard
        updateDashboard();
        
        // Inizializza il quiz
        initQuiz();
        
        // Aggiorna la data nel footer
        updateFooterDate();
        
        console.log('✅ Sito inizializzato con successo!');
        console.log(`📊 Partite caricate: ${dataset.length}`);
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        showError('Impossibile caricare i dati. Controlla il file CSV.');
    }
}

// 2. CARICAMENTO DATASET CSV
async function loadDataset() {
    try {
        // Prova diversi percorsi per il CSV
        const paths = [
            'assets/dataset/dataset.csv',
            './assets/dataset/dataset.csv',
            'dataset/dataset.csv',
            '../assets/dataset/dataset.csv'
        ];
        
        let csvText = '';
        let lastError = null;
        
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                csvText = await response.text();
                console.log(`✅ CSV caricato da: ${path}`);
                break;
            } catch (error) {
                lastError = error;
                console.log(`❌ Fallito caricamento da ${path}: ${error.message}`);
            }
        }
        
        if (!csvText) {
            throw new Error(`Impossibile caricare il CSV. Ultimo errore: ${lastError?.message}`);
        }
        
        // Parsing del CSV
        dataset = parseCSV(csvText);
        
        // Validazione base
        if (dataset.length === 0) {
            throw new Error('Il CSV è vuoto o non contiene dati validi');
        }
        
        console.log(`✅ Dataset caricato: ${dataset.length} partite`);
        
    } catch (error) {
        console.error('❌ Errore nel caricamento del dataset:', error);
        
        // Dataset di esempio per testing
        dataset = getExampleData();
        console.log('⚠️  Usando dati di esempio per testing');
    }
}

// 3. PARSING CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        console.warn('CSV ha meno di 2 righe');
        return [];
    }
    
    // Determina il separatore (; o ,)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(separator).map(h => h.trim());
    
    console.log(`📋 Intestazioni CSV: ${headers.join(', ')}`);
    
    const parsedData = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(separator).map(v => v.trim());
        
        // Crea oggetto partita
        const match = {};
        headers.forEach((header, index) => {
            match[header] = values[index] || '';
        });
        
        // Validazione base
        if (match.Date && match.HomeTeam) {
            parsedData.push(match);
        }
    }
    
    return parsedData;
}

// 4. CALCOLO STATISTICHE
function calculateAllStats() {
    console.log('📊 Calcolo statistiche...');
    
    steppoStats = calculatePersonStats('Steppo');
    guzzoStats = calculatePersonStats('Guzzo');
    
    console.log('✅ Statistiche calcolate:');
    console.log(`   Steppo: ${steppoStats.total} partite, ${steppoStats.wins} vittorie`);
    console.log(`   Guzzo: ${guzzoStats.total} partite, ${guzzoStats.wins} vittorie`);
}

function calculatePersonStats(person) {
    const matches = dataset.filter(match => 
        match.Tifoso && match.Tifoso.trim() === person
    );
    
    if (matches.length === 0) {
        return {
            total: 0,
            wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            points: 0, avgPoints: 0,
            winRate: 0
        };
    }
    
    const stats = {
        total: matches.length,
        wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0,
        matches: matches
    };
    
    matches.forEach(match => {
        // Determina se il Como gioca in casa
        const isComoHome = match.HomeTeam === 'Como';
        
        // Controlla il risultato (FTR: H=Home, A=Away, D=Draw)
        if (match.FTR === 'D') {
            stats.draws++;
        } else if ((match.FTR === 'H' && isComoHome) || (match.FTR === 'A' && !isComoHome)) {
            stats.wins++;
        } else {
            stats.losses++;
        }
        
        // Calcola goal fatti e subiti
        if (isComoHome) {
            stats.goalsFor += parseInt(match.FTHG) || 0;
            stats.goalsAgainst += parseInt(match.FTAG) || 0;
        } else {
            stats.goalsFor += parseInt(match.FTAG) || 0;
            stats.goalsAgainst += parseInt(match.FTHG) || 0;
        }
    });
    
    // Calcoli derivati
    stats.points = (stats.wins * 3) + stats.draws;
    stats.avgPoints = stats.total > 0 ? (stats.points / stats.total).toFixed(2) : "0.00";
    stats.winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : "0.0";
    
    // Aggiungi statistiche avanzate dal CSV
    stats.avgShots = matches.reduce((sum, m) => {
        const isComoHome = m.HomeTeam === 'Como';
        return sum + (parseInt(isComoHome ? m.HS : m.AS) || 0);
    }, 0) / matches.length;
    
    stats.avgShotsOnTarget = matches.reduce((sum, m) => {
        const isComoHome = m.HomeTeam === 'Como';
        return sum + (parseInt(isComoHome ? m.HST : m.AST) || 0);
    }, 0) / matches.length;
    
    return stats;
}

// 5. AGGIORNAMENTO DASHBOARD
function updateDashboard() {
    console.log('🔄 Aggiornamento dashboard...');
    
    // Aggiorna statistiche Steppo
    if (steppoStats) {
        updateStatsElement('steppo-total', steppoStats.total);
        updateStatsElement('steppo-wins', steppoStats.wins);
        updateStatsElement('steppo-draws', steppoStats.draws);
        updateStatsElement('steppo-losses', steppoStats.losses);
        updateStatsElement('steppo-goals-for', steppoStats.goalsFor);
        updateStatsElement('steppo-goals-against', steppoStats.goalsAgainst);
        updateStatsElement('steppo-win-rate', `${steppoStats.winRate}%`);
        updateStatsElement('steppo-ppg', steppoStats.avgPoints);
    }
    
    // Aggiorna statistiche Guzzo
    if (guzzoStats) {
        updateStatsElement('guzzo-total', guzzoStats.total);
        updateStatsElement('guzzo-wins', guzzoStats.wins);
        updateStatsElement('guzzo-draws', guzzoStats.draws);
        updateStatsElement('guzzo-losses', guzzoStats.losses);
        updateStatsElement('guzzo-goals-for', guzzoStats.goalsFor);
        updateStatsElement('guzzo-goals-against', guzzoStats.goalsAgainst);
        updateStatsElement('guzzo-win-rate', `${guzzoStats.winRate}%`);
        updateStatsElement('guzzo-ppg', guzzoStats.avgPoints);
    }
    
    // Calcola e mostra la differenza
    showComparison();
}

function updateStatsElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showComparison() {
    if (!steppoStats || !guzzoStats || steppoStats.total === 0 || guzzoStats.total === 0) {
        return;
    }
    
    const comparisonDiv = document.getElementById('comparison-text');
    if (!comparisonDiv) return;
    
    const diffWins = steppoStats.wins - guzzoStats.wins;
    const diffPoints = parseFloat(steppoStats.avgPoints) - parseFloat(guzzoStats.avgPoints);
    
    let message = '';
    
    if (diffWins > 0) {
        message = `Steppo ha ${diffWins} vittorie in più di Guzzo! 🏆`;
    } else if (diffWins < 0) {
        message = `Guzzo ha ${Math.abs(diffWins)} vittorie in più di Steppo! 😅`;
    } else {
        message = `Steppo e Guzzo hanno lo stesso numero di vittorie! ⚖️`;
    }
    
    if (Math.abs(diffPoints) > 0.1) {
        message += `<br>Differenza punti/partita: ${diffPoints.toFixed(2)}`;
    }
    
    comparisonDiv.innerHTML = message;
}

// 6. QUIZ FUNCTIONS
function initQuiz() {
    console.log('🎮 Inizializzazione quiz...');
    quizScore = 0;
    updateQuizScore();
    nextQuiz();
}

function nextQuiz() {
    // Nascondi feedback precedente
    hideFeedback();
    
    // Filtra partite dove Steppo o Guzzo erano presenti
    const matchesWithSomeone = dataset.filter(match => 
        match.Tifoso && (match.Tifoso === 'Steppo' || match.Tifoso === 'Guzzo')
    );
    
    if (matchesWithSomeone.length === 0) {
        showQuizError('Nessuna partita disponibile per il quiz.');
        return;
    }
    
    // Scegli partita casuale
    const randomIndex = Math.floor(Math.random() * matchesWithSomeone.length);
    currentQuizMatch = matchesWithSomeone[randomIndex];
    
    // Aggiorna l'interfaccia del quiz
    updateQuizInterface();
}

function updateQuizInterface() {
    if (!currentQuizMatch) return;
    
    const detailsDiv = document.getElementById('quiz-match-details');
    if (!detailsDiv) return;
    
    const isComoHome = currentQuizMatch.HomeTeam === 'Como';
    const opponent = isComoHome ? currentQuizMatch.AwayTeam : currentQuizMatch.HomeTeam;
    const comoGoals = isComoHome ? currentQuizMatch.FTHG : currentQuizMatch.FTAG;
    const opponentGoals = isComoHome ? currentQuizMatch.FTAG : currentQuizMatch.FTHG;
    
    // Determina risultato
    let resultEmoji, resultClass;
    if (currentQuizMatch.FTR === 'D') {
        resultEmoji = '⚽';
        resultClass = 'draw';
    } else if ((currentQuizMatch.FTR === 'H' && isComoHome) || (currentQuizMatch.FTR === 'A' && !isComoHome)) {
        resultEmoji = '✅';
        resultClass = 'win';
    } else {
        resultEmoji = '❌';
        resultClass = 'loss';
    }
    
    // Crea HTML dettagliato
    detailsDiv.innerHTML = `
        <div class="match-header">
            <span class="competition">${currentQuizMatch.Competizione || 'Partita'}</span>
            <span class="match-date">${formatDate(currentQuizMatch.Date)}</span>
        </div>
        <div class="teams ${resultClass}">
            <div class="team como">
                <span class="team-name">COMO</span>
                <span class="team-goals">${comoGoals}</span>
            </div>
            <div class="vs">-</div>
            <div class="team opponent">
                <span class="team-goals">${opponentGoals}</span>
                <span class="team-name">${opponent.toUpperCase()}</span>
            </div>
        </div>
        <div class="match-stats">
            <div class="stat-item">
                <span class="stat-label">Luogo:</span>
                <span class="stat-value">${currentQuizMatch.Location || 'Sconosciuto'}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tiri Como:</span>
                <span class="stat-value">${currentQuizMatch.HS || '?'} (${currentQuizMatch.HST || '?'} in porta)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Risultato:</span>
                <span class="stat-value ${resultClass}">${resultEmoji} ${comoGoals}-${opponentGoals}</span>
            </div>
        </div>
    `;
}

function guess(player) {
    if (!currentQuizMatch) {
        showFeedback('Seleziona prima una partita!', 'error');
        return;
    }
    
    const correct = currentQuizMatch.Tifoso === player;
    const feedbackDiv = document.getElementById('quiz-feedback');
    
    if (correct) {
        quizScore++;
        showFeedback(`✅ CORRETTO! C'era proprio ${player}!`, 'correct');
        
        // Animazione punteggio
        animateScore();
    } else {
        showFeedback(`❌ SBAGLIATO! In realtà c'era ${currentQuizMatch.Tifoso}...`, 'wrong');
    }
    
    updateQuizScore();
    
    // Disabilita i pulsanti per 1.5 secondi
    disableQuizButtons(true);
    setTimeout(() => {
        disableQuizButtons(false);
        nextQuiz();
    }, 1500);
}

function updateQuizScore() {
    const scoreElement = document.getElementById('quiz-score');
    if (scoreElement) {
        scoreElement.textContent = `Punteggio: ${quizScore}`;
    }
}

function animateScore() {
    const scoreElement = document.getElementById('quiz-score');
    if (scoreElement) {
        scoreElement.classList.add('score-animate');
        setTimeout(() => {
            scoreElement.classList.remove('score-animate');
        }, 500);
    }
}

function showFeedback(message, type) {
    const feedbackDiv = document.getElementById('quiz-feedback');
    if (!feedbackDiv) return;
    
    feedbackDiv.innerHTML = message;
    feedbackDiv.className = `quiz-feedback ${type}`;
    feedbackDiv.style.display = 'block';
    
    // Scrolla verso il feedback
    feedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideFeedback() {
    const feedbackDiv = document.getElementById('quiz-feedback');
    if (feedbackDiv) {
        feedbackDiv.style.display = 'none';
    }
}

function disableQuizButtons(disabled) {
    const buttons = document.querySelectorAll('.player-btn');
    buttons.forEach(button => {
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.5' : '1';
        button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    });
}

// 7. FUNZIONI UTILITY
function formatDate(dateStr) {
    if (!dateStr) return 'Data sconosciuta';
    
    try {
        // Formato DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
        return dateStr;
    } catch (error) {
        return dateStr;
    }
}

function updateFooterDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        dateElement.textContent = now.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
}

function showQuizError(message) {
    const detailsDiv = document.getElementById('quiz-match-details');
    if (detailsDiv) {
        detailsDiv.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// 8. DATI DI ESEMPIO (per testing)
function getExampleData() {
    console.log('📝 Caricamento dati di esempio...');
    return [
        {
            "Competizione": "Serie A",
            "Turno": "1",
            "Date": "24/08/2025",
            "Time": "17:30",
            "Location": "Giuseppe Sinigaglia",
            "HomeTeam": "Como",
            "AwayTeam": "Lazio",
            "Tifoso": "Steppo",
            "FTHG": "2",
            "FTAG": "0",
            "FTR": "H",
            "HTHG": "0",
            "HTAG": "0",
            "HTR": "D",
            "HS": "19",
            "AS": "5",
            "HST": "6",
            "AST": "1",
            "HF": "15",
            "AF": "12",
            "HC": "6",
            "AC": "0",
            "HY": "2",
            "AY": "3",
            "HR": "0",
            "AR": "0"
        },
        {
            "Competizione": "Coppa Italia",
            "Turno": "R32",
            "Date": "16/08/2025",
            "Time": "18:30",
            "Location": "Giuseppe Sinigaglia",
            "HomeTeam": "Como",
            "AwayTeam": "Sudtirol",
            "Tifoso": "Guzzo",
            "FTHG": "3",
            "FTAG": "1",
            "FTR": "H",
            "HTHG": "3",
            "HTAG": "1",
            "HTR": "H",
            "HS": "16",
            "AS": "5",
            "HST": "9",
            "AST": "3",
            "HF": "10",
            "AF": "15",
            "HC": "5",
            "AC": "0",
            "HY": "1",
            "AY": "1",
            "HR": "0",
            "AR": "1"
        },
        {
            "Competizione": "Serie A",
            "Turno": "2",
            "Date": "30/08/2025",
            "Time": "17:30",
            "Location": "Renato Dall'Ara",
            "HomeTeam": "Bologna",
            "AwayTeam": "Como",
            "Tifoso": "N",
            "FTHG": "1",
            "FTAG": "0",
            "FTR": "H",
            "HTHG": "0",
            "HTAG": "0",
            "HTR": "D",
            "HS": "15",
            "AS": "13",
            "HST": "2",
            "AST": "2",
            "HF": "13",
            "AF": "19",
            "HC": "7",
            "AC": "4",
            "HY": "4",
            "AY": "3",
            "HR": "0",
            "AR": "0"
        }
    ];
}

// 9. AGGIUNGI STILI CSS DINAMICI
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Animazioni */
        @keyframes scorePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .score-animate {
            animation: scorePop 0.5s ease;
            color: #4CAF50 !important;
        }
        
        /* Stili quiz */
        .match-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 0.9rem;
            color: #666;
        }
        
        .teams {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
        }
        
        .teams.win {
            border-left: 4px solid #4CAF50;
            background: #f1f8e9;
        }
        
        .teams.loss {
            border-left: 4px solid #f44336;
            background: #ffebee;
        }
        
        .teams.draw {
            border-left: 4px solid #FFC107;
            background: #fff8e1;
        }
        
        .team {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
        }
        
        .team.como {
            align-items: flex-start;
        }
        
        .team.opponent {
            align-items: flex-end;
        }
        
        .team-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #0055A5;
            margin-bottom: 5px;
        }
        
        .team-goals {
            font-size: 2.5rem;
            font-weight: bold;
            color: #333;
        }
        
        .vs {
            font-size: 1.5rem;
            color: #999;
            font-weight: bold;
        }
        
        .match-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #eee;
        }
        
        .stat-label {
            font-weight: bold;
            color: #666;
            font-size: 0.9rem;
        }
        
        .stat-value {
            color: #333;
            font-weight: 500;
        }
        
        .stat-value.win {
            color: #4CAF50;
        }
        
        .stat-value.loss {
            color: #f44336;
        }
        
        .stat-value.draw {
            color: #FFC107;
        }
        
        .competition {
            background: #0055A5;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
        }
        
        /* Errori */
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ef9a9a;
            text-align: center;
            margin: 10px 0;
        }
        
        /* Responsive quiz */
        @media (max-width: 768px) {
            .teams {
                flex-direction: column;
                gap: 10px;
            }
            
            .team.como, .team.opponent {
                align-items: center;
                flex-direction: row;
                gap: 15px;
            }
            
            .vs {
                order: -1;
            }
            
            .match-stats {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

// 10. INIZIALIZZA TUTTO QUANDO LA PAGINA È PRONTA
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM caricato, inizializzazione...');
    
    // Aggiungi stili dinamici
    addDynamicStyles();
    
    // Aggiungi event listener per il pulsante "Prossima partita"
    const nextBtn = document.getElementById('next-match-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuiz);
    }
    
    // Inizializza il sito
    initSite();
});

// 11. ESPORTA FUNZIONI PER IL DEBUG (opzionale)
if (typeof window !== 'undefined') {
    window.debugFunctions = {
        reloadDataset: loadDataset,
        recalcStats: calculateAllStats,
        getDataset: () => dataset,
        getSteppoStats: () => steppoStats,
        getGuzzoStats: () => guzzoStats,
        resetQuiz: () => {
            quizScore = 0;
            updateQuizScore();
            nextQuiz();
        }
    };
    
    console.log('🔧 Funzioni di debug disponibili in window.debugFunctions');
}