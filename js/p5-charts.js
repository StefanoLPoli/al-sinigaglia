// p5-charts.js

// Variabili globali
let dataset = [];
let steppoStats = null;
let guzzoStats = null;

// Carica il dataset CSV e inizializza
async function initP5Charts() {
    // Carica il CSV (modifica il percorso se necessario)
    const response = await fetch('assets/dataset/dataset.csv');
    const csvText = await response.text();
    dataset = parseCSV(csvText);
    
    // Calcola le statistiche
    steppoStats = calculateStats('Steppo');
    guzzoStats = calculateStats('Guzzo');
    
    // Crea tutti i grafici
    createSteppoPieChart();
    createGuzzoPieChart();
    createComparisonChart();
    createTimelineChart();
}

// 1. PARSING CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(';').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });
}

// 2. CALCOLO STATISTICHE
function calculateStats(person) {
    const matches = dataset.filter(match => match.Tifoso === person);
    
    if (matches.length === 0) {
        return {
            total: 0,
            wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            shotsFor: 0, shotsAgainst: 0,
            shotsOnTargetFor: 0, shotsOnTargetAgainst: 0,
            cornersFor: 0, cornersAgainst: 0,
            yellowCards: 0, redCards: 0,
            winRate: 0, pointsPerGame: 0,
            matches: []
        };
    }
    
    const stats = {
        total: matches.length,
        wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0,
        shotsFor: 0, shotsAgainst: 0,
        shotsOnTargetFor: 0, shotsOnTargetAgainst: 0,
        cornersFor: 0, cornersAgainst: 0,
        yellowCards: 0, redCards: 0,
        matches: matches
    };
    
    matches.forEach(match => {
        const isComoHome = match.HomeTeam === 'Como';
        
        // Risultato
        if (match.FTR === 'D') {
            stats.draws++;
        } else if ((match.FTR === 'H' && isComoHome) || (match.FTR === 'A' && !isComoHome)) {
            stats.wins++;
        } else {
            stats.losses++;
        }
        
        // Goal
        stats.goalsFor += isComoHome ? parseInt(match.FTHG) : parseInt(match.FTAG);
        stats.goalsAgainst += isComoHome ? parseInt(match.FTAG) : parseInt(match.FTHG);
        
        // Tiri
        stats.shotsFor += isComoHome ? parseInt(match.HS) : parseInt(match.AS);
        stats.shotsAgainst += isComoHome ? parseInt(match.AS) : parseInt(match.HS);
        
        // Tiri in porta
        stats.shotsOnTargetFor += isComoHome ? parseInt(match.HST) : parseInt(match.AST);
        stats.shotsOnTargetAgainst += isComoHome ? parseInt(match.AST) : parseInt(match.HST);
        
        // Corner
        stats.cornersFor += isComoHome ? parseInt(match.HC) : parseInt(match.AC);
        stats.cornersAgainst += isComoHome ? parseInt(match.AC) : parseInt(match.HC);
        
        // Cartellini
        stats.yellowCards += isComoHome ? parseInt(match.HY) : parseInt(match.AY);
        stats.redCards += isComoHome ? parseInt(match.HR) : parseInt(match.AR);
    });
    
    // Calcoli derivati
    stats.winRate = (stats.wins / stats.total * 100).toFixed(1);
    stats.pointsPerGame = ((stats.wins * 3 + stats.draws) / stats.total).toFixed(2);
    stats.avgShotsFor = (stats.shotsFor / stats.total).toFixed(1);
    stats.avgShotsOnTargetFor = (stats.shotsOnTargetFor / stats.total).toFixed(1);
    stats.avgCornersFor = (stats.cornersFor / stats.total).toFixed(1);
    
    return stats;
}

