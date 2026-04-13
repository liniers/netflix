// ══════════════════════════════════════════════════════
//  ORGANIC BLOBS — Data-driven soft body simulation
// ══════════════════════════════════════════════════════

// ── DATA CONFIG ──────────────────────────────────────
float DATA_VALUE     = 335000000;  // <-- TU DATO (de 100,000 a 335,000,000)
float DATA_MAX       = 335000000;  // máximo de la escala
int   MAX_BLOBS      = 120;        // tope de blobs para rendimiento

// ── PHYSICS CONFIG ───────────────────────────────────
float GRAVITY        = 0.75;
float AIR_DRAG       = 0.90;
float BOUNCE         = -0.2;
float FLOOR_FRICTION = 0.92;
float OVERLAP_ALLOW  = 0.85;  // 1.0 = no overlap, 0.7 = mucho overlap
float SEPARATION_FORCE = 0.3;
int   SEPARATION_ITERS = 4;

// ── DEFORMATION CONFIG ───────────────────────────────
float PUSH_FACTOR    = 0.75;  // conformidad al deformar (0-1)
float DEFORM_ZONE    = 0.95;  // zona de deformación (vs radio)
float SQUISH_SPREAD  = 1.08;  // expansión al aplastar contra suelo/pared
float STRETCH_SPEED  = 10.0;  // vel a la que empieza el stretch
float STRETCH_MAX    = 0.5;   // máx deformación por velocidad
float STRETCH_X_MULT = 0.3;   // ratio estiramiento
float STRETCH_Y_MULT = 0.18;  // ratio compresión

// ── WOBBLE & JIGGLE ──────────────────────────────────
float WOBBLE_AMP     = 0.08;
float WOBBLE_SPEED   = 0.025;
float JIGGLE_DECAY   = 0.92;
float JIGGLE_AMP     = 0.03;
float SHAPE_IRREGULARITY = 0.08;  // 0 = círculo, 0.15 = muy orgánico

// ── DRAG & THROW ─────────────────────────────────────
float DRAG_STIFFNESS = 0.18;
float DRAG_DAMPING   = 0.7;
float THROW_MULT     = 3.0;

// ── VISUAL ───────────────────────────────────────────
int   BG_R = 255, BG_G = 255, BG_B = 255;
float FILL_ALPHA     = 80;
float STROKE_ALPHA   = 150;
float STROKE_WT      = 1.5;
float STROKE_DARKEN  = 0.75;
int   NUM_VERTS      = 36;  // vértices por blob (menos = más rendimiento)

color[] palette = {
  color(180, 120, 100),
  color(120, 160, 200),
  color(140, 190, 130),
  color(190, 130, 140),
  color(160, 140, 190),
  color(200, 175, 120),
  color(130, 190, 180),
  color(200, 140, 110)
};

// ── STATE ────────────────────────────────────────────
ArrayList<Blob> blobs = new ArrayList<Blob>();
Blob dragging = null;
PVector dragOffset;
PVector prevMouse;
PVector throwVel;


// ══════════════════════════════════════════════════════
//  DATA → BLOBS mapping
// ══════════════════════════════════════════════════════

int dataBlobCount;
float dataBlobRadius;

void computeDataMapping() {
  float ratio = constrain(DATA_VALUE / DATA_MAX, 0, 1);

  // Cantidad: pow(0.55) suaviza la curva
  dataBlobCount = max(1, round(MAX_BLOBS * pow(ratio, 0.55)));

  // Radio: área total proporcional al dato, 95% pantalla en el máximo
  float screenArea = width * height;
  float targetArea = ratio * screenArea * 0.95;
  float areaPerBlob = targetArea / dataBlobCount;
  dataBlobRadius = sqrt(areaPerBlob / PI);
  dataBlobRadius = constrain(dataBlobRadius, 15, 100);
}


// ══════════════════════════════════════════════════════
//  SETUP
// ══════════════════════════════════════════════════════

