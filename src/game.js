import { BOARD_RECT, CAT, MODE_TOGGLE_RECT, MODES, TOOL_IDS } from "./config.js";
import { loadImages } from "./assets.js";
import { InputHandler } from "./input.js";
import { getLevelDefinitions } from "./levels.js";
import { PhysicsEngine } from "./physics.js";
import { Renderer } from "./renderer.js";
import { canUseTool, consumeToolUse, createPlacedEffect, createToolInventory } from "./tools.js";

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
    this.physics = new PhysicsEngine();

    this.levels = getLevelDefinitions();
    this.levelIndex = 0;
    this.level = null;

    this.selectedTool = TOOL_IDS[0];
    this.draggingTool = null;
    this.toolInventory = createToolInventory();
    this.effects = [];
    this.lastGoalHitMs = 0;

    this.cat = {
      x: BOARD_RECT.x + 180,
      y: BOARD_RECT.y + 200,
      vx: 0,
      vy: 0,
      radius: CAT.baseRadius,
      targetRadius: CAT.baseRadius,
    };
  }

  async init() {
    this.images = await loadImages();
    this.renderer = new Renderer(this.ctx, this.images);
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = Math.max(0, Math.min(index, this.levels.length - 1));
    const source = this.levels[this.levelIndex];
    this.level = {
      ...source,
      walls: source.walls.map((wall) => ({ ...wall })),
    };
    this.effects = [];
    this.cat.x = source.spawn.x;
    this.cat.y = source.spawn.y;
    this.cat.vx = 0;
    this.cat.vy = 0;
    this.cat.radius = CAT.baseRadius;
    this.cat.targetRadius = CAT.baseRadius;
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
    this.update(dt, ts);
    this.render(ts);
    this.input.beginFrame();
    requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  update(dt, nowMs) {
    this.handleUi(nowMs);

    const levelCleared = this.physics.update(
      {
        cat: this.cat,
        level: this.level,
        effects: this.effects,
      },
      this.input.getAxis(),
      dt,
      nowMs,
    );

    if (levelCleared) {
      this.lastGoalHitMs = nowMs;
    }
  }

  handleUi(nowMs) {
    if (this.input.consumeModeToggle()) {
      this.mode = this.mode === MODES.NORMAL ? MODES.HACKER : MODES.NORMAL;
    }

    const pointer = this.input.pointer;

    if (pointer.justPressed) {
      if (insideRect(pointer.x, pointer.y, MODE_TOGGLE_RECT)) {
        this.mode = this.mode === MODES.NORMAL ? MODES.HACKER : MODES.NORMAL;
        return;
      }

      if (this.renderer) {
        const toolRects = this.renderer.getToolRects();
        for (const rect of toolRects) {
          if (insideRect(pointer.x, pointer.y, rect)) {
            this.selectedTool = rect.toolId;
            this.draggingTool = rect.toolId;
            return;
          }
        }
      }
    }

    if (pointer.justReleased && this.draggingTool) {
      if (insideRect(pointer.x, pointer.y, BOARD_RECT) && canUseTool(this.toolInventory, this.draggingTool)) {
        this.effects.push(createPlacedEffect(this.draggingTool, pointer.x, pointer.y, nowMs));
        consumeToolUse(this.toolInventory, this.draggingTool);
      }
      this.draggingTool = null;
    }
  }

  render(nowMs) {
    if (!this.renderer) {
      return;
    }
    this.renderer.render({
      mode: this.mode,
      level: this.level,
      levelIndex: this.levelIndex,
      cat: this.cat,
      selectedTool: this.selectedTool,
      draggingTool: this.draggingTool,
      pointer: this.input.pointer,
      effects: this.effects,
      toolInventory: this.toolInventory,
      nowMs,
      goalPulse: nowMs - this.lastGoalHitMs < 320,
    });
  }
}
