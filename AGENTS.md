# AGENTS.md - The Neon Cat Constitution

## 1) Operational Rules (Meta Instructions)

### Workflow
- Follow `PLANS.md` as the execution authority.
- If `PLANS.md` does not exist, create `AGENTS.md` first, then create `PLANS.md`, then execute it.
- Continue execution until the game is functionally complete, visually consistent, and judge-ready.
- If a better implementation path is discovered, update `PLANS.md` and continue under the updated plan.

### Verification + Commit Rule (Mandatory)
- After each important milestone, run verification before committing.
- Important milestones include, at minimum:
1. Project scaffold runnable
2. Renderer + mode toggle
3. Heat/Cold
4. Mass
5. High Pressure/Vacuum
6. Tunneling
7. Level 1 complete
8. 7-level system complete
9. Audio complete
10. Final polish + reference match pass
- If verification passes, create a git commit immediately. No exceptions.

### Engineering Standards
- Use clean, modular ES6+ JavaScript.
- Use HTML5 Canvas rendering by default.
- Keep dependency footprint minimal. Avoid adding libraries unless they materially reduce risk and speed delivery.
- Prioritize functionality and visual consistency over over-engineering.
- Keep files reasonably scoped and understandable.

### Physics Rule
- This project uses fake physics for visual impact and gameplay.
- Use vector-math heuristics, distance checks, radial gradients, impulse cheats, and targeted collision toggles.
- Do not implement heavy simulation systems (for example full fluid simulation).

## 2) Project Philosophy: Visual Engineering

### Primary Goal
- Deliver a stable, playable, visually striking MVP for McGill Physics Hackathon judging.

### Priority Order
1. Visual impact and consistency with provided references
2. Functional playability and stable controls
3. Physics believability (stylized, not physically exact)
4. Maintainability (important, but secondary for hackathon velocity)

### Modes
- **Normal mode**
1. Cute, colorful, neon style
2. Purple-leaning atmosphere from provided visuals
3. Physics overlays visible as designed for each tool

- **Hacker mode**
1. Same board geometry and same assets
2. Global contrast and saturation shifted to less colorful
3. Background fixed to `#050505`
4. Physics overlays hidden by default
5. Overlays only visible inside a cursor lens when tool interaction is active
6. Show the selected tool equation in the top title zone

### Lens Mechanic
- In hacker mode, physics fields (grid, vectors, particles, heatmaps, static overlays) are only rendered inside a circular cursor lens.
- Outside the lens, hide those overlays while preserving board and cat visibility.

### Fake Physics Cheats Guidance
- Acceptable techniques:
1. Radial force falloff using distance
2. One-shot impulses for pressure tools
3. Timed overlap budgets for thermal tools
4. Weak sustained attraction for mass
5. Per-wall collision bypass windows for tunneling

## 3) Functional Specifications (Physics Elements)

There are exactly 6 tools in the left vertical sidebar and all are draggable into the board.

### Tool Runtime Model
- `ToolId`: `heat`, `cold`, `mass`, `highPressure`, `vacuum`, `tunneling`
- Each drop creates a `PlacedEffect` with its own timing and visual payload.
- Tool uses are currently infinite, but UI and data model must be future-ready for limited counts.

### I. Thermodynamics (State Modifiers)

#### 1. Heat (`1.png`)
- Visual:
1. Radial orange glow around cursor
2. Outward vectors
3. No grid
- Logic:
1. Cat radius increases while applied
2. Adds extremely slight upward velocity
- Duration semantics:
1. `2s` overlap budget
2. Budget only decreases while effect overlaps the cat
3. Outside overlap, timer pauses

#### 2. Cold
- Visual:
1. Icy blue/white crystalline style
- Logic:
1. Cat radius decreases while applied
2. Adds extremely slight downward velocity
- Duration semantics:
1. `2s` overlap budget
2. Budget only decreases while effect overlaps the cat
3. Outside overlap, timer pauses

### II. General Relativity (Trajectory Modifier)

#### 3. Mass (`2.png`)
- Visual:
1. The only tool with visible background grid
2. Cyan grid warps inward toward source
- Logic:
1. Weak attraction toward field center
2. Always weaker than pressure tools
- Duration:
1. `7s` world-time lifetime
2. Can be dropped inside or outside maze

### III. Fluid Dynamics (Impulse Modifiers)

#### 4. High Pressure
- Visual:
1. Particles burst outward from cursor
- Logic:
1. Strong instant push away from source (impulse-like)

#### 5. Vacuum (`3.png`)
- Visual:
1. Particles stream inward toward source
2. No grid
- Logic:
1. Strong instant pull toward source (impulse-like)

### IV. Quantum Mechanics

#### 6. Tunneling (`4.png`)
- Visual:
1. Targeted wall segment turns static/wireframe
2. Cat shows RGB ghost split while tunneling through
- Logic:
1. Disable collision only for the targeted wall segment for a fixed TTL
2. Apply drag/slowdown while cat is traversing tunneled segment

