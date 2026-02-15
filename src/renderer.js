import {
  BOARD_RECT,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  MODES,
  MODE_TOGGLE_RECT,
  SIDEBAR_LAYOUT,
  TITLE_HEIGHT,
  TOOL_IDS,
  TOOL_META,
} from "./config.js";

function roundedRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawNeonText(ctx, text, x, y, color, size = 62) {
  ctx.save();
  ctx.font = `${size}px Times New Roman`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export class Renderer {
  constructor(ctx, images) {
    this.ctx = ctx;
    this.images = images;
    this.patterns = {
      wall: null,
      board: null,
    };
    this.ensurePatterns();
  }

  ensurePatterns() {
    if (!this.patterns.wall) {
      this.patterns.wall = this.ctx.createPattern(this.images.wallPattern, "repeat");
    }
    if (!this.patterns.board) {
      this.patterns.board = this.ctx.createPattern(this.images.wallPatternAlt, "repeat");
    }
  }

  getToolRects() {
    return TOOL_IDS.map((toolId, index) => {
      const x = SIDEBAR_LAYOUT.x + SIDEBAR_LAYOUT.innerPad;
      const y = SIDEBAR_LAYOUT.y + SIDEBAR_LAYOUT.innerPad + index * (SIDEBAR_LAYOUT.itemH + SIDEBAR_LAYOUT.gap);
      const w = SIDEBAR_LAYOUT.w - SIDEBAR_LAYOUT.innerPad * 2;
      const h = SIDEBAR_LAYOUT.itemH - SIDEBAR_LAYOUT.innerPad * 2;
      return { toolId, x, y, w, h };
    });
  }

  render(state) {
    this.ensurePatterns();
    const { ctx } = this;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawBackground(state.mode);
    this.drawTitle(state);
    this.drawSidebar(state);
    this.drawBoard(state);
    this.drawModeToggle(state.mode);
    this.drawHint(state.level?.hint ?? "");
  }

  drawBackground(mode) {
    const { ctx } = this;
    if (mode === MODES.HACKER) {
      ctx.fillStyle = COLORS.bgHacker;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }

    ctx.fillStyle = COLORS.bgNormal;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (this.images.bgNormal) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(this.images.bgNormal, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
    if (this.patterns.board) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = this.patterns.board;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
  }

  drawTitle(state) {
    const tool = TOOL_META[state.selectedTool];
    const titleText =
      state.mode === MODES.HACKER && tool
        ? `FUNDAMENTAL CONSTANT: ${tool.label.toUpperCase()}  |  ${tool.equation}`
        : "FUNDAMENTAL CONSTANT: THE NEON CAT";
    drawNeonText(this.ctx, titleText, BOARD_RECT.x + BOARD_RECT.w / 2, TITLE_HEIGHT / 2 + 6, "#edeaf9", 54);
  }

  drawSidebar(state) {
    const { ctx } = this;
    roundedRect(ctx, SIDEBAR_LAYOUT.x, SIDEBAR_LAYOUT.y, SIDEBAR_LAYOUT.w, BOARD_RECT.h, 8);
    ctx.fillStyle = "rgba(2,3,8,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();

    const toolRects = this.getToolRects();
    for (const rect of toolRects) {
      const meta = TOOL_META[rect.toolId];
      const selected = state.selectedTool === rect.toolId;
      roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
      const glow = selected ? meta.accent : "rgba(255,255,255,0.2)";
      ctx.fillStyle = selected ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.48)";
      ctx.fill();
      ctx.shadowBlur = selected ? 18 : 0;
      ctx.shadowColor = glow;
      ctx.strokeStyle = selected ? glow : "rgba(255,255,255,0.4)";
      ctx.lineWidth = selected ? 2.8 : 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = selected ? glow : "rgba(245,245,245,0.9)";
      ctx.font = selected ? "34px Times New Roman" : "31px Times New Roman";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.shortLabel, rect.x + rect.w / 2, rect.y + rect.h / 2 - 3);

      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "11px Times New Roman";
      ctx.fillText("\u221e", rect.x + rect.w - 8, rect.y + rect.h - 8);
    }
  }

  drawBoard(state) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.rect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
    ctx.clip();

    if (state.mode === MODES.HACKER) {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
    } else if (this.patterns.board) {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = this.patterns.board;
      ctx.fillRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
      ctx.globalAlpha = 1;
    }

    this.drawGoal(state.level?.goal, state.level?.rodColor ?? "#ff3b3b");
    this.drawWalls(state.level?.walls ?? [], state.mode);
    this.drawCat(state.cat, state.mode);

    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 4;
    ctx.strokeRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
  }

  drawGoal(goal, color) {
    if (!goal) {
      return;
    }
    const { ctx } = this;
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    roundedRect(ctx, goal.x, goal.y, goal.w, goal.h, 7);
    ctx.fill();
    ctx.restore();
  }

  drawWalls(walls, mode) {
    const { ctx } = this;
    for (const segment of walls) {
      ctx.save();
      if (this.patterns.wall && mode === MODES.NORMAL) {
        ctx.fillStyle = this.patterns.wall;
      } else {
        ctx.fillStyle = mode === MODES.HACKER ? "rgba(60,60,60,0.95)" : "rgba(225,190,255,0.95)";
      }
      ctx.fillRect(segment.x, segment.y, segment.w, segment.h);
      ctx.strokeStyle = "rgba(255,255,255,0.98)";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(segment.x, segment.y, segment.w, segment.h);
      ctx.restore();
    }
  }

  drawCat(cat, mode) {
    if (!cat) {
      return;
    }
    const { ctx } = this;
    const sprite = mode === MODES.HACKER ? this.images.catHacker : this.images.catNormal;
    const size = cat.radius * 3.2;
    const x = cat.x - size / 2;
    const y = cat.y - size / 2;

    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.shadowBlur = mode === MODES.HACKER ? 18 : 26;
    ctx.shadowColor = mode === MODES.HACKER ? "#42ff54" : "#fceaff";
    ctx.drawImage(sprite, x, y, size, size);
    ctx.restore();
  }

  drawModeToggle(mode) {
    const { ctx } = this;
    const color = mode === MODES.HACKER ? "#6bff7f" : "#f1d0ff";
    roundedRect(ctx, MODE_TOGGLE_RECT.x, MODE_TOGGLE_RECT.y, MODE_TOGGLE_RECT.w, MODE_TOGGLE_RECT.h, 8);
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.font = "20px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`MODE: ${mode === MODES.HACKER ? "HACKER" : "NORMAL"} (H)`, MODE_TOGGLE_RECT.x + MODE_TOGGLE_RECT.w / 2, MODE_TOGGLE_RECT.y + MODE_TOGGLE_RECT.h / 2 + 1);
  }

  drawHint(text) {
    if (!text) {
      return;
    }
    const { ctx } = this;
    ctx.fillStyle = "rgba(235,235,255,0.72)";
    ctx.font = "20px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, BOARD_RECT.x + BOARD_RECT.w / 2, CANVAS_HEIGHT - 10);
  }
}
