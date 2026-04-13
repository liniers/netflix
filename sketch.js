// ══════════════════════════════════════════════════════
//  NETFLIX DATA VISUALIZATION
// ══════════════════════════════════════════════════════

// ── PHASE 1 CONFIG (1997-2006) ───────────────────────
const PHASE_1_YEARS   = [1997, 2000, 2001, 2002, 2003, 2004, 2005, 2006];
const PHASE_1_START   = 1997;
const PHASE_1_END     = 2006;
const PHASE_1_NAME    = 'Bueno para los usuarios';

// ── PHASE 2 CONFIG (2007-2013) ───────────────────────
const PHASE_2_YEARS   = [2007, 2008, 2009, 2010, 2011, 2012, 2013];
const PHASE_2_START   = 2007;
const PHASE_2_END     = 2013;
const PHASE_2_NAME    = 'Bueno para los negocios';

// ── PHASE 3 CONFIG (2014-2021) ───────────────────────
const PHASE_3_YEARS   = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];
const PHASE_3_START   = 2014;
const PHASE_3_END     = 2021;
const PHASE_3_NAME    = 'Apoderarse de todo el valor';

// ── PHASE 4 CONFIG (2022-2025) ───────────────────────
const PHASE_4_YEARS   = [2022, 2023, 2024, 2025];
const PHASE_4_START   = 2022;
const PHASE_4_END     = 2025;
const PHASE_4_NAME    = 'Una mierda gigante';

// ── PHASE COLORS (RGB) ──────────────────────────────
const PHASE_COLORS = {
  1: { r: 114, g: 141, b: 59 }, // Verde
  2: { r: 200, g: 175, b: 120 }, // Amarillo
  3: { r: 180, g: 120, b: 100 }, // Marrón
  4: { r: 100, g: 60, b: 40 }    // Marrón oscuro
};

// ── PHYSICS CONFIG ───────────────────────────────────
const GRAVITY       = 0;
const CENTER_ATTRACTION = 0.12;
const ORBIT_DISTANCE = 200;
const AIR_DRAG      = 0.90;
const OVERLAP_ALLOW = 0.8;
const SEPARATION_FORCE = 0.75;
const SEPARATION_ITERS = 10;

// ── BLOB CONFIG ──────────────────────────────────────
const BLOB_SIZE     = 25;
// Rango acumulativo de blobs por fase (aumenta conforme avanzan las fases)
const MAX_BLOBS_RANGES = {
  1: [50, 150],    // Fase 1: 50-150
  2: [150, 300],   // Fase 2: 150-300
  3: [300, 600],   // Fase 3: 300-600
  4: [600, 1000]   // Fase 4: 600-1000
};

// ── DEFORMATION CONFIG ───────────────────────────────
const PUSH_FACTOR   = 0.75;
const DEFORM_ZONE   = 0.8;
const SQUISH_SPREAD = 1.10;
const STRETCH_SPEED = 10.0;
const STRETCH_MAX   = 0.5;
const STRETCH_X     = 0.3;
const STRETCH_Y     = 0.18;

// ── WOBBLE & JIGGLE ──────────────────────────────────
const WOBBLE_AMP    = 0.08;
const WOBBLE_SPEED  = 0.025;
const JIGGLE_DECAY  = 0.92;
const JIGGLE_AMP    = 0.03;
const SHAPE_IRREGULARITY = 0.08;

// ── DRAG & THROW ─────────────────────────────────────
const DRAG_STIFFNESS = 0.18;
const DRAG_DAMPING   = 0.7;
const THROW_MULT     = 3.0;

// ── VISUAL ───────────────────────────────────────────
const BG_COLOR       = [0, 0, 0];
const FILL_ALPHA     = 200;
const STROKE_ALPHA   = 150;
const STROKE_WEIGHT_VAL = 1.5;
const STROKE_DARKEN  = 0.75;
const NUM_VERTS      = 30;

