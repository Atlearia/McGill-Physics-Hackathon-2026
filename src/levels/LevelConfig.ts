export interface WallDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  /** Maze chamber position + size (in game coords) */
  chamber: { x: number; y: number; width: number; height: number };
  /** Balloon spawn position */
  spawnX: number;
  spawnY: number;
  /** Goal zone position + size */
  goal: { x: number; y: number; width: number; height: number };
  /** Interior walls */
  walls: WallDef[];
  /** Seed for ability selection (for deterministic 10 picks) */
  seed: number;
}

// ──────────────────────────────────────────────────
// Level definitions
// ──────────────────────────────────────────────────

const TOOLBAR_WIDTH = 90;
const PADDING = 20;
const CHAMBER_X = TOOLBAR_WIDTH + PADDING;
const CHAMBER_Y = PADDING;
const CHAMBER_W = 700;
const CHAMBER_H = 520;

export const levels: LevelConfig[] = [
  {
    id: 'level-1',
    name: 'First Steps',
    chamber: { x: CHAMBER_X, y: CHAMBER_Y, width: CHAMBER_W, height: CHAMBER_H },
    spawnX: CHAMBER_X + 50,
    spawnY: CHAMBER_Y + 50,
    goal: {
      x: CHAMBER_X + CHAMBER_W - 70,
      y: CHAMBER_Y + CHAMBER_H - 70,
      width: 50,
      height: 50,
    },
    walls: [
      // Horizontal shelf mid-left
      { x: CHAMBER_X + 100, y: CHAMBER_Y + 180, width: 200, height: 10 },
      // Vertical wall mid
      { x: CHAMBER_X + 350, y: CHAMBER_Y + 100, width: 10, height: 200 },
      // Horizontal shelf lower-right
      { x: CHAMBER_X + 400, y: CHAMBER_Y + 350, width: 220, height: 10 },
    ],
    seed: 42,
  },
  {
    id: 'level-2',
    name: 'Pressure Maze',
    chamber: { x: CHAMBER_X, y: CHAMBER_Y, width: CHAMBER_W, height: CHAMBER_H },
    spawnX: CHAMBER_X + 50,
    spawnY: CHAMBER_Y + 50,
    goal: {
      x: CHAMBER_X + CHAMBER_W - 70,
      y: CHAMBER_Y + CHAMBER_H - 70,
      width: 50,
      height: 50,
    },
    walls: [
      // S-shaped corridor
      { x: CHAMBER_X + 0, y: CHAMBER_Y + 150, width: 450, height: 10 },
      { x: CHAMBER_X + 250, y: CHAMBER_Y + 300, width: 450, height: 10 },
    ],
    seed: 123,
  },
];
