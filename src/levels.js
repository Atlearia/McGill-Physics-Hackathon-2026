import { BOARD_RECT } from "./config.js";

function wall(id, x, y, w, h) {
  return { id, x, y, w, h, tunnelUntilMs: 0 };
}

export const RAINBOW = ["#ff3b3b", "#ff9b32", "#ffe054", "#48f06a", "#52a8ff", "#5d6bff", "#bf55ff"];

const LEVEL_1_WALLS = [
  wall("l1_v1", BOARD_RECT.x + 96, BOARD_RECT.y + 96, 6, 465),
  wall("l1_h1", BOARD_RECT.x + 96, BOARD_RECT.y + 96, 250, 6),
  wall("l1_v2", BOARD_RECT.x + 340, BOARD_RECT.y + 96, 6, 250),
  wall("l1_v3", BOARD_RECT.x + 460, BOARD_RECT.y + 96, 6, 248),
  wall("l1_h2", BOARD_RECT.x + 340, BOARD_RECT.y + 340, 230, 6),
  wall("l1_v4", BOARD_RECT.x + 676, BOARD_RECT.y + 96, 6, 380),
  wall("l1_v5", BOARD_RECT.x + 788, BOARD_RECT.y + 96, 6, 278),
  wall("l1_h3", BOARD_RECT.x + 676, BOARD_RECT.y + 374, 112, 6),
];

export function getLevelDefinitions() {
  return [
    {
      id: 1,
      name: "Level 1 - Demo",
      spawn: { x: BOARD_RECT.x + 165, y: BOARD_RECT.y + 195 },
      goal: { x: BOARD_RECT.x + 760, y: BOARD_RECT.y + 126, w: 16, h: 46 },
      rodColor: RAINBOW[0],
      trailColor: null,
      walls: LEVEL_1_WALLS.map((segment) => ({ ...segment })),
      hint: "Use Heat to expand and arc into the upper-right pocket.",
      teaches: ["heat"],
    },
  ];
}