### V. Tool Count System
- Current behavior:
1. Unlimited uses for all 6 tools
- Future-ready behavior:
1. Support count display per icon (for example `x5`)
2. Keep internal model compatible with limited counts without structural rewrite

## 4) Technical Stack & Implementation Details

### Default Stack
- HTML5 Canvas
- Vanilla ES6+ modules
- No mandatory external engine

### Minimal Architecture
- `GameLoop`
1. `requestAnimationFrame` loop
2. Delta-time updates

- `PhysicsEngine`
1. Fake force model and impulses
2. Cat motion integration
3. Circle-vs-AABB collisions
4. Tunneling collision bypass per wall segment

- `Renderer`
1. Board, walls, cat, goal rod, overlays
2. Mode-specific styling
3. Hacker lens clipping behavior

- `InputHandler`
1. Mouse position and drag states
2. Sidebar drag/drop interaction
3. Mode toggle input

### Constraints
- Minimize layers and moving parts.
- Keep runtime stable and predictable.
- Prefer explicit and readable logic over abstraction-heavy patterns.

## 5) Visual Style (Crucial)

### Reference Authority
- Match provided reference images in visual logic:
1. `Assets/VisualExamples/1.png`
2. `Assets/VisualExamples/2.png`
3. `Assets/VisualExamples/3.png`
4. `Assets/VisualExamples/4.png`
- Keep left-sidebar composition and title treatment aligned to the same visual logic as references.

### Board + Walls
- Wall look is non-negotiable.
- Use `maze_border.png` and/or `maze_border2.png` for wall aesthetic.
- Preserve the same wall identity in both modes.

### Backgrounds
- Normal mode:
1. Prefer purple neon ambiance using provided textures (`maze_border2.png` and/or `background_normal.png` if visually superior)
- Hacker mode:
1. Background fixed to `#050505`

### Cat Sprites
- Normal mode uses `cat_normal.png`.
- Hacker mode uses `cat_hacker.png`.

### Trail System
- Implement disappearing linked-list trail of previous positions.
- Color by level progression:
1. Level 1: no trail
2. Level 2: red
3. Level 3: orange
4. Level 4: yellow
5. Level 5: green
6. Level 6: blue
7. Level 7: violet/indigo family

### Goal Rod Progression
- Goal rod color progresses with levels to match rainbow theme:
1. Red
2. Orange
3. Yellow
4. Green
5. Blue
6. Indigo
7. Violet

## 6) Levels

- Total level count: **7**
- Difficulty increases progressively.
- Maze sizes remain judge-friendly (not oversized).
- Level 1 is a demo level and must match the layout vibe from `map_1_layout.png`:
1. Cat starts in upper-left region
2. Goal rod in upper-right pocket area
3. Interior blockers that encourage first-use of heat and trajectory control

### 7-Level Plan (Execution Target)

#### Level 1 - Red Rod (Demo)
- Rod color: Red
- Trail color: None
- Purpose: teach movement + heat usage
- Layout target: match `map_1_layout.png` vibe (spawn left-top, goal pocket right-top, central blockers)

#### Level 2 - Orange Rod
- Rod color: Orange
- Trail color: Red
- Purpose: introduce cold control and narrow corridors
- Layout: two turns requiring shrink timing

#### Level 3 - Yellow Rod
- Rod color: Yellow
- Trail color: Orange
- Purpose: introduce mass as weak trajectory correction
- Layout: open center with obstacles where mass can be dropped outside maze and still matter

#### Level 4 - Green Rod
- Rod color: Green
- Trail color: Yellow
- Purpose: introduce high pressure impulse solves
- Layout: dead-end recoveries requiring one-shot outward pushes

#### Level 5 - Blue Rod
- Rod color: Blue
- Trail color: Green
- Purpose: introduce vacuum pull solves
- Layout: offset chambers where inward pull lines up a path

#### Level 6 - Indigo Rod
- Rod color: Indigo
- Trail color: Blue
- Purpose: introduce tunneling wall-segment bypass
- Layout: at least one mandatory segment tunnel with drag risk

#### Level 7 - Violet Rod (Final Judge Run)
- Rod color: Violet
- Trail color: Violet/Indigo blend
- Purpose: combine all tools under timed, readable challenge
- Layout: compact multi-room maze with at least one viable path for creative tool chaining

## 7) Audio Rules

Use repo audio assets exactly:
- Mode music:
1. `theme.mp3` in normal mode
2. `hacker_theme.mp3` in hacker mode

- Tool SFX:
1. Heat uses `heat.mp3`
2. Cold uses `cold.mp3`
3. Mass uses `gravity.mp3`
4. High Pressure uses `pressure.mp3`
5. Vacuum uses `vacuum.mp3`
6. Tunneling uses `quantum.mp3`

## 8) Plans Mutability Clause

- You are allowed to modify `PLANS.md` if you find a better implementation path.
- Any update must preserve all constraints and intended meanings in this constitution.
- After updating `PLANS.md`, execution must continue under the updated plan.
