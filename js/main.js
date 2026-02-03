// main.js - VERSIONE COMPLETA CON GRAFICI

// ==================== VARIABILI GLOBALI ====================
let dataset = [];
let steppoStats = null;
let guzzoStats = null;

// ==================== CARICAMENTO CSV ====================
async function loadCSV() {
    console.log('📥 Caricamento CSV...');
    try {
        // PROVA PIÙ PERCORSI (locale e GitHub Pages)
        const paths = [
            './assets/datasets/dataset.csv',      // Per GitHub Pages
            'assets/datasets/dataset.csv',        // Per file locale
            '../assets/datasets/dataset.csv',     // Alternativa
            '/al-sinigaglia/assets/datasets/dataset.csv'  // Path assoluto GitHub
        ];
        
        let csvText = '';
        
        for (const path of paths) {
            try {
                console.log(`🔍 Provo percorso: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    csvText = await response.text();
                    console.log(`✅ CSV trovato: ${path}`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Fallito: ${path}`);
            }
        }
        
        if (!csvText) {
            throw new Error('CSV non trovato in nessun percorso');
        }
        
        dataset = parseCSV(csvText);
        console.log(`✅ ${dataset.length} partite caricate`);
        
    } catch (error) {
        console.error('❌ Errore caricamento CSV:', error);
        useFallbackData();
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log('📋 Colonne trovate:', headers);
    
    return lines.slice(1)
        .filter(line => line.trim())  // Rimuove righe vuote
        .map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        });
}

// ==================== CALCOLO STATISTICHE ====================
function calculateStats() {
    steppoStats = calculateForPerson('Steppo');
    guzzoStats = calculateForPerson('Guzzo');
    console.log('📊 Statistiche calcolate');
}

