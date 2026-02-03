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
    console.log('📊 Creo grafico di confronto mobile-friendly...');
    
    // Crea il div se non esiste
    if (!document.getElementById('comparison-chart')) {
        const comparisonDiv = document.createElement('div');
        comparisonDiv.id = 'comparison-chart';
        comparisonDiv.style.cssText = `
            margin-top: 20px;
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            width: 100%;
            overflow: hidden;
        `;
        
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            statsContainer.appendChild(comparisonDiv);
        }
    }
    
    new p5((p) => {
        let canvasWidth = 0;
        let mobileMode = false;
        
        p.setup = () => {
            // Calcola larghezza dinamica in base al contenitore
            const container = document.getElementById('comparison-chart');
            if (!container) return;
            
            // Calcola larghezza disponibile (massimo 800px)
            const availableWidth = Math.min(container.clientWidth - 30, 800);
            canvasWidth = Math.max(availableWidth, 300); // Minimo 300px
            
            // Determina se siamo in mobile
            mobileMode = canvasWidth < 500;
            
            // Altezza dinamica
            const canvasHeight = mobileMode ? 350 : 280;
            
            const canvas = p.createCanvas(canvasWidth, canvasHeight);
            canvas.parent('comparison-chart');
            canvas.style('width', '100%');
            canvas.style('height', 'auto');
            p.noLoop();
            
            console.log(`📱 Modalità: ${mobileMode ? 'Mobile' : 'Desktop'}, Larghezza: ${canvasWidth}px`);
        };
        
        p.draw = () => {
            p.clear();
            p.background(255);
            
            if (!steppoStats || !guzzoStats || steppoStats.total === 0 || guzzoStats.total === 0) {
                p.fill(100);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.text('Dati insufficienti per il confronto', p.width/2, p.height/2);
                return;
            }
            
            // Titolo con stile moderno
            p.fill(0, 85, 165);
            p.textSize(mobileMode ? 16 : 18);
            p.textAlign(p.CENTER);
            p.textStyle(p.BOLD);
            p.text('CONFRONTO DIRETTO: STEPPO vs GUZZO', p.width/2, 25);
            
            // Metriche da confrontare
            const metrics = [
                { 
                    label: 'VITTORIE %', 
                    steppo: parseFloat(steppoStats.winRate), 
                    guzzo: parseFloat(guzzoStats.winRate),
                    max: 100,
                    unit: '%',
                    colorSteppo: [76, 175, 80],    // Verde
                    colorGuzzo: [255, 152, 0],     // Arancione
                    format: (val) => `${val.toFixed(1)}%`
                },
                { 
                    label: 'PUNTI/PARTITA', 
                    steppo: parseFloat(steppoStats.avgPoints), 
                    guzzo: parseFloat(guzzoStats.avgPoints),
                    max: 3,
                    unit: '',
                    colorSteppo: [33, 150, 243],   // Blu
                    colorGuzzo: [156, 39, 176],    // Viola
                    format: (val) => val.toFixed(2)
                },
                { 
                    label: 'GOAL FATTI/PT', 
                    steppo: steppoStats.goalsFor / steppoStats.total, 
                    guzzo: guzzoStats.goalsFor / guzzoStats.total,
                    max: 3,
                    unit: '',
                    colorSteppo: [255, 87, 34],    // Arancione scuro
                    colorGuzzo: [0, 150, 136],     // Verde acqua
                    format: (val) => val.toFixed(2)
                },
                { 
                    label: 'PARTITE', 
                    steppo: steppoStats.total, 
                    guzzo: guzzoStats.total,
                    max: Math.max(steppoStats.total, guzzoStats.total) * 1.2,
                    unit: '',
                    colorSteppo: [121, 85, 72],    // Marrone
                    colorGuzzo: [96, 125, 139],    // Grigio blu
                    format: (val) => Math.round(val)
                }
            ];
            
            // Configurazione in base al dispositivo
            const config = {
                barWidth: mobileMode ? 25 : 35,
                spacing: mobileMode ? (p.width * 0.25) : (p.width * 0.22),
                startX: mobileMode ? (p.width * 0.15) : (p.width * 0.12),
                baseY: mobileMode ? 260 : 200,
                maxBarHeight: mobileMode ? 120 : 150,
                labelYOffset: mobileMode ? 40 : 20
            };
            
            // Disegna asse
            p.stroke(220);
            p.strokeWeight(1);
            p.line(40, config.baseY, p.width - 40, config.baseY);
            
            // Disegna ogni metrica
            for (let i = 0; i < metrics.length; i++) {
                const x = config.startX + i * config.spacing;
                const metric = metrics[i];
                
                // Se siamo in mobile e non c'è spazio, andiamo a capo
                if (mobileMode && i === 2) {
                    // In mobile mostriamo solo 2 metriche per riga
                    continue;
                }
                
                // Calcola altezze normalizzate
                const steppoHeight = (metric.steppo / metric.max) * config.maxBarHeight;
                const guzzoHeight = (metric.guzzo / metric.max) * config.maxBarHeight;
                
                // Disegna barra Steppo con gradiente
                drawRoundedBar(p, x - config.barWidth - 8, config.baseY - steppoHeight, 
                             config.barWidth, steppoHeight, metric.colorSteppo);
                
                // Disegna barra Guzzo con gradiente
                drawRoundedBar(p, x + 8, config.baseY - guzzoHeight, 
                             config.barWidth, guzzoHeight, metric.colorGuzzo);
                
                // Valori numerici con sfondo
                p.fill(255);
                p.noStroke();
                p.rectMode(p.CENTER);
                
                // Valore Steppo
                const steppoText = metric.format(metric.steppo);
                p.fill(metric.colorSteppo);
                p.textSize(mobileMode ? 10 : 12);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.text(steppoText, x - config.barWidth/2 - 8, config.baseY - steppoHeight - 5);
                
                // Valore Guzzo
                const guzzoText = metric.format(metric.guzzo);
                p.fill(metric.colorGuzzo);
                p.text(guzzoText, x + config.barWidth/2 + 8, config.baseY - guzzoHeight - 5);
                
                // Etichetta metrica
                p.fill(60);
                p.textSize(mobileMode ? 9 : 11);
                p.textAlign(p.CENTER);
                p.text(metric.label, x, config.baseY + config.labelYOffset);
            }
            
            // In mobile, seconda riga di metriche
            if (mobileMode) {
                const mobileMetrics = metrics.slice(2);
                const mobileStartY = config.baseY + 80;
                
                p.stroke(220);
                p.strokeWeight(1);
                p.line(40, mobileStartY, p.width - 40, mobileStartY);
                
                for (let i = 0; i < mobileMetrics.length; i++) {
                    const x = config.startX + i * config.spacing;
                    const metric = mobileMetrics[i];
                    
                    const steppoHeight = (metric.steppo / metric.max) * config.maxBarHeight;
                    const guzzoHeight = (metric.guzzo / metric.max) * config.maxBarHeight;
                    
                    drawRoundedBar(p, x - config.barWidth - 8, mobileStartY - steppoHeight, 
                                 config.barWidth, steppoHeight, metric.colorSteppo);
                    
                    drawRoundedBar(p, x + 8, mobileStartY - guzzoHeight, 
                                 config.barWidth, guzzoHeight, metric.colorGuzzo);
                    
                    // Valori numerici
                    p.fill(metric.colorSteppo);
                    p.textSize(10);
                    p.textAlign(p.CENTER, p.BOTTOM);
                    p.text(metric.format(metric.steppo), x - config.barWidth/2 - 8, mobileStartY - steppoHeight - 5);
                    
                    p.fill(metric.colorGuzzo);
                    p.text(metric.format(metric.guzzo), x + config.barWidth/2 + 8, mobileStartY - guzzoHeight - 5);
                    
                    p.fill(60);
                    p.textSize(9);
                    p.textAlign(p.CENTER);
                    p.text(metric.label, x, mobileStartY + config.labelYOffset);
                }
                
                // Aggiorna altezza canvas per mobile
                p.resizeCanvas(canvasWidth, 450);
            }
            
            // Legenda moderna
            drawLegend(p, mobileMode);
        };
        
        // Funzione helper per barre arrotondate
        function drawRoundedBar(p, x, y, w, h, color) {
            if (h === 0) return;
            
            // Effetto gradiente
            p.noStroke();
            for (let i = 0; i < h; i++) {
                const alpha = p.map(i, 0, h, 200, 255);
                p.fill(color[0], color[1], color[2], alpha);
                p.rect(x, y + i, w, 1);
            }
            
            // Top arrotondato (semi-cerchio)
            p.fill(color[0], color[1], color[2], 255);
            p.rect(x, y, w, h);
            p.ellipseMode(p.CORNER);
            p.arc(x, y - w/2, w, w, p.PI, p.TWO_PI);
        }
        
        // Funzione per disegnare la legenda
        function drawLegend(p, isMobile) {
            const legendY = isMobile ? 420 : (p.height - 20);
            
            // Steppo
            p.fill(76, 175, 80);
            p.rect(30, legendY - 10, 12, 12, 3);
            p.fill(0);
            p.textSize(isMobile ? 10 : 12);
            p.textAlign(p.LEFT);
            p.text('Steppo', 47, legendY);
            
            // Guzzo
            p.fill(255, 152, 0);
            p.rect(isMobile ? 100 : 120, legendY - 10, 12, 12, 3);
            p.fill(0);
            p.text('Guzzo', isMobile ? 117 : 137, legendY);
            
            // Indicatore responsive
            p.textSize(9);
            p.fill(120);
            p.textAlign(p.CENTER);
            p.text('📱 Grafico ottimizzato per mobile', p.width/2, legendY + (isMobile ? 20 : 15));
        }
        
        // Aggiungi resize handler per responsive
        p.windowResized = () => {
            const container = document.getElementById('comparison-chart');
            if (!container) return;
            
            const availableWidth = Math.min(container.clientWidth - 30, 800);
            const newWidth = Math.max(availableWidth, 300);
            
            if (Math.abs(newWidth - canvasWidth) > 50) {
                p.resizeCanvas(newWidth, mobileMode ? 450 : 280);
                p.redraw();
            }
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