void setup() {
  size(1400, 800);

  computeDataMapping();
  println("Data: " + (DATA_VALUE/1e6) + "M → " + dataBlobCount + " blobs, avg radius: " + nf(dataBlobRadius, 1, 1) + "px");

  for (int i = 0; i < dataBlobCount; i++) {
    float r = dataBlobRadius * random(0.65, 1.35);
    r = constrain(r, 6, 90);
    float x = random(r + 10, width - r - 10);
    float y = random(0, height - r - 10);
    blobs.add(new Blob(x, y, r, palette[int(random(palette.length))]));
  }
}


// ══════════════════════════════════════════════════════
//  DRAW
// ══════════════════════════════════════════════════════

void draw() {
  background(BG_R, BG_G, BG_B);

  // ── drag ──
  if (dragging != null) {
    PVector target = new PVector(mouseX + dragOffset.x, mouseY + dragOffset.y);
    PVector force = PVector.sub(target, dragging.pos).mult(DRAG_STIFFNESS);
    dragging.vel.add(force);
    dragging.vel.mult(DRAG_DAMPING);
    if (prevMouse != null) {
      throwVel = new PVector(mouseX - prevMouse.x, mouseY - prevMouse.y);
    }
    prevMouse = new PVector(mouseX, mouseY);
    float sp = throwVel != null ? throwVel.mag() : 0;
    dragging.jiggle = lerp(dragging.jiggle, sp * 0.06, 0.3);
  }

  // ── physics ──
  for (Blob b : blobs) {
    b.vel.y += GRAVITY;
    b.vel.mult(AIR_DRAG);
    b.pos.add(b.vel);
    b.constrainToWalls();
  }

  // ── separation ──
  for (int iter = 0; iter < SEPARATION_ITERS; iter++) {
    for (int i = 0; i < blobs.size(); i++) {
      for (int j = i + 1; j < blobs.size(); j++) {
        separateBlobs(blobs.get(i), blobs.get(j));
      }
    }
  }

  // ── vertices ──
  for (Blob b : blobs) b.computeVertices();

  // ── deform (optimized) ──
  for (int i = 0; i < blobs.size(); i++) {
    Blob bi = blobs.get(i);
    for (int j = 0; j < blobs.size(); j++) {
      if (i == j) continue;
      Blob bj = blobs.get(j);
      float d = dist(bi.pos.x, bi.pos.y, bj.pos.x, bj.pos.y);
      if (d < bi.radius + bj.radius * 1.1) {
        deformAgainst(bi, bj);
      }
    }
    deformAgainstFloor(bi);
    deformAgainstWalls(bi);
  }

  // ── draw ──
  for (Blob b : blobs) {
    b.display();
    b.jiggle *= JIGGLE_DECAY;
    b.wobblePhase += WOBBLE_SPEED;
  }

  if (dragging != null) cursor(HAND); else cursor(ARROW);
}


// ══════════════════════════════════════════════════════
//  PHYSICS
// ══════════════════════════════════════════════════════

