// ══════════════════════════════════════════════════════
//  DATA LOADING & PARSING
// ══════════════════════════════════════════════════════

let csvData = [];
let yearsByPhase = {};

function parseCSV(rawText) {
  const lines = rawText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  csvData = lines.slice(1).map(line => {
    // Simple CSV parsing - split by comma but handle quoted fields
    let values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      let char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    const row = {};
    headers.forEach((h, i) => {
      let val = values[i] ? values[i].trim() : '';
      // Clean up quotes
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      row[h] = val;
    });
    return row;
  });
  
  // Group by phase and extract years
  csvData.forEach(row => {
    const phase = row.stage;
    const year = parseInt(row.year);
    if (!yearsByPhase[phase]) yearsByPhase[phase] = [];
    yearsByPhase[phase].push(year);
  });
  
  console.log('📊 Data loaded:', csvData.length, 'records');
  console.log('📅 Phases:', Object.keys(yearsByPhase));
}

function getDataForYear(year) {
  return csvData.find(row => parseInt(row.year) === year);
}

function getPhaseData(phaseName) {
  return csvData.filter(row => row.stage === phaseName);
}

function getColorForPhase(phaseName, saturation = 1) {
  // Map phase name to number: "FASE 1" -> 1
  const phaseNum = parseInt(phaseName.replace('FASE ', ''));
  
  const phaseColors = {
    1: { r: 140, g: 190, b: 130 }, // Verde
    2: { r: 200, g: 175, b: 120 }, // Amarillo
    3: { r: 180, g: 120, b: 100 }, // Marrón
    4: { r: 100, g: 60, b: 40 }    // Marrón oscuro
  };
  
  const color = phaseColors[phaseNum];
  if (!color) return [255, 255, 255];
  
  // Desaturate based on saturation parameter (0-1)
  const r = color.r;
  const g = color.g;
  const b = color.b;
  
  const gray = (r + g + b) / 3;
  const finalR = gray + (r - gray) * saturation;
  const finalG = gray + (g - gray) * saturation;
  const finalB = gray + (b - gray) * saturation;
  
  return [finalR, finalG, finalB];
}

