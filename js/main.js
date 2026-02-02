// main.js - VERSIONE COMPLETA E FUNZIONANTE

// ==================== VARIABILI GLOBALI ====================
let dataset = [];
let quizScore = 0;
let currentQuizMatch = null;
let steppoStats = null;
let guzzoStats = null;

// ==================== INIZIALIZZAZIONE ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚽ Al Sinigaglia - Steppo vs Guzzo');
    
    addDynamicStyles();
    
    try {
        // 1. Carica il CSV
        await loadCSV();
        
        // 2. Calcola le statistiche
        calculateStats();
        
        // 3. Aggiorna l'interfaccia
        updateUI();
        
        // 4. Crea i grafici
        createCharts();
        
        // 5. Inizializza il quiz
        initQuiz();
        
        // 6. Aggiorna data footer
        updateFooterDate();
        
        console.log('✅ Sito pronto!');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        useFallbackData();
    }
});

// ==================== CARICAMENTO CSV ====================
async function loadCSV() {
    console.log('📥 Caricamento CSV...');
    
    try {
        const response = await fetch('assets/datasets/dataset.csv');
        const csvText = await response.text();
        
        console.log('✅ CSV caricato');
        dataset = parseCSV(csvText);
        
    } catch (error) {
        console.error('❌ Errore caricamento CSV:', error);
        throw error;
    }
}

// ==================== PARSING CSV CORRETTO ====================
function parseCSV(csvText) {
    console.log('🔧 Parsing CSV...');
    
    // Normalizza le righe
    const lines = csvText.trim().replace(/\r/g, '').split('\n');
    
    // La PRIMA riga è l'HEADER
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    
    console.log('Headers:', headers);
    
    const result = [];
    
    // Processa dalla SECONDA riga in poi
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        
        // Mappa ogni header al suo valore
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        
        result.push(obj);
    }
    
    console.log(`✅ ${result.length} partite parsate`);
    return result;
}

// ==================== CALCOLO STATISTICHE ====================
function calculateStats() {
    console.log('🧮 Calcolo statistiche...');
    
    steppoStats = calculateForPerson('Steppo');
    guzzoStats = calculateForPerson('Guzzo');
    
    console.log('Steppo:', steppoStats);
    console.log('Guzzo:', guzzoStats);
}

function calculateForPerson(person) {
    // Filtra partite per questa persona
    const matches = dataset.filter(match => match.Tifoso === person);
    
    if (matches.length === 0) {
        return {
            total: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            winRate: '0.0', avgPoints: '0.00'
        };
    }
    
    const stats = {
        total: matches.length,
        wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0
    };
    
    matches.forEach(match => {
        const isComoHome = match.HomeTeam === 'Como';
        const ftr = match.FTR;
        
        // Risultato
        if (ftr === 'D') {
            stats.draws++;
        } else if ((ftr === 'H' && isComoHome) || (ftr === 'A' && !isComoHome)) {
            stats.wins++;
        } else {
            stats.losses++;
        }
        
        // Goal
        const fthg = parseInt(match.FTHG) || 0;
        const ftag = parseInt(match.FTAG) || 0;
        
        if (isComoHome) {
            stats.goalsFor += fthg;
            stats.goalsAgainst += ftag;
        } else {
            stats.goalsFor += ftag;
            stats.goalsAgainst += fthg;
        }
    });
    
    // Calcoli extra
    stats.points = stats.wins * 3 + stats.draws;
    stats.avgPoints = (stats.points / stats.total).toFixed(2);
    stats.winRate = ((stats.wins / stats.total) * 100).toFixed(1);
    
    return stats;
}

// ==================== AGGIORNA INTERFACCIA ====================
function updateUI() {
    console.log('🎨 Aggiornamento interfaccia...');
    
    // Funzione helper
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    // Steppo
    if (steppoStats) {
        setValue('steppo-total', steppoStats.total);
        setValue('steppo-wins', steppoStats.wins);
        setValue('steppo-draws', steppoStats.draws);
        setValue('steppo-losses', steppoStats.losses);
        setValue('steppo-goals-for', steppoStats.goalsFor);
        setValue('steppo-goals-against', steppoStats.goalsAgainst);
        setValue('steppo-win-rate', steppoStats.winRate + '%');
        setValue('steppo-ppg', steppoStats.avgPoints);
    }
    
    // Guzzo
    if (guzzoStats) {
        setValue('guzzo-total', guzzoStats.total);
        setValue('guzzo-wins', guzzoStats.wins);
        setValue('guzzo-draws', guzzoStats.draws);
        setValue('guzzo-losses', guzzoStats.losses);
        setValue('guzzo-goals-for', guzzoStats.goalsFor);
        setValue('guzzo-goals-against', guzzoStats.goalsAgainst);
        setValue('guzzo-win-rate', guzzoStats.winRate + '%');
        setValue('guzzo-ppg', guzzoStats.avgPoints);
    }
}