function calculateForPerson(person) {
    // DEBUG: Mostra tutti i valori unici della colonna Tifoso
    const tifosiUnici = [...new Set(dataset.map(m => m.Tifoso))].filter(Boolean);
    console.log(`🎫 Valori unici in colonna Tifoso:`, tifosiUnici);
    
    const matches = dataset.filter(match => {
        const tifoso = match.Tifoso ? match.Tifoso.trim() : '';
        return tifoso === person;
    });
    
    console.log(`👤 ${person}: ${matches.length} partite trovate`);
    
    if (matches.length === 0) {
        console.warn(`⚠️  Nessuna partita trovata per ${person}`);
        return getEmptyStats();
    }
    
    const stats = {
        total: matches.length,
        wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0,
        matches: matches
    };
    
    matches.forEach(match => {
        const isComoHome = match.HomeTeam === 'Como';
        const ftr = match.FTR;
        
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
    stats.avgPoints = stats.total > 0 ? (stats.points / stats.total).toFixed(2) : '0.00';
    stats.winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : '0.0';
    
    console.log(`✅ ${person}: ${stats.wins}V ${stats.draws}N ${stats.losses}P`);
    console.log(`   Goal: ${stats.goalsFor}-${stats.goalsAgainst}`);
    console.log(`   Punti/partita: ${stats.avgPoints}`);
    
    return stats;
}

// ==================== AGGIORNAMENTO UI ====================
function updateUI() {
    console.log('🎨 Aggiornamento interfaccia...');
    updateStats('steppo', steppoStats);
    updateStats('guzzo', guzzoStats);
}

function updateStats(prefix, stats) {
    if (!stats) {
        console.warn(`⚠️  Nessuna statistica per ${prefix}`);
        return;
    }
    
    const elements = {
        'total': stats.total,
        'wins': stats.wins,
        'draws': stats.draws,
        'losses': stats.losses,
        'goals-for': stats.goalsFor,
        'goals-against': stats.goalsAgainst,
        'win-rate': `${stats.winRate}%`,
        'ppg': stats.avgPoints
    };
    
    Object.entries(elements).forEach(([key, value]) => {
        const id = `${prefix}-${key}`;
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
            console.log(`✅ ${id}: ${value}`);
        } else {
            console.error(`❌ Elemento #${id} non trovato`);
        }
    });
}

// ==================== GRAFICI P5.JS ====================
function createCharts() {
    console.log('📊 Creazione grafici...');
    
    // Grafico Steppo
    createPieChart('steppo-chart', steppoStats, '#4CAF50', 'STEPPO');
    
    // Grafico Guzzo
    createPieChart('guzzo-chart', guzzoStats, '#FF9800', 'GUZZO');
    
    // Grafico di confronto
    createComparisonChart();
}

function createPieChart(containerId, stats, color, title) {
    console.log(`📈 Creo grafico per ${title}`);
    
    new p5((p) => {
        p.setup = () => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`❌ Container ${containerId} non trovato`);
                return;
            }
            
            const canvas = p.createCanvas(280, 180);
            canvas.parent(containerId);
            p.noLoop(); // Disegna solo una volta
        };
        
        p.draw = () => {
            p.clear();
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
                p.fill(76, 175, 80); // Verde
                p.arc(centerX, centerY, radius, radius, angle, angle + winAngle);
                angle += winAngle;
            }
            
            // Pareggi (giallo)
            if (stats.draws > 0) {
                const drawAngle = p.TWO_PI * (stats.draws / total);
                p.fill(255, 193, 7); // Giallo
                p.arc(centerX, centerY, radius, radius, angle, angle + drawAngle);
                angle += drawAngle;
            }
            
            // Sconfitte (rosso)
            if (stats.losses > 0) {
                const lossAngle = p.TWO_PI * (stats.losses / total);
                p.fill(244, 67, 54); // Rosso
                p.arc(centerX, centerY, radius, radius, angle, angle + lossAngle);
            }
            
            // Statistiche testuali
            p.fill(0);
            p.textSize(14);
            p.textAlign(p.CENTER);
            p.text(`${stats.wins}V ${stats.draws}N ${stats.losses}P`, centerX, centerY + radius + 25);
            
            p.textSize(12);
            p.text(`${stats.winRate}% vittorie`, centerX, centerY + radius + 40);
            p.text(`${stats.avgPoints} punti/partita`, centerX, centerY + radius + 55);
        };
    });
}