// 3. GRAFICO A TORTA PER STEPPO
function createSteppoPieChart() {
    new p5((p) => {
        p.setup = () => {
            const canvas = p.createCanvas(280, 180);
            canvas.parent('steppo-chart');
            canvas.style('border-radius', '10px');
            
            // Aggiorna le statistiche nel DOM
            if (steppoStats && steppoStats.total > 0) {
                updateDOMStats('steppo', steppoStats);
            }
        };
        
        p.draw = () => {
            p.clear();
            
            if (!steppoStats || steppoStats.total === 0) {
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.fill(100);
                p.text('Nessun dato disponibile', p.width/2, p.height/2);
                return;
            }
            
            // Titolo
            p.fill(76, 175, 80);
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text('STEPPO', p.width/2, 20);
            
            // Grafico a torta
            const centerX = p.width/2;
            const centerY = p.height/2;
            const radius = 60;
            
            let angle = 0;
            const total = steppoStats.wins + steppoStats.draws + steppoStats.losses;
            
            // Vittorie (verde)
            if (steppoStats.wins > 0) {
                const winAngle = p.TWO_PI * (steppoStats.wins / total);
                p.fill(76, 175, 80, 200);
                p.arc(centerX, centerY, radius * 2, radius * 2, angle, angle + winAngle);
                angle += winAngle;
            }
            
            // Pareggi (giallo)
            if (steppoStats.draws > 0) {
                const drawAngle = p.TWO_PI * (steppoStats.draws / total);
                p.fill(255, 193, 7, 200);
                p.arc(centerX, centerY, radius * 2, radius * 2, angle, angle + drawAngle);
                angle += drawAngle;
            }
            
            // Sconfitte (rosso)
            if (steppoStats.losses > 0) {
                const lossAngle = p.TWO_PI * (steppoStats.losses / total);
                p.fill(244, 67, 54, 200);
                p.arc(centerX, centerY, radius * 2, radius * 2, angle, angle + lossAngle);
            }
            
            // Legenda
            const legendY = centerY + radius + 30;
            
            // Vittorie
            p.fill(76, 175, 80);
            p.rect(centerX - 80, legendY, 10, 10);
            p.fill(0);
            p.textSize(12);
            p.textAlign(p.LEFT);
            p.text(`${steppoStats.wins}V (${steppoStats.winRate}%)`, centerX - 65, legendY + 8);
            
            // Pareggi
            p.fill(255, 193, 7);
            p.rect(centerX - 80, legendY + 20, 10, 10);
            p.fill(0);
            p.text(`${steppoStats.draws}N`, centerX - 65, legendY + 28);
            
            // Sconfitte
            p.fill(244, 67, 54);
            p.rect(centerX + 10, legendY, 10, 10);
            p.fill(0);
            p.text(`${steppoStats.losses}P`, centerX + 25, legendY + 8);
            
            // Punti/partita
            p.fill(0);
            p.textSize(11);
            p.textAlign(p.LEFT);
            p.text(`${steppoStats.pointsPerGame} PPG`, centerX + 10, legendY + 28);
        };
    });
}