// ==================== GRAFICI P5.JS ====================
function createCharts() {
    createPieChart('steppo-chart', steppoStats, '#4CAF50', 'STEPPO');
    createPieChart('guzzo-chart', guzzoStats, '#FF9800', 'GUZZO');
}

function createPieChart(containerId, stats, color, title) {
    new p5((p) => {
        p.setup = () => {
            const canvas = p.createCanvas(280, 180);
            canvas.parent(containerId);
            p.noLoop();
        };
        
        p.draw = () => {
            p.background(245);
            
            if (!stats || stats.total === 0) {
                p.fill(100);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Nessun dato', p.width/2, p.height/2);
                return;
            }
            
            // Titolo
            p.fill(color);
            p.textSize(18);
            p.textAlign(p.CENTER);
            p.text(title, p.width/2, 30);
            
            // Grafico a torta
            const centerX = p.width/2;
            const centerY = p.height/2;
            const radius = 60;
            
            let angle = 0;
            const total = stats.wins + stats.draws + stats.losses;
            
            // Vittorie (verde)
            if (stats.wins > 0) {
                const winAngle = p.TWO_PI * (stats.wins / total);
                p.fill(76, 175, 80);
                p.arc(centerX, centerY, radius, radius, angle, angle + winAngle);
                angle += winAngle;
            }
            
            // Pareggi (giallo)
            if (stats.draws > 0) {
                const drawAngle = p.TWO_PI * (stats.draws / total);
                p.fill(255, 193, 7);
                p.arc(centerX, centerY, radius, radius, angle, angle + drawAngle);
                angle += drawAngle;
            }
            
            // Sconfitte (rosso)
            if (stats.losses > 0) {
                const lossAngle = p.TWO_PI * (stats.losses / total);
                p.fill(244, 67, 54);
                p.arc(centerX, centerY, radius, radius, angle, angle + lossAngle);
            }
            
            // Testo statistiche
            p.fill(0);
            p.textSize(14);
            p.textAlign(p.CENTER);
            p.text(`${stats.wins}V ${stats.draws}N ${stats.losses}P`, centerX, centerY + radius + 25);
            p.textSize(12);
            p.text(`${stats.winRate}% vittorie`, centerX, centerY + radius + 40);
        };
    });
}

// ==================== QUIZ ====================
function initQuiz() {
    quizScore = 0;
    updateQuizScore();
    nextQuiz();
    
    // Event listeners per i pulsanti
    document.querySelector('.steppo-btn').addEventListener('click', () => guess('Steppo'));
    document.querySelector('.guzzo-btn').addEventListener('click', () => guess('Guzzo'));
}

function nextQuiz() {
    const validMatches = dataset.filter(m => m.Tifoso === 'Steppo' || m.Tifoso === 'Guzzo');
    
    if (validMatches.length === 0) {
        document.getElementById('quiz-match-details').innerHTML = 
            '<p class="error">Nessuna partita disponibile</p>';
        return;
    }
    
    currentQuizMatch = validMatches[Math.floor(Math.random() * validMatches.length)];
    
    const isComoHome = currentQuizMatch.HomeTeam === 'Como';
    const opponent = isComoHome ? currentQuizMatch.AwayTeam : currentQuizMatch.HomeTeam;
    const comoGoals = isComoHome ? currentQuizMatch.FTHG : currentQuizMatch.FTAG;
    const oppGoals = isComoHome ? currentQuizMatch.FTAG : currentQuizMatch.FTHG;
    
    document.getElementById('quiz-match-details').innerHTML = `
        <div class="quiz-match">
            <div class="match-header">
                <span class="competition">${currentQuizMatch.Competizione}</span>
                <span class="date">${currentQuizMatch.Date}</span>
            </div>
            <div class="score-display">
                <span class="team como">COMO ${comoGoals}</span>
                <span class="vs">-</span>
                <span class="team opponent">${oppGoals} ${opponent}</span>
            </div>
            <div class="match-info">
                <div>📍 ${currentQuizMatch.Location}</div>
                <div>⏰ ${currentQuizMatch.Time}</div>
            </div>
        </div>
    `;
    
    // Nascondi feedback precedente
    document.getElementById('quiz-feedback').style.display = 'none';
}