function createComparisonChart() {
    console.log('📊 Creo grafico radar mobile-friendly...');
    
    // Crea il div
    if (!document.getElementById('comparison-chart')) {
        const comparisonDiv = document.createElement('div');
        comparisonDiv.id = 'comparison-chart';
        comparisonDiv.style.cssText = `
            margin-top: 20px;
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid #e0e7ff;
            width: 100%;
            overflow: hidden;
            position: relative;
        `;
        
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            statsContainer.appendChild(comparisonDiv);
        }
    }
    
    new p5((p) => {
        let canvasWidth = 0;
        let canvasHeight = 0;
        
        p.setup = () => {
            const container = document.getElementById('comparison-chart');
            if (!container) return;
            
            // Dimensioni responsive
            const isMobile = window.innerWidth < 768;
            canvasWidth = Math.min(container.clientWidth - 40, 600);
            canvasHeight = isMobile ? 350 : 320;
            
            const canvas = p.createCanvas(canvasWidth, canvasHeight);
            canvas.parent('comparison-chart');
            canvas.style('width', '100%');
            canvas.style('height', 'auto');
            canvas.style('border-radius', '12px');
            p.noLoop();
        };
        
        p.draw = () => {
            p.clear();
            
            if (!steppoStats || !guzzoStats) return;
            
            // Sfondo con gradiente
            drawGradientBackground(p);
            
            // Titolo
            p.fill(0, 85, 165);
            p.textSize(18);
            p.textAlign(p.CENTER);
            p.textStyle(p.BOLD);
            p.text('📊 CONFRONTO RADAR', p.width/2, 30);
            
            // Dati normalizzati per radar
            const metrics = [
                { name: 'VITTORIE %', steppo: parseFloat(steppoStats.winRate)/100, guzzo: parseFloat(guzzoStats.winRate)/100 },
                { name: 'PUNTI/PT', steppo: parseFloat(steppoStats.avgPoints)/3, guzzo: parseFloat(guzzoStats.avgPoints)/3 },
                { name: 'GOL F/PT', steppo: (steppoStats.goalsFor/steppoStats.total)/3, guzzo: (guzzoStats.goalsFor/guzzoStats.total)/3 },
                { name: 'GOL S/PT', steppo: (steppoStats.goalsAgainst/steppoStats.total)/3, guzzo: (guzzoStats.goalsAgainst/guzzoStats.total)/3 },
                { name: 'PARTITE', steppo: steppoStats.total/50, guzzo: guzzoStats.total/50 }
            ];
            
            const centerX = p.width/2;
            const centerY = p.height/2 + 20;
            const radius = Math.min(p.width, p.height) * 0.3;
            const angleStep = p.TWO_PI / metrics.length;
            
            // Griglia radar
            p.stroke(200, 200, 220, 150);
            p.strokeWeight(1);
            p.noFill();
            
            // Cerchi concentrici
            for (let i = 1; i <= 5; i++) {
                p.ellipse(centerX, centerY, radius * i/5 * 2);
            }
            
            // Linee assi
            for (let i = 0; i < metrics.length; i++) {
                const angle = i * angleStep - p.HALF_PI;
                const x = centerX + p.cos(angle) * radius;
                const y = centerY + p.sin(angle) * radius;
                
                p.line(centerX, centerY, x, y);
                
                // Etichette assi
                p.fill(100);
                p.noStroke();
                p.textAlign(p.CENTER);
                p.textSize(11);
                p.text(metrics[i].name, 
                       centerX + p.cos(angle) * (radius + 25), 
                       centerY + p.sin(angle) * (radius + 20));
            }
            
            // Disegna area Steppo
            drawRadarArea(p, centerX, centerY, radius, metrics, 'steppo', [76, 175, 80, 150], [76, 175, 80, 200]);
            
            // Disegna area Guzzo
            drawRadarArea(p, centerX, centerY, radius, metrics, 'guzzo', [255, 152, 0, 150], [255, 152, 0, 200]);
            
            // Legenda
            p.fill(76, 175, 80, 200);
            p.rect(p.width/2 - 100, p.height - 40, 15, 15, 3);
            p.fill(0);
            p.textSize(12);
            p.textAlign(p.LEFT);
            p.text('Steppo', p.width/2 - 80, p.height - 30);
            
            p.fill(255, 152, 0, 200);
            p.rect(p.width/2 + 10, p.height - 40, 15, 15, 3);
            p.text('Guzzo', p.width/2 + 30, p.height - 30);
        };
        
        function drawGradientBackground(p) {
            // Sfondo gradiente
            for (let y = 0; y < p.height; y++) {
                const inter = p.map(y, 0, p.height, 0, 1);
                const c = p.lerpColor(p.color(248, 249, 255), p.color(255, 255, 255), inter);
                p.stroke(c);
                p.line(0, y, p.width, y);
            }
        }
        
        function drawRadarArea(p, cx, cy, radius, metrics, player, fillColor, strokeColor) {
            p.beginShape();
            
            for (let i = 0; i < metrics.length; i++) {
                const value = metrics[i][player];
                const angle = i * (p.TWO_PI / metrics.length) - p.HALF_PI;
                const r = radius * value;
                const x = cx + p.cos(angle) * r;
                const y = cy + p.sin(angle) * r;
                
                p.vertex(x, y);
                
                // Punto sul vertice
                p.fill(strokeColor[0], strokeColor[1], strokeColor[2], 255);
                p.noStroke();
                p.ellipse(x, y, 8, 8);
                
                // Valore numerico
                p.fill(0);
                p.textSize(9);
                p.textAlign(p.CENTER);
                p.text((value * 100).toFixed(0) + '%', x, y - 12);
            }
            
            p.endShape(p.CLOSE);
            
            // Riempimento area
            p.fill(fillColor[0], fillColor[1], fillColor[2], fillColor[3]);
            p.stroke(strokeColor[0], strokeColor[1], strokeColor[2], strokeColor[3]);
            p.strokeWeight(2);
        }
        
        p.windowResized = () => {
            const container = document.getElementById('comparison-chart');
            if (!container) return;
            
            const isMobile = window.innerWidth < 768;
            const newWidth = Math.min(container.clientWidth - 40, 600);
            const newHeight = isMobile ? 350 : 320;
            
            p.resizeCanvas(newWidth, newHeight);
            p.redraw();
        };
    });
}