// 4. GRAFICO A TORTA PER GUZZO
function createGuzzoPieChart() {
    new p5((p) => {
        p.setup = () => {
            const canvas = p.createCanvas(280, 180);
            canvas.parent('guzzo-chart');
            canvas.style('border-radius', '10px');
            
            // Aggiorna le statistiche nel DOM
            if (guzzoStats && guzzoStats.total > 0) {
                updateDOMStats('guzzo', guzzoStats);
            }
        };
        
        p.draw = () => {
            p.clear();
            
            if (!guzzoStats || guzzoStats.total === 0) {
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.fill(100);
                p.text('Nessun dato disponibile', p.width/2, p.height/2);
                return;
            }
            
            // Titolo
            p.fill(255, 152, 0);
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text('GUZZO', p.width/2, 20);
            
            // Grafico a torta
            const centerX = p.width/2;
            const centerY = p.height/2;
            const radius = 60;
            
            let angle = 0;
            const total = guzzoStats.wins + guzzoStats.draws + guzzoStats.losses;
            
            // Vittorie (verde chiaro)
            if (guzzoStats.wins > 0) {
                const winAngle = p.TWO_PI * (guzzoStats.wins / total);
                p.fill(129, 199, 132, 200);
                p.arc(centerX, centerY, radius * 2, radius * 2, angle, angle + winAngle);
                angle += winAngle;
            }
            
            // Pareggi (giallo chiaro)
            if (guzzoStats.draws > 0) {
                const drawAngle = p.TWO_PI * (guzzoStats.draws / total);
                p.fill(255, 224, 130, 200);
                p.arc(centerX, centerY, radius * 2, radius * 2, angle, angle + drawAngle);
                angle += drawAngle;
            }
            
            // Sconfitte (rosso chiaro)
            if (guzzoStats.losses > 0) {
                const lossAngle = p.TWO_PI * (guzzoStats.losses / total);
                p.fill(239, 154, 154, 200);
                p.arc(centerX, centerY, radius * 2, radius * 2, angle, angle + lossAngle);
            }
            
            // Legenda
            const legendY = centerY + radius + 30;
            
            // Vittorie
            p.fill(129, 199, 132);
            p.rect(centerX - 80, legendY, 10, 10);
            p.fill(0);
            p.textSize(12);
            p.textAlign(p.LEFT);
            p.text(`${guzzoStats.wins}V (${guzzoStats.winRate}%)`, centerX - 65, legendY + 8);
            
            // Pareggi
            p.fill(255, 224, 130);
            p.rect(centerX - 80, legendY + 20, 10, 10);
            p.fill(0);
            p.text(`${guzzoStats.draws}N`, centerX - 65, legendY + 28);
            
            // Sconfitte
            p.fill(239, 154, 154);
            p.rect(centerX + 10, legendY, 10, 10);
            p.fill(0);
            p.text(`${guzzoStats.losses}P`, centerX + 25, legendY + 8);
            
            // Punti/partita
            p.fill(0);
            p.textSize(11);
            p.textAlign(p.LEFT);
            p.text(`${guzzoStats.pointsPerGame} PPG`, centerX + 10, legendY + 28);
        };
    });
}

// 5. GRAFICO DI CONFRONTO (BARRE)
function createComparisonChart() {
    new p5((p) => {
        p.setup = () => {
            const canvas = p.createCanvas(600, 250);
            canvas.parent('comparison-chart');
            canvas.style('border-radius', '10px');
            canvas.style('margin', '20px auto');
            canvas.style('display', 'block');
        };
        
        p.draw = () => {
            p.clear();
            p.background(245);
            
            if (!steppoStats || !guzzoStats || steppoStats.total === 0 || guzzoStats.total === 0) {
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.fill(100);
                p.text('Inserisci dati per il confronto', p.width/2, p.height/2);
                return;
            }
            
            // Titolo
            p.fill(0, 85, 165);
            p.textSize(18);
            p.textAlign(p.CENTER);
            p.text('CONFRONTO STEPPO vs GUZZO', p.width/2, 25);
            
            // Etichette assi
            p.textSize(12);
            p.fill(100);
            p.text('Steppo', 100, p.height - 10);
            p.text('Guzzo', p.width - 100, p.height - 10);
            
            // Valori da confrontare (normalizzati)
            const comparisons = [
                { label: 'Vittorie %', steppo: parseFloat(steppoStats.winRate), guzzo: parseFloat(guzzoStats.winRate), max: 100 },
                { label: 'Punti/Partita', steppo: parseFloat(steppoStats.pointsPerGame), guzzo: parseFloat(guzzoStats.pointsPerGame), max: 3 },
                { label: 'Goal/Partita', steppo: steppoStats.goalsFor / steppoStats.total, guzzo: guzzoStats.goalsFor / guzzoStats.total, max: 3 },
                { label: 'Tiri/Partita', steppo: parseFloat(steppoStats.avgShotsFor), guzzo: parseFloat(guzzoStats.avgShotsFor), max: 20 },
                { label: 'Corner/Partita', steppo: parseFloat(steppoStats.avgCornersFor), guzzo: parseFloat(guzzoStats.avgCornersFor), max: 10 }
            ];
            
            const barWidth = 30;
            const spacing = 120;
            const baseY = p.height - 40;
            const maxBarHeight = 150;
            
            for (let i = 0; i < comparisons.length; i++) {
                const x = 150 + i * spacing;
                const comp = comparisons[i];
                
                // Calcola altezze barre (normalizzate)
                const steppoHeight = (comp.steppo / comp.max) * maxBarHeight;
                const guzzoHeight = (comp.guzzo / comp.max) * maxBarHeight;
                
                // Disegna barre
                p.fill(76, 175, 80, 200);
                p.rect(x - 40, baseY - steppoHeight, barWidth, steppoHeight);
                
                p.fill(255, 152, 0, 200);
                p.rect(x + 40, baseY - guzzoHeight, barWidth, guzzoHeight);
                
                // Valori numerici
                p.fill(0);
                p.textSize(10);
                p.textAlign(p.CENTER);
                p.text(comp.steppo.toFixed(1), x - 25, baseY - steppoHeight - 5);
                p.text(comp.guzzo.toFixed(1), x + 55, baseY - guzzoHeight - 5);
                
                // Etichetta metrica
                p.textSize(11);
                p.fill(80);
                p.text(comp.label, x, baseY + 15);
                
                // Linea base
                p.stroke(200);
                p.strokeWeight(1);
                p.line(x - 60, baseY, x + 80, baseY);
                p.noStroke();
            }
        };
    });
}

