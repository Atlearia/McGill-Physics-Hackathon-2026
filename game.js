// ─── GAME STATE ──────────────────────────────────────────────
const balloon = {
  x: BOARD.x + BOARD.w * 0.5, y: BOARD.y + BOARD.h * 0.52,
  vx: -48, vy: -34,
  radius: BASE_RAD, targetRadius: BASE_RAD,
  mass: BASE_MASS, elasticity: BASE_ELAST,
  damping: 0, temp: 0, tunnelGhost: 0
};
const trail = [];
const particles = [];
const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
const state = {
  activeTool: 0,
  dragging: false,
  activeEffects: [],
  disabledWalls: new Map(),
  tunnelPreview: null,
  toolUses: {},
  hackerMode: true,
  hoverTool: -1
};
for (const t of TOOLS) state.toolUses[t.id] = t.maxUses != null ? t.maxUses : Infinity;

// ─── AUDIO ───────────────────────────────────────────────────
// Per-file volume normalization (tweak these if a specific sound is too loud/quiet)
const SFX_VOLUMES = {
  "Assets/Audios/heat.mp3":     0.45,
  "Assets/Audios/cold.mp3":     0.25,
  "Assets/Audios/gravity.mp3":  0.40,
  "Assets/Audios/pressure.mp3": 0.35,
  "Assets/Audios/vacuum.mp3":   0.40,
  "Assets/Audios/quantum.mp3":  0.05,
};
const BGM_VOLUME       = 0.30;
const BGM_HACKER_VOLUME = 0.55;

const audio = {
  cache: {},
  bgm: null,
  bgmStarted: false,
  bgmHacker: null,

  load(src) {
    if (!this.cache[src]) {
      const a = new Audio(src);
      a.preload = "auto";
      this.cache[src] = a;
    }
    return this.cache[src];
  },

  play(src, volume) {
    if (!src) return;
    const norm = SFX_VOLUMES[src] != null ? SFX_VOLUMES[src] : 0.45;
    const a = this.load(src).cloneNode();
    a.volume = volume != null ? volume : norm;
    a.play().catch(() => {});
  },

  startBGM() {
    if (this.bgmStarted) return;
    this.bgmStarted = true;
    this.bgm = new Audio("Assets/Audios/theme.mp3");
    this.bgm.loop = true;
    this.bgm.volume = BGM_VOLUME;
    this.bgmHacker = new Audio("Assets/Audios/hacker_theme.mp3");
    this.bgmHacker.loop = true;
    this.bgmHacker.volume = BGM_HACKER_VOLUME;
    this.syncBGM();
  },

  syncBGM() {
    if (!this.bgmStarted) return;
    if (state.hackerMode) {
      this.bgm.pause();
      this.bgmHacker.currentTime = this.bgm.currentTime || 0;
      this.bgmHacker.play().catch(() => {});
    } else {
      this.bgmHacker.pause();
      this.bgm.currentTime = this.bgmHacker.currentTime || 0;
      this.bgm.play().catch(() => {});
    }
  }
};
// Preload all ability sounds
for (const t of TOOLS) { if (t.sound) audio.load(t.sound); }

// ─── CANVAS SETUP ────────────────────────────────────────────
const canvas = document.getElementById("c");
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = true;

function fit() {
  const wrap = document.getElementById("canvas-wrap");
  if (!wrap) return;
  const mW = wrap.clientWidth, mH = wrap.clientHeight;
  if (mW <= 0 || mH <= 0) return;
  let w = mW, h = w / (W / H);
  if (h > mH) { h = mH; w = h * (W / H); }
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
}
fit(); addEventListener("resize", fit);
// Re-fit after a short delay to catch layout settling
setTimeout(fit, 100);

// ─── BUILD HTML TOOL BUTTONS ─────────────────────────────────
const TOOL_SYMBOLS = { heat: "\u2191\u0394T", cold: "\u2193\u0394T", mass: "M\u2299", highPressure: "\u21c8P", vacuum: "\u21ca P", tunneling: "\u03a8\u22a5" };
const TOOL_HACKER_SYMBOLS = { heat: "\u2202T", cold: "\u2202T", mass: "G\u2297", highPressure: "\u2202P", vacuum: "u\u1d63", tunneling: "\u03a8\u22a5" };
const TOOL_DESCRIPTIONS = {
  heat: "Thermal expansion\u2002\u00b7\u2002Increases radius",
  cold: "Cryogenic compression\u2002\u00b7\u2002Shrinks radius",
  mass: "Gravity well\u2002\u00b7\u2002Weak attraction",
  highPressure: "Pressure wave\u2002\u00b7\u2002Push impulse",
  vacuum: "Vacuum pull\u2002\u00b7\u2002Inward impulse",
  tunneling: "Quantum tunnel\u2002\u00b7\u2002Phase through walls"
};
(function buildToolList() {
  const list = document.getElementById("tool-list");
  if (!list) return;
  TOOLS.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.dataset.index = i;
    const uses = state.toolUses[t.id];
    btn.innerHTML = '<span class="tool-icon" style="color:' + t.accent + '">' + (TOOL_SYMBOLS[t.id] || "?") + '</span>'
      + '<span class="tool-label">' + t.name + '</span>'
      + '<span class="tool-uses">' + (uses === Infinity ? "\u221e" : "\u00d7" + uses) + '</span>';
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      audio.startBGM();
      if (state.toolUses[t.id] > 0) {
        state.activeTool = i;
        state.dragging = true;
      }
    });
    list.appendChild(btn);
  });
})();