// ── FLIES CONFIG ─────────────────────────────────────
const FLY_CONFIGS = {
  3: { count: 40, color: [0, 0, 0] },
  4: { count: 60, color: [0, 0, 0] }  
};
const FLY_SIZE = 2.5;
const FLY_MIN_RADIUS = 2;
const FLY_MAX_RADIUS = 4;
const FLY_ORBIT_DISTANCE = 350; 
const FLY_ORBIT_SPEED = 0.2;
const FLY_MOUSE_ATTRACTION = 0.15;
const FLY_MOUSE_RANGE = 80; 
const FLY_DRAG = 0.92;

// ── STATE ────────────────────────────────────────────
let blobs = [];
let flies = [];
let dragging = null;
let dragOffset = null;
let prevMouse = null;
let throwVel = null;
let currentYear = PHASE_1_START;
let animatedSubscribers = 0;
let animatedRevenue = 0;
let currentPhase = 1;
let currentPhaseYears = PHASE_1_YEARS;
let csvRawLines;

// ══════════════════════════════════════════════════════
//  DATA → BLOBS mapping
// ══════════════════════════════════════════════════════

function preload() {
  csvRawLines = loadStrings('assets/data.csv');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  parseCSV(csvRawLines.join('\n'));

  const timeline = document.getElementById('timeline');
  PHASE_1_YEARS.forEach(year => {
    let yearDiv = document.createElement('div');
    yearDiv.className = 'year';
    yearDiv.textContent = year;
    yearDiv.setAttribute('data-year', year);
    timeline.appendChild(yearDiv);
  });

  updateFliesForPhase();
  updatePhaseButtons();

  document.getElementById('prevPhaseBtn').addEventListener('click', () => {
    if (currentPhase > 1) transitionToPhase(currentPhase - 1);
  });

  document.getElementById('nextPhaseBtn').addEventListener('click', () => {
    const targetPhase = currentPhase + 1;
    if (targetPhase <= 4) {
      showScreen({
        textFile: `assets/textos/fase${targetPhase}.md`,
        videoFile: `assets/videos/fase${targetPhase}.mp4`,
        btnText: 'Ver datos',
        onBtn: () => transitionToPhase(targetPhase)
      });
    } else {
      showScreen({
        textFile: 'assets/textos/final.md',
        btnText: 'Ver créditos',
        onBtn: () => showScreen({
          textFile: 'assets/textos/creditos.md',
          btnText: 'Volver al inicio',
          onBtn: () => {
            transitionToPhase(1);
            showHomepage();
          }
        })
      });
    }
  });

  document.getElementById('homepagePlayBtn').addEventListener('click', () => {
    hideHomepage();
    showScreen({
      textFile: 'assets/textos/fase1.md',
      videoFile: 'assets/videos/fase1.mp4',
      btnText: 'Ver datos'
    });
  });

  // Pantalla de inicio: espera click para garantizar audio en tudum
  document.getElementById('startScreen').addEventListener('click', () => {
    document.getElementById('startScreen').classList.remove('active');
    initTudum();
  }, { once: true });
  document.getElementById('startScreen').classList.add('active');
}

// ══════════════════════════════════════════════════════
//  DRAW LOOP
// ══════════════════════════════════════════════════════