// 6. TIMELINE DELLE PARTITE
function createTimelineChart() {
    new p5((p) => {
        let matches = [];
        
        p.setup = () => {
            const canvas = p.createCanvas(600, 150);
            canvas.parent('timeline-chart');
            canvas.style('border-radius', '10px');
            canvas.style('margin', '20px auto');
            canvas.style('display', 'block');
            
            // Combina e ordina tutte le partite per data
            matches = [...dataset]
                .filter(m => m.Tifoso === 'Steppo' || m.Tifoso === 'Guzzo')
                .sort((a, b) => {
                    const dateA = parseDate(a.Date);
                    const dateB = parseDate(b.Date);
                    return dateA - dateB;
                });
        };
        
        p.draw = () => {
            p.clear();
            p.background(245);
            
            if (matches.length === 0) return;
            
            // Titolo
            p.fill(0, 85, 165);
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text('TIMELINE DELLE PRESENZE', p.width/2, 20);
            
            const margin = 50;
            const timelineWidth = p.width - 2 * margin;
            const timelineY = p.height / 2;
            
            // Linea timeline
            p.stroke(200);
            p.strokeWeight(2);
            p.line(margin, timelineY, p.width - margin, timelineY);
            
            // Prima e ultima data
            const firstMatch = matches[0];
            const lastMatch = matches[matches.length - 1];
            
            p.textSize(10);
            p.fill(100);
            p.text(firstMatch.Date, margin, timelineY + 20);
            p.text(lastMatch.Date, p.width - margin - 40, timelineY + 20);
            
            // Punti sulla timeline
            matches.forEach((match, index) => {
                const date = parseDate(match.Date);
                const firstDate = parseDate(firstMatch.Date);
                const lastDate = parseDate(lastMatch.Date);
                
                const x = margin + ((date - firstDate) / (lastDate - firstDate)) * timelineWidth;
                const y = timelineY;
                
                // Colore in base al risultato e chi era presente
                let color;
                let size = 8;
                
                // Determina risultato per il Como
                const isComoHome = match.HomeTeam === 'Como';
                let result;
                if (match.FTR === 'D') {
                    result = 'draw';
                } else if ((match.FTR === 'H' && isComoHome) || (match.FTR === 'A' && !isComoHome)) {
                    result = 'win';
                } else {
                    result = 'loss';
                }
                
                if (match.Tifoso === 'Steppo') {
                    if (result === 'win') {
                        color = p.color(76, 175, 80); // Verde
                        size = 10;
                    } else if (result === 'draw') {
                        color = p.color(255, 193, 7); // Giallo
                    } else {
                        color = p.color(244, 67, 54); // Rosso
                    }
                } else { // Guzzo
                    if (result === 'win') {
                        color = p.color(129, 199, 132); // Verde chiaro
                    } else if (result === 'draw') {
                        color = p.color(255, 224, 130); // Giallo chiaro
                    } else {
                        color = p.color(239, 154, 154); // Rosso chiaro
                        size = 10;
                    }
                }
                
                // Disegna punto
                p.fill(color);
                p.noStroke();
                p.ellipse(x, y, size, size);
                
                // Linea al punto
                p.stroke(color);
                p.strokeWeight(1);
                p.line(x, y - 15, x, y - 3);
                
                // Tooltip al passaggio del mouse
                if (p.dist(p.mouseX, p.mouseY, x, y) < 10) {
                    p.fill(0, 0, 0, 200);
                    p.noStroke();
                    p.rect(p.mouseX + 5, p.mouseY - 40, 120, 35, 3);
                    
                    p.fill(255);
                    p.textSize(10);
                    p.textAlign(p.LEFT);
                    p.text(`${match.HomeTeam} ${match.FTHG}-${match.FTAG} ${match.AwayTeam}`, p.mouseX + 10, p.mouseY - 25);
                    p.text(`Con: ${match.Tifoso}`, p.mouseX + 10, p.mouseY - 10);
                }
            });
            
            // Legenda
            const legendY = p.height - 20;
            p.textSize(10);
            
            p.fill(76, 175, 80);
            p.ellipse(100, legendY, 8, 8);
            p.fill(0);
            p.text('Steppo - Vittoria', 110, legendY + 4);
            
            p.fill(255, 152, 0);
            p.ellipse(250, legendY, 8, 8);
            p.fill(0);
            p.text('Guzzo - Vittoria', 260, legendY + 4);
            
            p.fill(244, 67, 54);
            p.ellipse(400, legendY, 8, 8);
            p.fill(0);
            p.text('Sconfitta', 410, legendY + 4);
        };
        
        function parseDate(dateStr) {
            const parts = dateStr.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
        }
    });
}