// ─── BUILD LEFT PANEL TOOL INFO BLOCKS ───────────────────────
(function buildToolInfoList() {
  const list = document.getElementById("tool-info-list");
  if (!list) return;
  TOOLS.forEach((t, i) => {
    const block = document.createElement("div");
    block.className = "tool-info-block";
    block.dataset.toolIndex = i;
    block.innerHTML =
      '<div class="tool-info-top">' +
        '<span class="tool-info-symbol">' + (TOOL_HACKER_SYMBOLS[t.id] || "?") + '</span>' +
        '<span class="tool-info-name">' + t.name + '</span>' +
      '</div>' +
      '<div class="tool-info-eq">' + t.equation + '</div>';
    list.appendChild(block);
  });
})();

// ─── HACKER CHECKBOX (HTML) ──────────────────────────────────
function applyThemeClass() {
  document.body.classList.toggle("normal-mode", !state.hackerMode);
}
const hackerCb = document.getElementById("hacker-cb");
if (hackerCb) {
  hackerCb.checked = state.hackerMode;
  applyThemeClass();
  hackerCb.addEventListener("change", () => {
    state.hackerMode = hackerCb.checked;
    applyThemeClass();
    audio.syncBGM();
  });
}

// ─── PARTICLES ───────────────────────────────────────────────
function spawnBurst(x, y, inward) {
  const count = inward ? 46 : 32;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    if (inward) {
      const r = 85 + Math.random() * 265;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      const ia = Math.atan2(y - py, x - px), s = 240 + Math.random() * 520;
      particles.push({ x: px, y: py, vx: Math.cos(ia) * s, vy: Math.sin(ia) * s,
        tx: x, ty: y, kind: "vacuum", age: 0, life: 0.3 + Math.random() * 0.44,
        size: 0.9 + Math.random() * 1.5, alpha: 0.55 + Math.random() * 0.45 });
    } else {
      const s = 260 + Math.random() * 420;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        kind: "pressure", age: 0, life: 0.25 + Math.random() * 0.37,
        size: 0.8 + Math.random() * 1.4, alpha: 0.48 + Math.random() * 0.47 });
    }
  }
}

// ─── INPUT ───────────────────────────────────────────────────
function readPointer(e) {
  const r = canvas.getBoundingClientRect();
  pointer.x = clamp((e.clientX - r.left) * (W / r.width), 0, W);
  pointer.y = clamp((e.clientY - r.top) * (H / r.height), 0, H);
}
// Use document-level move/up so dragging from HTML tools onto canvas works
document.addEventListener("pointermove", e => {
  readPointer(e);
  // Sidebar hover tracking
  state.hoverTool = -1;
  for (let i = 0; i < TOOLS.length; i++) {
    if (ptInRect(pointer.x, pointer.y, sidebarRect(i))) {
      state.hoverTool = i;
      break;
    }
  }
  canvas.style.cursor = state.hoverTool >= 0 ? "pointer" : "";
});
canvas.addEventListener("pointerdown", e => {
  readPointer(e); pointer.down = true; pointer.pressed = true;
  audio.startBGM();
  // Canvas sidebar tool selection
  for (let i = 0; i < TOOLS.length; i++) {
    const rect = sidebarRect(i);
    if (ptInRect(pointer.x, pointer.y, rect) && state.toolUses[TOOLS[i].id] > 0) {
      state.activeTool = i;
      state.dragging = true;
      return;
    }
  }
});
document.addEventListener("pointerup", e => {
  readPointer(e); pointer.down = false; pointer.released = true;
  // Drop the ability
  if (state.dragging && state.activeTool >= 0) {
    state.dragging = false;
    const tool = TOOLS[state.activeTool];
    const ok = tool.allowOutsideBoard || pointInBoard(pointer.x, pointer.y);
    if (ok && state.toolUses[tool.id] > 0) {
      const eff = tool.createEffect(pointer.x, pointer.y, balloon, state);
      if (eff) {
        state.activeEffects.push(eff);
        audio.play(tool.sound);
        if (state.toolUses[tool.id] !== Infinity) {
          state.toolUses[tool.id]--;
          // Update HTML uses display
          const btns = document.querySelectorAll(".tool-btn");
          if (btns[state.activeTool]) {
            const usesEl = btns[state.activeTool].querySelector(".tool-uses");
            const uses = state.toolUses[tool.id];
            if (usesEl) usesEl.textContent = uses === Infinity ? "\u221e" : "\u00d7" + uses;
          }
        }
      }
    }
    state.activeTool = -1;
  }
});

