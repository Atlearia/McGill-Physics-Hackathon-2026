// ─── CONSTANTS ───────────────────────────────────────────────
const W = 1600, H = 900;
const BOARD = { x: 292, y: 66, w: 1240, h: 760 };
const SIDEBAR = { x: 178, y: 206, w: 84, h: 480, r: 8, gap: 2, pad: 6 };
const LENS_R = 230;
const TOOL_R = LENS_R * 1.45;
const MAX_SPEED = 980;
const BASE_DAMP = 0.12;
const BASE_ELAST = 0.85;
const BASE_RAD = 36;
const BASE_MASS = 5;
const TRAIL_MAX = 190;
const DEFAULT_WALL_WIDTH = 20;
const HACKER_CB_RECT = { x: W - 180, y: 10, w: 168, h: 30 };

// ─── MATH HELPERS ────────────────────────────────────────────
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function dot(ax, ay, bx, by) { return ax * bx + ay * by; }
function wallWidth(w) {
  const raw = w && typeof w.width === "number" ? w.width : DEFAULT_WALL_WIDTH;
  return Math.max(2, raw);
}
function wallHalfWidth(w) { return wallWidth(w) * 0.5; }
function closestPt(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return { x: ax + dx * t, y: ay + dy * t };
}
function pointInBoard(x, y) { return x >= BOARD.x && y >= BOARD.y && x <= BOARD.x + BOARD.w && y <= BOARD.y + BOARD.h; }
function sidebarRect(i) {
  const ih = (SIDEBAR.h - SIDEBAR.pad * 2 - SIDEBAR.gap * (TOOLS.length - 1)) / TOOLS.length;
  return { x: SIDEBAR.x, y: SIDEBAR.y + SIDEBAR.pad + i * (ih + SIDEBAR.gap), w: SIDEBAR.w, h: ih };
}
function ptInRect(x, y, r) { return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h; }
function withAlpha(c, a) {
  if (c.startsWith("rgba(")) { const p = c.slice(5, -1).split(","); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }
  return `rgba(255,255,255,${a})`;
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
