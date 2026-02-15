import { BOARD_RECT, CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, MODES, TITLE_HEIGHT } from "./config.js";
import { loadImages } from "./assets.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.images = null;
    this.mode = MODES.NORMAL;
    this.lastTs = 0;
    this.running = false;
  }

  async init() {
    this.images = await loadImages();
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
    requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  update() {}

  render() {
    const { ctx } = this;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = this.mode === MODES.NORMAL ? COLORS.bgNormal : COLORS.bgHacker;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const title = "THE NEON CAT";
    ctx.fillStyle = COLORS.text;
    ctx.font = "54px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, BOARD_RECT.x + BOARD_RECT.w / 2, TITLE_HEIGHT / 2 + 2);

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "20px Times New Roman";
    ctx.fillText("Scaffold Loaded", BOARD_RECT.x + BOARD_RECT.w / 2, BOARD_RECT.y + BOARD_RECT.h / 2);
  }
}