// ==================== FUNZIONI HELPER ====================
function getEmptyStats() {
    return {
        total: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        avgPoints: '0.00',
        winRate: '0.0'
    };
}

function useFallbackData() {
    console.log('⚠️  Uso dati di esempio per testing');
    
    dataset = [
        {
            "Competizione": "Serie A",
            "Date": "24/08/2025",
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
            "HomeTeam": "Como",
            "AwayTeam": "Sudtirol",
            "Tifoso": "Guzzo",
            "FTHG": "3",
            "FTAG": "1",
            "FTR": "H"
        },
        {
            "Competizione": "Serie A",
            "Date": "14/09/2025",
            "HomeTeam": "Como",
            "AwayTeam": "Inter",
            "Tifoso": "Steppo",
            "FTHG": "1",
            "FTAG": "1",
            "FTR": "D"
        },
        {
            "Competizione": "Serie A",
            "Date": "21/09/2025",
            "HomeTeam": "Udinese",
            "AwayTeam": "Como",
            "Tifoso": "Guzzo",
            "FTHG": "0",
            "FTAG": "2",
            "FTR": "A"
        }
    ];
    
    console.log('📊 Dati di esempio:', dataset.length, 'partite');
}

// ==================== INIZIALIZZAZIONE ====================
async function initStatsPage() {
    console.log('🚀 Inizializzazione pagina statistiche...');
    
    try {
        // 1. Carica CSV
        await loadCSV();
        
        // 2. Calcola statistiche
        calculateStats();
        
        // 3. Aggiorna UI
        updateUI();
        
        // 4. Crea grafici
        createCharts();
        
        // 5. Aggiorna data footer
        updateFooterDate();
        
        console.log('✅ Pagina statistiche inizializzata');
        
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        alert('Errore nel caricamento dei dati. Controlla la console per i dettagli.');
    }
}

function updateFooterDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('it-IT');
    }
}

// ==================== DEBUG FUNCTIONS ====================
window.debugStats = {
    showDataset: () => {
        console.log('📋 Dataset completo:', dataset);
        console.log(`📊 ${dataset.length} partite totali`);
        
        if (dataset.length > 0) {
            console.log('🎫 Valori unici Tifoso:', [...new Set(dataset.map(m => m.Tifoso))].filter(Boolean));
            console.log('🏠 Valori unici HomeTeam:', [...new Set(dataset.map(m => m.HomeTeam))].filter(Boolean));
        }
    },
    
    reload: async () => {
        console.log('🔄 Ricarico tutto...');
        await loadCSV();
        calculateStats();
        updateUI();
        createCharts();
    },
    
    testParsing: (csvText) => {
        console.log('🧪 Test parsing...');
        const testData = parseCSV(csvText);
        console.log('Risultato test:', testData);
        return testData;
    }
};

// ==================== ESPORTA PER USO IN HTML ====================
// Aggiungi questo alla fine del tuo HTML in stats.html:
// <script>
//   document.addEventListener('DOMContentLoaded', initStatsPage);
// </script>