function draw() {
  background(...BG_COLOR);

  // Update year based on mouseX 
  let normalizedX = constrain(mouseX / width, 0, 1);
  let indexInPhase = normalizedX * (currentPhaseYears.length - 1);
  let yearIndex = round(indexInPhase);
  currentYear = currentPhaseYears[yearIndex];
  
  updateUIElements();
  updateBlobsForYear();
  
  // Physics & rendering
  let centerX = width / 2;
  let centerY = height / 2;
  
  if (dragging) {
    let target = createVector(mouseX + dragOffset.x, mouseY + dragOffset.y);
    let force = p5.Vector.sub(target, dragging.pos).mult(DRAG_STIFFNESS);
    dragging.vel.add(force);
    dragging.vel.mult(DRAG_DAMPING);
    if (prevMouse) throwVel = createVector(mouseX - prevMouse.x, mouseY - prevMouse.y);
    prevMouse = createVector(mouseX, mouseY);
    dragging.jiggle = lerp(dragging.jiggle, (throwVel ? throwVel.mag() : 0) * 0.06, 0.3);
  }

  // Apply center attraction to all blobs
  for (let b of blobs) {
    let dx = centerX - b.pos.x;
    let dy = centerY - b.pos.y;
    let d = sqrt(dx * dx + dy * dy);
    
    if (d > 0.1) {
      let nx = dx / d;
      let ny = dy / d;
      b.vel.x += nx * CENTER_ATTRACTION;
      b.vel.y += ny * CENTER_ATTRACTION;
    }
    
    b.vel.y += GRAVITY;
    b.vel.mult(AIR_DRAG);
    b.pos.add(b.vel);
    b.constrainToWalls();
  }

  // Separation
  for (let iter = 0; iter < SEPARATION_ITERS; iter++) {
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        separateBlobs(blobs[i], blobs[j]);
      }
    }
  }

  for (let b of blobs) b.computeVertices();

  // Deform
  for (let i = 0; i < blobs.length; i++) {
    let bi = blobs[i];
    for (let j = 0; j < blobs.length; j++) {
      if (i === j) continue;
      let bj = blobs[j];
      let d = dist(bi.pos.x, bi.pos.y, bj.pos.x, bj.pos.y);
      if (d < bi.radius + bj.radius * 1.1) {
        deformAgainst(bi, bj);
      }
    }
    deformAgainstFloor(bi);
    deformAgainstWalls(bi);
  }

  for (let b of blobs) {
    b.display();
    b.jiggle *= JIGGLE_DECAY;
    b.wobblePhase += WOBBLE_SPEED;
  }

  // Update and render flies
  for (let fly of flies) {
    // Assign to nearest blob if not assigned
    if (!fly.targetBlob && blobs.length > 0) {
      let minDist = Infinity;
      for (let blob of blobs) {
        let d = dist(fly.pos.x, fly.pos.y, blob.pos.x, blob.pos.y);
        if (d < minDist) {
          minDist = d;
          fly.targetBlob = blob;
        }
      }
    }
    
    // Update orbit around target blob
    if (fly.targetBlob) {
      fly.updateOrbit(fly.targetBlob);
    }
    
    // Check mouse attraction
    fly.checkMouseAttraction();
    
    // Constrain to walls
    fly.constrainToWalls();
    
    // Render
    fly.display();
  }

  cursor(dragging ? 'grabbing' : 'default');
}

// ══════════════════════════════════════════════════════
//  UI UPDATES
// ══════════════════════════════════════════════════════

function updateUIElements() {
  let data = getDataForYear(currentYear);
  if (!data) return;

  // Update timeline highlight
  currentPhaseYears.forEach((year, idx) => {
    let element = document.querySelector(`[data-year="${year}"]`);
    if (element) {
      if (year === currentYear) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    }
  });

  // Update text content
  document.getElementById('hito').textContent = data.hito || `Año ${currentYear}`;
  document.getElementById('descripcion').textContent = data.descripcion || '';

  // Animate counters
  let subscribers = parseFloat(data.subscribers) * 1_000_000;
  let revenue = parseFloat(data.revenue.replace(/,/g, '')) * 1_000_000;
  
  animatedSubscribers += (subscribers - animatedSubscribers) * 0.1;
  animatedRevenue += (revenue - animatedRevenue) * 0.1;
  
  document.getElementById('subscribersValue').textContent = 
    (animatedSubscribers / 1_000_000).toFixed(1) + 'M';
  document.getElementById('revenueValue').textContent = 
    '$' + (animatedRevenue / 1_000_000).toFixed(0) + 'M';
}

// ══════════════════════════════════════════════════════
//  BLOB UPDATES
// ══════════════════════════════════════════════════════

