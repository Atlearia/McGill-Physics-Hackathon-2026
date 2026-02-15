# The Neon Cat MVP Constitution + Build Plan

## Summary
1. Baseline reality: current `main` contains only authoritative assets under `Assets/` and no runnable source files, so implementation will be greenfield.
2. Skill usage decision: no session skill is used because available skills (`skill-creator`, `skill-installer`) do not match this game-build task.
3. Stack decision: use HTML5 Canvas + vanilla ES modules (no framework dependency) to satisfy “less layers/fewer dependencies,” with fake-physics vector math and deterministic behavior.
4. Output sequence: create `AGENTS.md` first, derive `PLANS.md` second, then execute milestones with mandatory verification + commits after each important section.

## Planned Files And Modules
1. `AGENTS.md`
2. `PLANS.md`
3. `.gitignore`
4. `index.html`
5. `src/main.js`
6. `src/config.js`
7. `src/assets.js`
8. `src/game.js`
9. `src/levels.js`
10. `src/tools.js`
11. `src/physics.js`
12. `src/renderer.js`
13. `src/ui.js`
14. `src/audio.js`
15. `scripts/verify-assets.mjs`
16. `scripts/verify-levels.mjs`

## AGENTS.md Authoring Spec (Exact Section Contract)
1. **Operational Rules (Meta Instructions)**: enforce strict `PLANS.md` workflow, verification+commit after each important milestone, fake-physics over exact physics, ES6+ modular Canvas code, minimal dependencies.
2. **Project Philosophy: Visual Engineering**: visual impact/playability > physical correctness, normal mode vs hacker mode behavior, lens-only reveal in hacker mode, vector-math cheat patterns.
3. **Functional Specifications (Physics Elements)**: exact 6 tools only (Heat, Cold, Mass, High Pressure, Vacuum, Tunneling), visuals, logic, timing semantics, overlap-countdown rule for Heat/Cold, mass 7s lifetime, one-shot pressure/vacuum impulses, segment-only tunneling + drag, infinite counts with future-ready counter model.
4. **Technical Stack & Implementation Details**: Canvas + vanilla JS modules, minimal architecture (`GameLoop`, `PhysicsEngine`, `Renderer`, `InputHandler`), no dependency sprawl.
5. **Visual Style (Crucial)**: normal/hacker color logic, wall texture non-negotiable with `maze_border.png` / `maze_border2.png`, cat sprite swap per mode, rainbow trail progression by level, rod color progression.
6. **Levels**: exactly 7 levels, increasing complexity, level 1 modeled from `map_1_layout.png`.
7. **Plans Mutability Clause**: explicitly state implementer may modify `PLANS.md` if a better path is found while preserving prompt constraints.

## PLANS.md Authoring Spec (Execution-Ready)
1. Include ordered milestones with exact target files per milestone.
2. Include pass criteria and verification command/checklist per milestone.
3. Include required commit message suggestion per milestone.
4. Include final “polish + match references” pass.
5. Include explicit change-control rule for updating `PLANS.md` mid-execution.

## Public Interfaces / Types To Define
1. `Mode`: `'normal' | 'hacker'`.
2. `ToolId`: `'heat' | 'cold' | 'mass' | 'highPressure' | 'vacuum' | 'tunneling'`.
3. `GameState`: `{ mode, levelIndex, cat, walls, goalRod, activeEffects, ui, audio }`.
4. `CatState`: `{ x, y, vx, vy, baseRadius, radius, targetRadius, spriteKey, trail[] }`.
5. `WallSegment`: `{ id, x, y, w, h, tunnelUntilMs }`.
6. `PlacedEffect`: `{ id, toolId, x, y, radius, createdAt, remainingMs, overlapBudgetMs, active }`.
7. `LevelDef`: `{ id, name, spawn, goal, walls, recommendedToolHints }`.
8. `ToolDef`: `{ id, label, equation, iconDraw, sfxKey, apply(), renderOverlay() }`.

## Core Technical Decisions
1. Canvas size and composition: `1408x768` to match reference framing logic; centered board with left vertical sidebar and top serif title.
2. Asset mapping: use lowercase actual file names from repo (`cat_normal.png`, `cat_hacker.png`, `maze_border.png`, `maze_border2.png`, lowercase mp3 names).
3. Normal mode background: use `maze_border2.png` as tiled/fit board ambience (purple neon vibe); use `maze_border.png` pattern for wall fill/border logic.
4. Hacker mode background: hard `#050505`; same board geometry and sprites but lowered saturation/contrast.
5. Lens mechanic: physics overlays are hidden in hacker mode unless revealed inside cursor lens (soft circular clip); equations displayed when tool is selected/dragged.
6. Fake physics model: simple per-frame vector forces/impulses, clamped velocities, circle-vs-AABB collision, per-segment tunneling toggle.
7. Tool timing semantics:
   - Heat/Cold: `2s` overlap-only countdown.
   - Mass: `7s` world-time effect.
   - High Pressure/Vacuum: one-shot impulse + short particle visual TTL.
   - Tunneling: selected wall segment collision disabled for fixed TTL while applying drag to cat passing through that segment.
8. Audio logic: normal music loop `theme.mp3`; hacker music loop `hacker_theme.mp3`; play tool SFX on drop (`heat.mp3`, `cold.mp3`, `gravity.mp3`, `pressure.mp3`, `vacuum.mp3`, `quantum.mp3`).