// 7. FUNZIONE PER AGGIORNARE IL DOM
function updateDOMStats(player, stats) {
    const prefix = player.toLowerCase();
    
    document.getElementById(`${prefix}-total`).textContent = stats.total;
    document.getElementById(`${prefix}-wins`).textContent = stats.wins;
    document.getElementById(`${prefix}-draws`).textContent = stats.draws;
    document.getElementById(`${prefix}-losses`).textContent = stats.losses;
    document.getElementById(`${prefix}-goals-for`).textContent = stats.goalsFor;
    document.getElementById(`${prefix}-goals-against`).textContent = stats.goalsAgainst;
    document.getElementById(`${prefix}-win-rate`).textContent = `${stats.winRate}%`;
    document.getElementById(`${prefix}-ppg`).textContent = stats.pointsPerGame;
}

// 8. AGGIUNGI IL DIV PER I NUOVI GRAFICI AL TUO HTML
/*
    Aggiungi queste righe nel tuo HTML, dopo la sezione quiz:
    
    <div class="extra-charts">
        <div class="chart-container-large">
            <h3>Confronto Dettagliato</h3>
            <div id="comparison-chart"></div>
        </div>
        <div class="chart-container-large">
            <h3>Timeline Presenze</h3>
            <div id="timeline-chart"></div>
        </div>
    </div>
    
    E aggiungi questi stili:
    .extra-charts {
        grid-column: span 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 30px;
    }
    .chart-container-large {
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.08);
    }
*/

// INIZIALIZZA TUTTO QUANDO LA PAGINA È PRONTA
window.addEventListener('DOMContentLoaded', initP5Charts);