function updateBlobsForYear() {
  let data = getDataForYear(currentYear);
  if (!data) return;

  // Target count based on subscriber scaling
  let subscribers = parseFloat(data.subscribers);
  let maxYear = currentPhaseYears[currentPhaseYears.length - 1];
  let maxSubscribers = parseFloat(getDataForYear(maxYear).subscribers);
  let ratio = subscribers / maxSubscribers;
  
  let range = MAX_BLOBS_RANGES[currentPhase];
  let targetCount = round(lerp(range[0], range[1], ratio));
  
  // Adjust blob count
  while (blobs.length < targetCount) {
    let centerX = width / 2;
    let centerY = height / 2;
    let angle = random(TWO_PI);
    let dist = random(0, ORBIT_DISTANCE);
    let x = centerX + cos(angle) * dist;
    let y = centerY + sin(angle) * dist;
    
    // Fase 1 siempre con saturación completa (saturation = 1)
    // Fases 2-4 desaturadas progresivamente
    let saturation;
    if (currentPhase === 1) {
      saturation = 1.0;  // Sin desaturación
    } else if (currentPhase === 2) {
      saturation = 1;
    } else if (currentPhase === 3) {
      saturation = 1;
    } else {
      saturation = 1;  // Fase 4 más desaturada
    }
    let color = getColorForPhase(data.stage, saturation);
    let r = BLOB_SIZE * random(0.65, 1.35); 
    r = constrain(r, 6, BLOB_SIZE);
    blobs.push(new Blob(x, y, r, color)); 
  }
  
  while (blobs.length > targetCount) {
    blobs.pop();
  }
}

function updateFliesForPhase() {
  // Moscas solo aparecen a partir de fase 3
  let targetCount = 0;
  let color = [0, 0, 0];
  
  if (currentPhase >= 3 && FLY_CONFIGS[currentPhase]) {
    targetCount = FLY_CONFIGS[currentPhase].count;
    color = FLY_CONFIGS[currentPhase].color;
  }
  
  // Adjust fly count
  while (flies.length < targetCount) {
    let centerX = width / 2;
    let centerY = height / 2;
    let angle = random(TWO_PI);
    let dist = random(0, FLY_ORBIT_DISTANCE);
    let x = centerX + cos(angle) * dist;
    let y = centerY + sin(angle) * dist;
    
    flies.push(new Fly(x, y, color));
  }
  
  while (flies.length > targetCount) {
    flies.pop();
  }
}

// ══════════════════════════════════════════════════════
//  PHASE TRANSITIONS
// ══════════════════════════════════════════════════════

function getPhaseNameByNumber(phaseNum) {
  const names = {
    1: PHASE_1_NAME,
    2: PHASE_2_NAME,
    3: PHASE_3_NAME,
    4: PHASE_4_NAME
  };
  return names[phaseNum] || 'Unknown';
}

function updatePhaseButtons() {
  const prevBtn = document.getElementById('prevPhaseBtn');
  const nextBtn = document.getElementById('nextPhaseBtn');
  prevBtn.classList.toggle('hidden', currentPhase <= 1);
  nextBtn.classList.remove('hidden');
  nextBtn.textContent = currentPhase >= 4 ? 'Ver final →' : 'Siguiente fase →';
}

// ══════════════════════════════════════════════════════
//  TUDUM SPLASH
// ══════════════════════════════════════════════════════

function initTudum() {
  const screen = document.getElementById('tudumScreen');
  const video  = document.getElementById('tudumVideo');

  video.src = 'assets/videos/tudum.mp4';
  video.muted = false;

  video.addEventListener('ended', () => {
    screen.classList.remove('active');
    showHomepage();
  }, { once: true });

  screen.classList.add('active');
  video.play();
}

// ══════════════════════════════════════════════════════
//  HOMEPAGE
// ══════════════════════════════════════════════════════

const HOMEPAGE_VIDEOS = [
  'assets/videos/fase1.mp4',
  'assets/videos/fase2.mp4',
  'assets/videos/fase3.mp4',
  'assets/videos/fase4.mp4'
];
let homepageVideoIndex = 0;
let homepageVideoInterval = null;

