import { BOARD_RECT, CAT, MODE_TOGGLE_RECT, MODES } from "./config.js";
import { loadImages } from "./assets.js";
import { InputHandler } from "./input.js";
import { getLevelDefinitions } from "./levels.js";
import { Renderer } from "./renderer.js";

function circleIntersectsRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function resolveCircleRectCollision(circle, wall) {
  const closestX = Math.max(wall.x, Math.min(circle.x, wall.x + wall.w));
  const closestY = Math.max(wall.y, Math.min(circle.y, wall.y + wall.h));
  let dx = circle.x - closestX;
  let dy = circle.y - closestY;
  let distSq = dx * dx + dy * dy;
  if (distSq > circle.radius * circle.radius) {
    return;
  }

  if (distSq === 0) {
    dx = circle.x < wall.x + wall.w / 2 ? -1 : 1;
    dy = circle.y < wall.y + wall.h / 2 ? -1 : 1;
    distSq = dx * dx + dy * dy;
  }

  const dist = Math.sqrt(distSq);
  const overlap = circle.radius - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  circle.x += nx * overlap;
  circle.y += ny * overlap;

  const vn = circle.vx * nx + circle.vy * ny;
  if (vn < 0) {
    circle.vx -= vn * nx * 1.15;
    circle.vy -= vn * ny * 1.15;
  }
}

function insideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.images = null;
    this.mode = MODES.NORMAL;
    this.lastTs = 0;
    this.running = false;
    this.input = new InputHandler(canvas);
    this.renderer = null;
    this.levels = getLevelDefinitions();
    this.levelIndex = 0;
    this.level = null;
    this.selectedTool = "heat";
    this.cat = {
      x: BOARD_RECT.x + 180,
      y: BOARD_RECT.y + 200,
      vx: 0,
      vy: 0,
      radius: CAT.baseRadius,
    };
  }

  async init() {
    this.images = await loadImages();
    this.renderer = new Renderer(this.ctx, this.images);
    this.loadLevel(0);
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTs = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  loop(ts) {
    if (!this.running) {
      return;
    }
    const dt = Math.min((ts - this.lastTs) / 1000, 1 / 30);
    this.lastTs = ts;
    this.update(dt);
    this.render();
    this.input.beginFrame();
    requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  loadLevel(index) {
    this.levelIndex = Math.max(0, Math.min(index, this.levels.length - 1));
    const source = this.levels[this.levelIndex];
    this.level = {
      ...source,
      walls: source.walls.map((wall) => ({ ...wall })),
    };
    this.cat.x = source.spawn.x;
    this.cat.y = source.spawn.y;
    this.cat.vx = 0;
    this.cat.vy = 0;
    this.cat.radius = CAT.baseRadius;
  }

  handleUi() {
    if (this.input.consumeModeToggle()) {
      this.mode = this.mode === MODES.NORMAL ? MODES.HACKER : MODES.NORMAL;
    }

    if (!this.renderer || !this.input.pointer.justPressed) {
      return;
    }

    const { x, y } = this.input.pointer;
    if (insideRect(x, y, MODE_TOGGLE_RECT)) {
      this.mode = this.mode === MODES.NORMAL ? MODES.HACKER : MODES.NORMAL;
      return;
    }

    const toolRects = this.renderer.getToolRects();
    for (const rect of toolRects) {
      if (insideRect(x, y, rect)) {
        this.selectedTool = rect.toolId;
        return;
      }
    }
  }

  update(dt) {
    this.handleUi();
    const axis = this.input.getAxis();
    const mag = Math.hypot(axis.x, axis.y) || 1;
    const ax = (axis.x / mag) * CAT.accel;
    const ay = (axis.y / mag) * CAT.accel;

    this.cat.vx += ax * dt;
    this.cat.vy += ay * dt;

    const dragPow = Math.pow(CAT.drag, dt * 60);
    this.cat.vx *= dragPow;
    this.cat.vy *= dragPow;

    const speed = Math.hypot(this.cat.vx, this.cat.vy);
    if (speed > CAT.maxSpeed) {
      const f = CAT.maxSpeed / speed;
      this.cat.vx *= f;
      this.cat.vy *= f;
    }

    this.cat.x += this.cat.vx * dt;
    this.cat.y += this.cat.vy * dt;
    this.resolveWorldCollision();
    this.resolveGoal();
  }

  resolveWorldCollision() {
    this.cat.x = Math.max(BOARD_RECT.x + this.cat.radius, Math.min(this.cat.x, BOARD_RECT.x + BOARD_RECT.w - this.cat.radius));
    this.cat.y = Math.max(BOARD_RECT.y + this.cat.radius, Math.min(this.cat.y, BOARD_RECT.y + BOARD_RECT.h - this.cat.radius));

    for (const wall of this.level.walls) {
      resolveCircleRectCollision(this.cat, wall);
    }
  }

  resolveGoal() {
    if (!this.level?.goal) {
      return;
    }
    if (!circleIntersectsRect(this.cat, this.level.goal)) {
      return;
    }
    this.cat.vx *= 0.9;
    this.cat.vy *= 0.9;
  }

  render() {
    if (!this.renderer) {
      return;
    }
    this.renderer.render({
      mode: this.mode,
      level: this.level,
      levelIndex: this.levelIndex,
      cat: this.cat,
      selectedTool: this.selectedTool,
    });
  }
}