function guess(player) {
    if (!currentQuizMatch) return;
    
    const correct = currentQuizMatch.Tifoso === player;
    const feedback = document.getElementById('quiz-feedback');
    
    if (correct) {
        quizScore++;
        feedback.innerHTML = `<div class="correct">✅ Giusto! Era ${player}</div>`;
    } else {
        feedback.innerHTML = `<div class="wrong">❌ Sbagliato! Era ${currentQuizMatch.Tifoso}</div>`;
    }
    
    feedback.style.display = 'block';
    updateQuizScore();
    
    // Disabilita pulsanti temporaneamente
    document.querySelectorAll('.player-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    setTimeout(() => {
        document.querySelectorAll('.player-btn').forEach(btn => {
            btn.disabled = false;
        });
        nextQuiz();
    }, 2000);
}

function updateQuizScore() {
    document.getElementById('quiz-score').textContent = `Punteggio: ${quizScore}`;
}

// ==================== FALLBACK SE IL CSV NON CARICA ====================
function useFallbackData() {
    console.log('⚠️  Uso dati di esempio');
    
    dataset = [
        {
            "Competizione": "Serie A",
            "Date": "24/08/2025",
            "Location": "Giuseppe Sinigaglia",
            "HomeTeam": "Como",
            "AwayTeam": "Lazio",
            "Tifoso": "Steppo",
            "FTHG": "2",
            "FTAG": "0",
            "FTR": "H"
        },
        {
            "Competizione": "Coppa Italia",
            "Date": "16/08/2025",
            "Location": "Giuseppe Sinigaglia",
            "HomeTeam": "Como",
            "AwayTeam": "Sudtirol",
            "Tifoso": "Guzzo",
            "FTHG": "3",
            "FTAG": "1",
            "FTR": "H"
        },
        {
            "Competizione": "Serie A",
            "Date": "30/08/2025",
            "Location": "Renato Dall'Ara",
            "HomeTeam": "Bologna",
            "AwayTeam": "Como",
            "Tifoso": "N",
            "FTHG": "1",
            "FTAG": "0",
            "FTR": "H"
        }
    ];
    
    calculateStats();
    updateUI();
    createCharts();
    initQuiz();
}

// ==================== UTILITY FUNCTIONS ====================
function updateFooterDate() {
    document.getElementById('current-date').textContent = 
        new Date().toLocaleDateString('it-IT');
}

function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Quiz styles */
        .quiz-match {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .match-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            color: #666;
        }
        
        .score-display {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 15px 0;
            font-size: 1.8rem;
            font-weight: bold;
        }
        
        .team.como {
            color: #0055A5;
        }
        
        .team.opponent {
            color: #333;
        }
        
        .vs {
            color: #999;
        }
        
        .match-info {
            color: #666;
            font-size: 0.9rem;
        }
        
        .match-info div {
            margin: 5px 0;
        }
        
        #quiz-feedback {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            display: none;
        }
        
        .correct {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .wrong {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .error {
            color: #dc3545;
            text-align: center;
            padding: 20px;
        }
        
        /* Chart containers */
        #steppo-chart, #guzzo-chart {
            background: white;
            border-radius: 10px;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #eee;
        }
    `;
    document.head.appendChild(style);
}

// ==================== DEBUG HELPER ====================
window.debug = {
    showDataset: () => {
        console.log('Dataset:', dataset);
        console.log(`${dataset.length} partite`);
        
        const steppoCount = dataset.filter(m => m.Tifoso === 'Steppo').length;
        const guzzoCount = dataset.filter(m => m.Tifoso === 'Guzzo').length;
        
        console.log(`Steppo: ${steppoCount} partite`);
        console.log(`Guzzo: ${guzzoCount} partite`);
    },
    
    reload: async () => {
        console.log('Ricarico tutto...');
        await loadCSV();
        calculateStats();
        updateUI();
        createCharts();
        nextQuiz();
    }
};