function cycleHomepageVideo() {
  const video = document.getElementById('homepageVideo');
  video.src = HOMEPAGE_VIDEOS[homepageVideoIndex % HOMEPAGE_VIDEOS.length];
  homepageVideoIndex++;
  video.play().catch(() => {});
}

function showHomepage() {
  const screen = document.getElementById('homepageScreen');

  homepageVideoIndex = 0;
  cycleHomepageVideo();
  clearInterval(homepageVideoInterval);
  homepageVideoInterval = setInterval(cycleHomepageVideo, 4000);

  fetch('assets/textos/Intro.md')
    .then(r => r.text())
    .then(md => {
      const lines = md.trim().split('\n');
      let title = '', tags = '', desc = '';
      for (const line of lines) {
        const t = line.trim();
        if (!title && t.startsWith('## ')) { title = t.replace(/^## /, ''); }
        else if (!tags && t.startsWith('### ')) { tags = t.replace(/^### /, ''); }
        else if (t && !t.startsWith('#')) { desc += (desc ? ' ' : '') + t; }
      }
      document.getElementById('homepageTitle').textContent = title;
      document.getElementById('homepageTags').textContent  = tags;
      document.getElementById('homepageDesc').textContent  = desc;
    })
    .catch(() => {});

  screen.classList.add('active');
}

function hideHomepage() {
  clearInterval(homepageVideoInterval);
  document.getElementById('homepageVideo').pause();
  document.getElementById('homepageScreen').classList.remove('active');
}

// ══════════════════════════════════════════════════════
//  INTRO SCREEN
// ══════════════════════════════════════════════════════

function showScreen({ textFile, videoFile = null, btnText = 'Ver datos', onBtn = null }) {
  const screen  = document.getElementById('introScreen');
  const video   = document.getElementById('introVideo');
  const titleEl = document.getElementById('introTitle');
  const bodyEl  = document.getElementById('introBody');
  const btn     = document.getElementById('introBtn');

  btn.textContent = btnText;
  btn.onclick = () => {
    video.pause();
    screen.classList.remove('active');
    if (onBtn) onBtn();
  };

  titleEl.textContent = '';
  bodyEl.innerHTML = '';

  fetch(textFile)
    .then(r => r.text())
    .then(md => {
      const lines = md.trim().split('\n');
      let title = '';
      const bodyLines = [];

      for (const line of lines) {
        if (!title && line.startsWith('##')) {
          title = line.replace(/^#+\s*/, '').trim();
        } else {
          bodyLines.push(line);
        }
      }

      titleEl.textContent = title;

      let html = '';
      let inList = false;
      for (const line of bodyLines) {
        const trimmed = line.trim();
        if (!trimmed) {
          if (inList) { html += '</ul>'; inList = false; }
          continue;
        }
        if (trimmed.startsWith('- ')) {
          if (!inList) { html += '<ul>'; inList = true; }
          html += `<li>${trimmed.slice(2)}</li>`;
        } else {
          if (inList) { html += '</ul>'; inList = false; }
          html += `<p>${trimmed}</p>`;
        }
      }
      if (inList) html += '</ul>';
      bodyEl.innerHTML = html;
    })
    .catch(() => {});

  if (videoFile) {
    video.src = videoFile;
    video.style.display = 'block';
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  } else {
    video.pause();
    video.src = '';
    video.style.display = 'none';
  }

  screen.classList.add('active');
}

function transitionToPhase(phaseNumber) {
  currentPhase = phaseNumber;

  if (phaseNumber === 1) {
    currentPhaseYears = PHASE_1_YEARS;
    currentYear = PHASE_1_START;
  } else if (phaseNumber === 2) {
    currentPhaseYears = PHASE_2_YEARS;
    currentYear = PHASE_2_START;
  } else if (phaseNumber === 3) {
    currentPhaseYears = PHASE_3_YEARS;
    currentYear = PHASE_3_START;
  } else if (phaseNumber === 4) {
    currentPhaseYears = PHASE_4_YEARS;
    currentYear = PHASE_4_START;
  }
  
  // Rebuild timeline
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  currentPhaseYears.forEach(year => {
    let yearDiv = document.createElement('div');
    yearDiv.className = 'year';
    yearDiv.textContent = year;
    yearDiv.setAttribute('data-year', year);
    timeline.appendChild(yearDiv);
  });
  
  // Update flies for this phase
  updateFliesForPhase();

  updatePhaseButtons();
}

// ══════════════════════════════════════════════════════
//  PHYSICS
// ══════════════════════════════════════════════════════

function separateBlobs(a, b) {
  let dx = b.pos.x - a.pos.x;
  let dy = b.pos.y - a.pos.y;
  let d = sqrt(dx * dx + dy * dy);
  let minDist = (a.radius + b.radius) * OVERLAP_ALLOW;

  if (d < minDist && d > 0.01) {
    let nx = dx / d;
    let ny = dy / d;
    let overlap = minDist - d;
    let totalR = a.radius + b.radius;

    a.pos.x -= nx * overlap * (b.radius / totalR) * SEPARATION_FORCE;
    a.pos.y -= ny * overlap * (b.radius / totalR) * SEPARATION_FORCE;
    b.pos.x += nx * overlap * (a.radius / totalR) * SEPARATION_FORCE;
    b.pos.y += ny * overlap * (a.radius / totalR) * SEPARATION_FORCE;

    let relVelDot = (a.vel.x - b.vel.x) * nx + (a.vel.y - b.vel.y) * ny;
    if (relVelDot > 0) {
      let impulse = relVelDot * 0.6;
      a.vel.x -= nx * impulse * (b.radius / totalR);
      a.vel.y -= ny * impulse * (b.radius / totalR);
      b.vel.x += nx * impulse * (a.radius / totalR);
      b.vel.y += ny * impulse * (a.radius / totalR);
    }

    a.jiggle = max(a.jiggle, abs(relVelDot) * 0.03);
    b.jiggle = max(b.jiggle, abs(relVelDot) * 0.03);
  }
}

// ══════════════════════════════════════════════════════
//  DEFORMATION
// ══════════════════════════════════════════════════════

function deformAgainst(blobA, blobB) {
  let cx = blobB.pos.x;
  let cy = blobB.pos.y;
  let rB = blobB.radius * DEFORM_ZONE;

  for (let i = 0; i < blobA.numVerts; i++) {
    let vx = blobA.worldVx[i];
    let vy = blobA.worldVy[i];
    let dx = vx - cx;
    let dy = vy - cy;
    let d = sqrt(dx * dx + dy * dy);

    if (d < rB) {
      let nx = dx / max(d, 0.1);
      let ny = dy / max(d, 0.1);
      blobA.worldVx[i] = lerp(vx, cx + nx * rB, PUSH_FACTOR);
      blobA.worldVy[i] = lerp(vy, cy + ny * rB, PUSH_FACTOR);
    }
  }
}

function deformAgainstFloor(blob) {
  for (let i = 0; i < blob.numVerts; i++) {
    if (blob.worldVy[i] > height - 2) {
      blob.worldVy[i] = height - 2;
      let dx = blob.worldVx[i] - blob.pos.x;
      blob.worldVx[i] = blob.pos.x + dx * SQUISH_SPREAD;
    }
  }
}

function deformAgainstWalls(blob) {
  for (let i = 0; i < blob.numVerts; i++) {
    if (blob.worldVx[i] < 2) {
      blob.worldVx[i] = 2;
      let dy = blob.worldVy[i] - blob.pos.y;
      blob.worldVy[i] = blob.pos.y + dy * SQUISH_SPREAD;
    }
    if (blob.worldVx[i] > width - 2) {
      blob.worldVx[i] = width - 2;
      let dy = blob.worldVy[i] - blob.pos.y;
      blob.worldVy[i] = blob.pos.y + dy * SQUISH_SPREAD;
    }
  }
}

// ══════════════════════════════════════════════════════
//  SMOOTH SHAPE GENERATION
// ══════════════════════════════════════════════════════

function generateSmoothOffsets(numVerts, magnitude) {
  let offsets = new Array(numVerts).fill(0);
  let numH = int(random(3, 5));
  for (let h = 0; h < numH; h++) {
    let freq = int(random(1, 4));
    let amp = random(magnitude * 0.4, magnitude);
    let phase = random(TWO_PI);
    for (let i = 0; i < numVerts; i++) {
      offsets[i] += sin(TWO_PI * i / numVerts * freq + phase) * amp;
    }
  }
  let mx = 0;
  for (let o of offsets) mx = max(mx, abs(o));
  if (mx > 0) for (let i = 0; i < numVerts; i++) offsets[i] *= magnitude / mx;
  return offsets;
}

// ══════════════════════════════════════════════════════
//  BLOB CLASS
// ══════════════════════════════════════════════════════

class Blob {
  constructor(x, y, r, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-2, 0));
    this.radius = r;
    this.col = col;
    this.numVerts = NUM_VERTS;
    this.wobblePhase = random(TWO_PI);
    this.jiggle = 0;
    this.baseOffsets = generateSmoothOffsets(this.numVerts, SHAPE_IRREGULARITY);
    this.worldVx = new Array(this.numVerts);
    this.worldVy = new Array(this.numVerts);
  }

  constrainToWalls() {
    if (this.pos.y + this.radius > height) {
      this.pos.y = height - this.radius;
      this.vel.y *= -0.2;
      this.vel.x *= 0.92;
    }
    if (this.pos.y - this.radius < 0) {
      this.pos.y = this.radius;
      this.vel.y *= -0.2;
      this.vel.x *= 0.92;
    }
    if (this.pos.x - this.radius < 0) {
      this.pos.x = this.radius;
      this.vel.x *= -0.25;
    }
    if (this.pos.x + this.radius > width) {
      this.pos.x = width - this.radius;
      this.vel.x *= -0.25;
    }
  }

  computeVertices() {
    let speed = this.vel.mag();
    let velAngle = atan2(this.vel.y, this.vel.x);
    let deform = min(speed / STRETCH_SPEED, STRETCH_MAX);
    let sx = 1 + deform * STRETCH_X;
    let sy = 1 - deform * STRETCH_Y;
    let cosV = cos(-velAngle), sinV = sin(-velAngle);
    let cosV2 = cos(velAngle), sinV2 = sin(velAngle);

    for (let i = 0; i < this.numVerts; i++) {
      let a = TWO_PI * i / this.numVerts;
      let r = this.radius * (1
        + this.baseOffsets[i]
        + sin(a * 2 + this.wobblePhase) * WOBBLE_AMP
        + sin(a * 3 + frameCount * 0.25) * this.jiggle * JIGGLE_AMP
      );

      let lx = cos(a) * r;
      let ly = sin(a) * r;

      let rx = lx * cosV - ly * sinV;
      let ry = lx * sinV + ly * cosV;
      rx *= sx; ry *= sy;
      lx = rx * cosV2 - ry * sinV2;
      ly = rx * sinV2 + ry * cosV2;

      this.worldVx[i] = this.pos.x + lx;
      this.worldVy[i] = this.pos.y + ly;
    }
  }

  display() {
    let [cr, cg, cb] = this.col;
    let nv = this.numVerts;

    let svx = new Array(nv), svy = new Array(nv);
    for (let i = 0; i < nv; i++) {
      let p = (i - 1 + nv) % nv, n = (i + 1) % nv;
      svx[i] = this.worldVx[i] * 0.5 + this.worldVx[p] * 0.25 + this.worldVx[n] * 0.25;
      svy[i] = this.worldVy[i] * 0.5 + this.worldVy[p] * 0.25 + this.worldVy[n] * 0.25;
    }

    noStroke();
    fill(cr, cg, cb, FILL_ALPHA);
    beginShape();
    for (let i = -3; i <= nv + 2; i++) {
      let idx = ((i % nv) + nv) % nv;
      curveVertex(svx[idx], svy[idx]);
    }
    endShape(CLOSE);

    noFill();
    stroke(cr * STROKE_DARKEN, cg * STROKE_DARKEN, cb * STROKE_DARKEN, STROKE_ALPHA);
    strokeWeight(STROKE_WEIGHT_VAL);
    beginShape();
    for (let i = -3; i <= nv + 2; i++) {
      let idx = ((i % nv) + nv) % nv;
      curveVertex(svx[idx], svy[idx]);
    }
    endShape(CLOSE);
  }
}

// ══════════════════════════════════════════════════════
//  INTERACTION
// ══════════════════════════════════════════════════════

function mousePressed() {
  for (let i = blobs.length - 1; i >= 0; i--) {
    let b = blobs[i];
    if (dist(mouseX, mouseY, b.pos.x, b.pos.y) < b.radius * 1.3) {
      dragging = b;
      dragOffset = createVector(b.pos.x - mouseX, b.pos.y - mouseY);
      prevMouse = createVector(mouseX, mouseY);
      throwVel = createVector(0, 0);
      return;
    }
  }
}

function mouseReleased() {
  if (dragging && throwVel) {
    dragging.vel.set(throwVel.x * THROW_MULT, throwVel.y * THROW_MULT);
    dragging.jiggle = min(throwVel.mag() * 0.3, 5);
  }
  dragging = null;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ══════════════════════════════════════════════════════
//  FLY CLASS
// ══════════════════════════════════════════════════════

class Fly {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.radius = random(FLY_MIN_RADIUS, FLY_MAX_RADIUS);
    this.color = color;
    this.targetBlob = null;
    this.orbitAngle = random(TWO_PI);
    this.orbitRadius = random(40, FLY_ORBIT_DISTANCE);
    this.isAttractedToMouse = false;
  }

  updateOrbit(blob) {
    if (!blob) return;
    
    // Orbital motion
    this.orbitAngle += FLY_ORBIT_SPEED;
    let orbitX = blob.pos.x + cos(this.orbitAngle) * this.orbitRadius;
    let orbitY = blob.pos.y + sin(this.orbitAngle) * this.orbitRadius;
    
    let dx = orbitX - this.pos.x;
    let dy = orbitY - this.pos.y;
    let d = sqrt(dx * dx + dy * dy);
    
    if (d > 0.1) {
      this.vel.x += (dx / d) * 0.05;
      this.vel.y += (dy / d) * 0.05;
    }
    
    this.vel.mult(FLY_DRAG);
    this.pos.add(this.vel);
  }

  checkMouseAttraction() {
    let dx = mouseX - this.pos.x;
    let dy = mouseY - this.pos.y;
    let d = sqrt(dx * dx + dy * dy);
    
    if (d < FLY_MOUSE_RANGE && d > 0.1) {
      this.isAttractedToMouse = true;
      this.vel.x += (dx / d) * FLY_MOUSE_ATTRACTION;
      this.vel.y += (dy / d) * FLY_MOUSE_ATTRACTION;
    } else if (d >= FLY_MOUSE_RANGE) {
      this.isAttractedToMouse = false;
    }
  }

  constrainToWalls() {
    if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x *= -0.3;
    }
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      this.vel.x *= -0.3;
    }
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y *= -0.3;
    }
    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      this.vel.y *= -0.3;
    }
  }

  display() {
    let [r, g, b] = this.color;
    fill(r, g, b, 200);
    noStroke();
    circle(this.pos.x, this.pos.y, this.radius * 2);
    
    // Small shine effect
    fill(255, 255, 255, 100);
    circle(this.pos.x - this.radius * 0.4, this.pos.y - this.radius * 0.4, this.radius * 0.5);
  }
}