// ─── UPDATE ──────────────────────────────────────────────────
function update(dt) {
  dt = clamp(dt, 1 / 180, 1 / 25);

  // Decay disabled walls
  for (const [w, ttl] of state.disabledWalls) {
    if (ttl - dt <= 0) state.disabledWalls.delete(w); else state.disabledWalls.set(w, ttl - dt);
  }

  // Reset per-frame balloon defaults
  balloon.damping = 0;
  balloon.mass = BASE_MASS;
  balloon.elasticity = BASE_ELAST;
  balloon.targetRadius = BASE_RAD;
  balloon.tunnelGhost = Math.max(0, balloon.tunnelGhost - dt * 2.2);
  balloon.temp *= Math.exp(-dt * 1.5);

  // Tunnel wall preview while dragging
  state.tunnelPreview = null;
  if (state.dragging && state.activeTool >= 0 && TOOLS[state.activeTool].id === "tunneling") {
    state.tunnelPreview = findNearestWall(pointer.x, pointer.y, 40);
  }

  // Process active effects
  for (let i = state.activeEffects.length - 1; i >= 0; i--) {
    const eff = state.activeEffects[i];
    eff.update(dt, balloon, state);
    if (eff.dead) state.activeEffects.splice(i, 1);
  }

  // Integrate
  balloon.radius += (balloon.targetRadius - balloon.radius) * Math.min(dt * 6.4, 1);
  const damp = Math.exp(-(BASE_DAMP / Math.max(1, balloon.mass) + balloon.damping) * dt);
  balloon.vx *= damp; balloon.vy *= damp;
  const spd = Math.hypot(balloon.vx, balloon.vy);
  if (spd > MAX_SPEED) { const f = MAX_SPEED / spd; balloon.vx *= f; balloon.vy *= f; }
  balloon.x += balloon.vx * dt;
  balloon.y += balloon.vy * dt;

  // Wall collisions
  for (let iter = 0; iter < 4; iter++) {
    let hit = false;
    for (const w of walls) {
      if (state.disabledWalls.has(w)) continue;
      const cp = closestPt(balloon.x, balloon.y, w.a.x, w.a.y, w.b.x, w.b.y);
      let dx = balloon.x - cp.x, dy = balloon.y - cp.y, dist = Math.hypot(dx, dy);
      const minDist = balloon.radius + wallHalfWidth(w);
      if (dist >= minDist) continue;
      hit = true;
      let nx, ny;
      if (dist > 0.0001) { nx = dx / dist; ny = dy / dist; }
      else {
        const sl = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y) || 1;
        const tx = (w.b.x - w.a.x) / sl, ty = (w.b.y - w.a.y) / sl;
        nx = -ty; ny = tx;
        if (dot(balloon.x - w.a.x, balloon.y - w.a.y, nx, ny) < 0) { nx *= -1; ny *= -1; }
        dist = 0;
      }
      balloon.x += nx * (minDist - dist);
      balloon.y += ny * (minDist - dist);
      const nv = dot(balloon.vx, balloon.vy, nx, ny);
      if (nv < 0) {
        const wallElasticity = w.elasticity != null ? w.elasticity : balloon.elasticity;
        balloon.vx -= (1 + wallElasticity) * nv * nx;
        balloon.vy -= (1 + wallElasticity) * nv * ny;
        const tx = -ny, ty = nx, tv = dot(balloon.vx, balloon.vy, tx, ty);
        const fric = w.friction != null ? w.friction : (w.isFrame ? 0.995 : 0.992);
        balloon.vx -= tv * (1 - fric) * tx;
        balloon.vy -= tv * (1 - fric) * ty;
      }
    }
    if (!hit) break;
  }

  // Trail
  const head = trail[trail.length - 1];
  if (!head || Math.hypot(head.x - balloon.x, head.y - balloon.y) > 2.2)
    trail.push({ x: balloon.x, y: balloon.y, life: 1 });
  for (const n of trail) n.life -= dt * 0.56;
  while (trail.length && trail[0].life <= 0) trail.shift();
  if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX);

  // Particles
  for (const p of particles) {
    p.age += dt;
    if (p.kind === "vacuum") {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy) || 1;
      const acc = 640 / (d * 0.25 + 40);
      p.vx += (dx / d) * acc; p.vy += (dy / d) * acc;
    }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.984; p.vy *= 0.984;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].age >= particles[i].life) particles.splice(i, 1);
  }

  pointer.pressed = false; pointer.released = false;
}

// ─── GAME LOOP ───────────────────────────────────────────────
let lastTime = 0;
(function tick(ts) {
  const dt = lastTime ? (ts - lastTime) / 1000 : 1 / 60;
  lastTime = ts;
  update(dt); draw();
  requestAnimationFrame(tick);
})(0);