void separateBlobs(Blob a, Blob b) {
  float dx = b.pos.x - a.pos.x;
  float dy = b.pos.y - a.pos.y;
  float d = sqrt(dx * dx + dy * dy);
  float minDist = (a.radius + b.radius) * OVERLAP_ALLOW;

  if (d < minDist && d > 0.01) {
    float nx = dx / d;
    float ny = dy / d;
    float overlap = minDist - d;
    float totalR = a.radius + b.radius;

    a.pos.x -= nx * overlap * (b.radius / totalR) * SEPARATION_FORCE;
    a.pos.y -= ny * overlap * (b.radius / totalR) * SEPARATION_FORCE;
    b.pos.x += nx * overlap * (a.radius / totalR) * SEPARATION_FORCE;
    b.pos.y += ny * overlap * (a.radius / totalR) * SEPARATION_FORCE;

    float relVelDot = (a.vel.x - b.vel.x) * nx + (a.vel.y - b.vel.y) * ny;
    if (relVelDot > 0) {
      float impulse = relVelDot * 0.6;
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

void deformAgainst(Blob blobA, Blob blobB) {
  float cx = blobB.pos.x;
  float cy = blobB.pos.y;
  float rB = blobB.radius * DEFORM_ZONE;

  for (int i = 0; i < blobA.numVerts; i++) {
    float vx = blobA.worldVx[i];
    float vy = blobA.worldVy[i];
    float dx = vx - cx;
    float dy = vy - cy;
    float d = sqrt(dx * dx + dy * dy);

    if (d < rB) {
      float nxx = dx / max(d, 0.1);
      float nyy = dy / max(d, 0.1);
      blobA.worldVx[i] = lerp(vx, cx + nxx * rB, PUSH_FACTOR);
      blobA.worldVy[i] = lerp(vy, cy + nyy * rB, PUSH_FACTOR);
    }
  }
}

void deformAgainstFloor(Blob blob) {
  for (int i = 0; i < blob.numVerts; i++) {
    if (blob.worldVy[i] > height - 2) {
      blob.worldVy[i] = height - 2;
      float dx = blob.worldVx[i] - blob.pos.x;
      blob.worldVx[i] = blob.pos.x + dx * SQUISH_SPREAD;
    }
  }
}

void deformAgainstWalls(Blob blob) {
  for (int i = 0; i < blob.numVerts; i++) {
    if (blob.worldVx[i] < 2) {
      blob.worldVx[i] = 2;
      float dy = blob.worldVy[i] - blob.pos.y;
      blob.worldVy[i] = blob.pos.y + dy * SQUISH_SPREAD;
    }
    if (blob.worldVx[i] > width - 2) {
      blob.worldVx[i] = width - 2;
      float dy = blob.worldVy[i] - blob.pos.y;
      blob.worldVy[i] = blob.pos.y + dy * SQUISH_SPREAD;
    }
  }
}


// ══════════════════════════════════════════════════════
//  SMOOTH SHAPE GENERATION
// ══════════════════════════════════════════════════════

float[] generateSmoothOffsets(int nVerts, float magnitude) {
  float[] offsets = new float[nVerts];
  int numH = int(random(3, 5));
  for (int h = 0; h < numH; h++) {
    int freq = int(random(1, 4));
    float amp = random(magnitude * 0.4, magnitude);
    float phase = random(TWO_PI);
    for (int i = 0; i < nVerts; i++) {
      offsets[i] += sin(TWO_PI * i / nVerts * freq + phase) * amp;
    }
  }
  float mx = 0;
  for (float o : offsets) mx = max(mx, abs(o));
  if (mx > 0) {
    float sc = magnitude / mx;
    for (int i = 0; i < nVerts; i++) offsets[i] *= sc;
  }
  return offsets;
}


// ══════════════════════════════════════════════════════
//  INTERACTION
// ══════════════════════════════════════════════════════

void mousePressed() {
  for (int i = blobs.size() - 1; i >= 0; i--) {
    Blob b = blobs.get(i);
    if (dist(mouseX, mouseY, b.pos.x, b.pos.y) < b.radius * 1.3) {
      dragging = b;
      dragOffset = new PVector(b.pos.x - mouseX, b.pos.y - mouseY);
      prevMouse = new PVector(mouseX, mouseY);
      throwVel = new PVector(0, 0);
      return;
    }
  }
}

void mouseReleased() {
  if (dragging != null && throwVel != null) {
    dragging.vel.set(throwVel.x * THROW_MULT, throwVel.y * THROW_MULT);
    dragging.jiggle = min(throwVel.mag() * 0.3, 5);
  }
  dragging = null;
  dragOffset = null;
  prevMouse = null;
  throwVel = null;
}

int lastClickTime = 0;
void mouseClicked() {
  int now = millis();
  if (now - lastClickTime < 400) {
    float r = dataBlobRadius * random(0.65, 1.35);
    blobs.add(new Blob(mouseX, mouseY, r, palette[int(random(palette.length))]));
  }
  lastClickTime = now;
}


// ══════════════════════════════════════════════════════
//  BLOB CLASS
// ══════════════════════════════════════════════════════

class Blob {
  PVector pos, vel;
  float radius;
  color col;
  int numVerts = NUM_VERTS;
  float[] baseOffsets;
  float[] worldVx, worldVy;
  float wobblePhase;
  float jiggle;

  Blob(float x, float y, float r, color c) {
    pos = new PVector(x, y);
    vel = new PVector(random(-1, 1), random(-2, 0));
    radius = r;
    col = c;
    wobblePhase = random(TWO_PI);
    jiggle = 0;
    baseOffsets = generateSmoothOffsets(numVerts, SHAPE_IRREGULARITY);
    worldVx = new float[numVerts];
    worldVy = new float[numVerts];
  }

  void constrainToWalls() {
    if (pos.y + radius > height) {
      pos.y = height - radius;
      vel.y *= BOUNCE;
      vel.x *= FLOOR_FRICTION;
      jiggle = max(jiggle, abs(vel.y) * 0.04);
    }
    if (pos.x - radius < 0) {
      pos.x = radius;
      vel.x *= -0.25;
    }
    if (pos.x + radius > width) {
      pos.x = width - radius;
      vel.x *= -0.25;
    }
  }

  void computeVertices() {
    float speed = vel.mag();
    float velAngle = atan2(vel.y, vel.x);
    float deform = min(speed / STRETCH_SPEED, STRETCH_MAX);
    float sx = 1 + deform * STRETCH_X_MULT;
    float sy = 1 - deform * STRETCH_Y_MULT;

    float cosV = cos(-velAngle), sinV = sin(-velAngle);
    float cosV2 = cos(velAngle), sinV2 = sin(velAngle);

    for (int i = 0; i < numVerts; i++) {
      float a = TWO_PI * i / numVerts;
      float r = radius * (1
        + baseOffsets[i]
        + sin(a * 2 + wobblePhase) * WOBBLE_AMP
        + sin(a * 3 + frameCount * 0.25) * jiggle * JIGGLE_AMP
      );

      float lx = cos(a) * r;
      float ly = sin(a) * r;

      float rx = lx * cosV - ly * sinV;
      float ry = lx * sinV + ly * cosV;
      rx *= sx; ry *= sy;
      lx = rx * cosV2 - ry * sinV2;
      ly = rx * sinV2 + ry * cosV2;

      worldVx[i] = pos.x + lx;
      worldVy[i] = pos.y + ly;
    }
  }

  void display() {
    float cr = red(col);
    float cg = green(col);
    float cb = blue(col);

    // smooth vertices
    float[] svx = new float[numVerts];
    float[] svy = new float[numVerts];
    for (int i = 0; i < numVerts; i++) {
      int p = (i - 1 + numVerts) % numVerts;
      int n = (i + 1) % numVerts;
      svx[i] = worldVx[i] * 0.5 + worldVx[p] * 0.25 + worldVx[n] * 0.25;
      svy[i] = worldVy[i] * 0.5 + worldVy[p] * 0.25 + worldVy[n] * 0.25;
    }

    noStroke();
    fill(cr, cg, cb, FILL_ALPHA);
    beginShape();
    for (int i = -3; i <= numVerts + 2; i++) {
      int idx = ((i % numVerts) + numVerts) % numVerts;
      curveVertex(svx[idx], svy[idx]);
    }
    endShape(CLOSE);

    noFill();
    stroke(cr * STROKE_DARKEN, cg * STROKE_DARKEN, cb * STROKE_DARKEN, STROKE_ALPHA);
    strokeWeight(STROKE_WT);
    beginShape();
    for (int i = -3; i <= numVerts + 2; i++) {
      int idx = ((i % numVerts) + numVerts) % numVerts;
      curveVertex(svx[idx], svy[idx]);
    }
    endShape(CLOSE);
  }
}
