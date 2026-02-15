# PLANS.md - Neon Cat Execution Plan

This file is the execution authority. If a better path is found, update this file and continue under the updated plan while preserving all constraints from `AGENTS.md`.

## Assumptions
- Asset filenames and paths are case-sensitive and authoritative from this repo:
  - Visual: `Assets/VisualExamples/*.png`
  - Audio: `Assets/Audios/*.mp3`
- `pressure.mp3` is used for the High Pressure tool.
- Implementation is vanilla HTML5 Canvas + ES modules unless a blocker appears.

## Milestone Order (Mandatory)

### M1. Project scaffold runnable
- Files:
  - `.gitignore`
  - `index.html`
  - `src/main.js`
  - `src/config.js`
  - `src/assets.js`
  - `src/game.js`
- Verify:
  - `node --check src/main.js src/config.js src/assets.js src/game.js`
  - App boots with a canvas and no missing-asset runtime exceptions.
- Commit suggestion:
  - `chore: bootstrap neon cat canvas scaffold`

### M2. Renderer shell + mode toggle
- Files:
  - `src/renderer.js`
  - `src/input.js`
  - `src/game.js`
  - `src/config.js`
- Verify:
  - `node --check src/renderer.js src/input.js src/game.js`
  - Sidebar renders on left, board/walls render, normal/hacker toggle works.
- Commit suggestion:
  - `feat: add renderer shell with normal and hacker modes`

### M3. Heat + Cold tools
- Files:
  - `src/tools.js`
  - `src/physics.js`
  - `src/renderer.js`
  - `src/game.js`
- Verify:
  - `node --check src/tools.js src/physics.js src/renderer.js src/game.js`
  - Heat and cold are draggable, overlap-only 2s budgets work, cat size and slight vertical velocity change while overlapping.
- Commit suggestion:
  - `feat: implement heat and cold overlap-budget mechanics`

### M4. Mass tool
- Files:
  - `src/tools.js`
  - `src/physics.js`
  - `src/renderer.js`
  - `src/game.js`
- Verify:
  - `node --check src/tools.js src/physics.js src/renderer.js src/game.js`
  - Mass can be dropped inside/outside maze, lasts 7s, weak attraction, cyan grid overlay only for mass.
- Commit suggestion:
  - `feat: add mass gravity well with 7s lifetime`

### M5. High Pressure + Vacuum tools
- Files:
  - `src/tools.js`
  - `src/physics.js`
  - `src/renderer.js`
  - `src/game.js`
- Verify:
  - `node --check src/tools.js src/physics.js src/renderer.js src/game.js`
  - High pressure gives strong outward impulse; vacuum gives strong inward impulse; both have directional particle visuals.
- Commit suggestion:
  - `feat: add pressure and vacuum impulse tools`

### M6. Tunneling tool
- Files:
  - `src/tools.js`
  - `src/physics.js`
  - `src/renderer.js`
  - `src/game.js`
- Verify:
  - `node --check src/tools.js src/physics.js src/renderer.js src/game.js`
  - A targeted wall segment gets tunnel TTL, collision bypass is segment-specific, cat slows while traversing tunneled segment, RGB ghost appears.
- Commit suggestion:
  - `feat: implement tunneling collision bypass per wall segment`

### M7. Level 1 completion target
- Files:
  - `src/levels.js`
  - `src/game.js`
  - `src/renderer.js`
- Verify:
  - `node --check src/levels.js src/game.js src/renderer.js`
  - Level 1 layout matches `map_1_layout.png` vibe: upper-left spawn, upper-right pocket goal, central blockers encouraging heat/trajectory control.
- Commit suggestion:
  - `feat: finalize level 1 demo layout and progression hook`

### M8. Seven-level system complete
- Files:
  - `src/levels.js`
  - `src/game.js`
  - `src/renderer.js`
  - `scripts/verify-levels.mjs`
- Verify:
  - `node scripts/verify-levels.mjs`
  - Level progression 1 through 7 works, rod colors progress rainbow, trail color progression is correct by level.
- Commit suggestion:
  - `feat: add full seven-level progression with rainbow rod and trail`

### M9. Audio complete
- Files:
  - `src/audio.js`
  - `src/game.js`
- Verify:
  - `node --check src/audio.js src/game.js`
  - Normal mode uses `theme.mp3`, hacker mode uses `hacker_theme.mp3`, each tool plays mapped SFX on drop/use.
- Commit suggestion:
  - `feat: wire mode music and tool sfx mappings`

### M10. Final polish + reference match pass
- Files:
  - `src/renderer.js`
  - `src/config.js`
  - `src/ui.js`
  - `scripts/verify-assets.mjs`
- Verify:
  - `node scripts/verify-assets.mjs`
  - `node --check src/*.js`
  - Visual logic aligns with references `1.png` to `4.png`, wall aesthetic is preserved with `maze_border.png`/`maze_border2.png`, hacker lens mechanic and equation overlay are working.
- Commit suggestion:
  - `style: polish visuals and finalize reference match`

## Runtime Acceptance Checklist
- Exactly 6 draggable sidebar tools exist: `heat`, `cold`, `mass`, `highPressure`, `vacuum`, `tunneling`.
- Normal mode is colorful/cute and uses normal cat sprite.
- Hacker mode uses `#050505`, lower contrast, hacker cat sprite, lens-only overlay reveal, and selected-tool equation at top.
- Fake physics is used (vector falloff, impulse cheats, overlap timers, segment tunnel TTL).
- Level count is exactly 7 with increasing challenge.
- Goal rod and trail follow rainbow progression rules.
- Tools are infinite-use now but model supports future limited-count display.