## Milestones, Verification, Commits
| ID | Scope | Files | Verification (pass criteria) | Commit message suggestion |
|---|---|---|---|---|
| M1 | Author `AGENTS.md` constitution | `AGENTS.md` | Manual doc check: all mandatory sections + mutability clause present | `docs: add AGENTS constitution for Neon Cat MVP` |
| M2 | Author derived `PLANS.md` | `PLANS.md` | Manual doc check: milestones/files/verification/commits/final polish pass included | `docs: add granular execution plan derived from AGENTS` |
| M3 | Scaffold runnable Canvas app and asset manifest | `.gitignore`, `index.html`, `src/main.js`, `src/config.js`, `src/assets.js` | `node --check src/*.js`; run local server and confirm canvas + preload success, no console errors | `chore: bootstrap canvas runtime and asset loading` |
| M4 | Board renderer + sidebar shell + mode toggle | `src/game.js`, `src/renderer.js`, `src/ui.js` | Visual check: board framing matches references, sidebar style aligned, normal/hacker toggle works | `feat: add board renderer, sidebar shell, and mode toggle` |
| M5 | Heat + Cold with overlap-only 2s budgets | `src/tools.js`, `src/physics.js`, `src/renderer.js`, `src/audio.js` | Manual: heat expands cat + slight upward while overlapping only; cold shrinks + slight downward while overlapping only; SFX fires | `feat: implement heat and cold state modifiers` |
| M6 | Mass gravity well with cyan warped grid and 7s TTL | `src/tools.js`, `src/physics.js`, `src/renderer.js`, `src/audio.js` | Manual: drop anywhere including outside maze; weak attraction; only mass shows grid; TTL expires at ~7s | `feat: implement mass gravity well with warped grid` |
| M7 | High Pressure + Vacuum one-shot impulse tools | `src/tools.js`, `src/physics.js`, `src/renderer.js`, `src/audio.js` | Manual: high pressure strong push-out burst; vacuum strong pull-in burst; particles directionally correct; SFX correct | `feat: implement pressure and vacuum impulse tools` |
| M8 | Tunneling wall-segment disable + RGB ghost + drag | `src/tools.js`, `src/physics.js`, `src/renderer.js`, `src/audio.js` | Manual: hovered/dropped wall segment turns static/wireframe, collision disabled for segment TTL, cat shows RGB ghost while tunneling, drag applied | `feat: implement quantum tunneling segment mechanic` |
| M9 | 7-level system + level progression + rod/trail color progression | `src/levels.js`, `src/game.js`, `src/renderer.js`, `scripts/verify-levels.mjs` | `node scripts/verify-levels.mjs`; manual playthrough levels 1→7 works, level 1 resembles `map_1_layout.png`, rod colors progress R→V, trail progression starts level 2 | `feat: add seven-level progression with rainbow objectives` |
| M10 | Full audio routing and mode music switching | `src/audio.js`, `src/game.js` | Manual: mode switch crossfades/stops previous track, tool SFX on each drop, no overlapping music bug | `feat: finalize audio system for modes and tools` |
| M11 | Hacker lens + equation overlay polish + reference matching | `src/renderer.js`, `src/ui.js`, `src/config.js`, `scripts/verify-assets.mjs` | `node scripts/verify-assets.mjs`; manual side-by-side against `1.png`-`4.png` for visual logic parity; acceptable FPS and no obvious leaks | `style: polish visuals and finalize hacker lens presentation` |

## Test Cases And Acceptance Scenarios
1. App boot: no missing asset errors; canvas renders first frame.
2. Sidebar: exactly 6 tools shown; draggable into game area.
3. Normal mode: colorful neon visuals, purple-themed board ambience, cat uses `cat_normal.png`.
4. Hacker mode: near-black background, lower contrast board, cat uses `cat_hacker.png`.
5. Lens gating: in hacker mode, physics overlays hidden outside lens; visible inside lens only.
6. Equation overlay: appears for selected/dragged tool and matches tool identity.
7. Heat: overlap-only timer decrements; cat radius increases; slight upward velocity; timer pauses when not overlapping.
8. Cold: overlap-only timer decrements; cat radius decreases; slight downward velocity; timer pauses when not overlapping.
9. Mass: weak sustained attraction; cyan warped grid appears only for mass; 7s expiry.
10. High Pressure: instant strong outward impulse; outward particle burst.
11. Vacuum: instant strong inward impulse; inward particle stream.
12. Tunneling: selected wall segment collision disabled for TTL; static/wireframe shown on segment; cat RGB ghost and drag while passing.
13. Audio mode tracks: `theme.mp3` always in normal, `hacker_theme.mp3` always in hacker.
14. Tool SFX mapping: heat/cold/gravity/pressure/vacuum/quantum play on drop.
15. Goal rod: reaching rod completes level; rod color progression across 7 levels (red, orange, yellow, green, blue, indigo, violet).
16. Trail progression: level 1 none; levels 2-7 rainbow progression.
17. Level 1 layout vibe: matches `map_1_layout.png` structure (spawn left-upper area, pocketed goal right-upper area, central blockers).
18. Stability: repeated tool usage does not crash; long-run play remains responsive.
19. Collision robustness: no obvious cat clipping except intended tunneled segments.
20. Regression: mode switching during active effects preserves gameplay state without reset.

## Assumptions And Defaults (Locked)
1. Lowercase filenames in repo are authoritative; code will reference exact lowercase paths.
2. `pressure.mp3` is assigned to High Pressure tool (extra valid SFX not explicitly listed in prompt but present in authoritative assets).
3. Wall aesthetic priority: `maze_border.png`/`maze_border2.png` must drive wall rendering; no flat substitute style allowed.
4. No dependency framework will be added unless blocked by a critical delivery issue; default implementation is vanilla Canvas.
5. `PLANS.md` may be updated during execution when a better path is discovered, and updates must preserve all non-negotiables.
6. Execution and commits begin immediately after this plan is accepted for implementation mode; each milestone must pass verification before commit.

