import Phaser from 'phaser';
import { Balloon } from '../entities/Balloon';
import { AbilityFieldInstance } from '../abilities/AbilityFieldInstance';
import { AbilityRegistry } from '../abilities/AbilityRegistry';
import { PhysicsAbility } from '../abilities/PhysicsAbility';
import { Toolbar } from '../ui/Toolbar';
import { levels, LevelConfig } from '../levels/LevelConfig';

const DEBUG = false;

// ══════════════════════════════════════════════════
// Particle for fluid dynamics visuals
// ══════════════════════════════════════════════════
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  fieldIdx: number;
}

export class GameScene extends Phaser.Scene {
  private balloon!: Balloon;
  private activeFields: AbilityFieldInstance[] = [];
  private toolbar!: Toolbar;
  private level!: LevelConfig;

  // Graphics layers
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private chamberGraphics!: Phaser.GameObjects.Graphics;
  private wallGraphics!: Phaser.GameObjects.Graphics;
  private fieldGizmos!: Phaser.GameObjects.Graphics;
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private quantumGraphics!: Phaser.GameObjects.Graphics;
  private goalGraphics!: Phaser.GameObjects.Graphics;
  private debugGraphics!: Phaser.GameObjects.Graphics;

  private wallBodies: MatterJS.BodyType[] = [];
  /** Interior wall bodies (separate so tunneling can disable them) */
  private interiorWallBodies: MatterJS.BodyType[] = [];

  // Particles for fluid dynamics
  private particles: Particle[] = [];
  private readonly MAX_PARTICLES = 400;

  // Goal
  private goalOverlapTime: number = 0;
  private readonly GOAL_DWELL_MS = 500;
  private hasWon: boolean = false;
  private goalSensor!: MatterJS.BodyType;

  // UI
  private winText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelIndex?: number }): void {
    const idx = data.levelIndex ?? 0;
    this.level = levels[idx % levels.length];
  }

  create(): void {
    this.hasWon = false;
    this.goalOverlapTime = 0;
    this.activeFields = [];
    this.wallBodies = [];
    this.interiorWallBodies = [];
    this.particles = [];

    // ─── Layers (depth order) ─────────────────────
    this.bgGraphics = this.add.graphics().setDepth(0);
    this.gridGraphics = this.add.graphics().setDepth(1);
    this.chamberGraphics = this.add.graphics().setDepth(2);
    this.wallGraphics = this.add.graphics().setDepth(3);
    this.fieldGizmos = this.add.graphics().setDepth(4);
    this.particleGraphics = this.add.graphics().setDepth(5);
    this.quantumGraphics = this.add.graphics().setDepth(6);
    this.goalGraphics = this.add.graphics().setDepth(7);
    this.debugGraphics = this.add.graphics().setDepth(100);

    // ─── Static background ────────────────────────
    this.drawBackground();

    // ─── Chamber + walls ──────────────────────────
    this.drawChamber();
    this.createChamberWalls();
    this.createInteriorWalls();

    // ─── Goal ─────────────────────────────────────
    this.createGoal();

    // ─── Balloon ──────────────────────────────────
    this.balloon = new Balloon(this, this.level.spawnX, this.level.spawnY);

    // ─── Toolbar ──────────────────────────────────
    this.toolbar = new Toolbar(this, this.level.chamber);
    const selectedAbilities = AbilityRegistry.selectRandom(10, this.level.seed);
    this.toolbar.setCards(selectedAbilities);
    this.toolbar.onPlace = (ability, x, y) => this.placeField(ability, x, y);

    // ─── UI ───────────────────────────────────────
    this.hintText = this.add.text(
      this.level.chamber.x + this.level.chamber.width / 2,
      this.scale.height - 8,
      'Drag laws into the chamber · Right-click to remove',
      { fontSize: '10px', color: '#333333', fontFamily: 'monospace' }
    );
    this.hintText.setOrigin(0.5, 1).setDepth(25);

    this.winText = this.add.text(this.scale.width / 2, this.scale.height / 2, '', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Georgia, serif', fontStyle: 'bold',
    });
    this.winText.setOrigin(0.5).setDepth(60);

    // ─── Restart button ───────────────────────────
    const restartBtn = this.add.text(
      this.level.chamber.x + this.level.chamber.width,
      this.scale.height - 8,
      '↻ Reset',
      { fontSize: '10px', color: '#444444', fontFamily: 'monospace' }
    );
    restartBtn.setOrigin(1, 1).setDepth(25);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerover', () => restartBtn.setColor('#888888'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#444444'));
    restartBtn.on('pointerdown', () => {
      this.scene.restart({ levelIndex: levels.findIndex(l => l.id === this.level.id) });
    });

    // ─── Right-click to remove ────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.removeFieldAt(pointer.x, pointer.y);
    });
    if (this.input.mouse) this.input.mouse.disableContextMenu();
    if (!(this.game as any).__ctxMenuDisabled) {
      this.game.canvas.addEventListener('contextmenu', e => e.preventDefault());
      (this.game as any).__ctxMenuDisabled = true;
    }
  }

  // ════════════════════════════════════════════════
  // UPDATE LOOP
  // ════════════════════════════════════════════════

  update(time: number, delta: number): void {
    if (this.hasWon) return;
    const dt = delta / 1000;

    // Reset balloon per-frame state
    this.balloon.resetFrameState();

    // Buoyancy
    this.balloon.applyBuoyancy();

    // Reset interior wall collision (tunneling re-disables each frame)
    for (const wb of this.interiorWallBodies) {
      (wb as any).collisionFilter.mask = 0xFFFFFFFF;
    }

    // Apply fields
    const bpos = this.balloon.getPosition();
    let activeFieldForTitle: AbilityFieldInstance | null = null;

    for (const field of this.activeFields) {
      if (!field.active) continue;
      const dx = bpos.x - field.x;
      const dy = bpos.y - field.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= field.radius) {
        field.ability.applyEffect(this, this.balloon.body, dist, dx, dy, dt);
        field.ability.applyGlobalEffect(this, this.balloon.body, this.balloon, dt);
        activeFieldForTitle = field;
      }

      // Tunneling: disable walls within radius
      if (field.ability.id === 'tunneling') {
        for (const wb of this.interiorWallBodies) {
          const wpos = (wb as any).position;
          const wdx = wpos.x - field.x;
          const wdy = wpos.y - field.y;
          const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
          if (wdist < field.radius + 50) {
            // Disable collision with balloon
            (wb as any).collisionFilter.mask = 0;
          }
        }
      }
    }

    // Update title based on active field
    if (activeFieldForTitle) {
      this.toolbar.setActiveTitle(activeFieldForTitle.ability.displayName, activeFieldForTitle.ability.color);
    } else if (this.activeFields.length > 0) {
      const last = this.activeFields[this.activeFields.length - 1];
      this.toolbar.setActiveTitle(last.ability.displayName, last.ability.color);
    } else {
      this.toolbar.setActiveTitle('', 0);
    }

    // ─── Render ───────────────────────────────────
    this.renderGrid(time);
    this.renderWalls(time);
    this.renderFields(time);
    this.updateParticles(dt, time);
    this.renderParticles();
    this.renderQuantumEffects(time);
    this.renderGoal(time);
    this.balloon.render();
    this.toolbar.render();

    if (DEBUG) this.renderDebug();
    else this.debugGraphics.clear();

    this.checkGoal(delta);
  }

  // ════════════════════════════════════════════════
  // BACKGROUND & CHAMBER
  // ════════════════════════════════════════════════

  private drawBackground(): void {
    const g = this.bgGraphics;
    g.fillStyle(0x000000, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  private drawChamber(): void {
    const g = this.chamberGraphics;
    const c = this.level.chamber;
    // Thin white border — glass chamber
    g.lineStyle(1.5, 0xffffff, 0.35);
    g.strokeRect(c.x, c.y, c.width, c.height);
    // Inner subtle line
    g.lineStyle(0.5, 0xffffff, 0.08);
    g.strokeRect(c.x + 2, c.y + 2, c.width - 4, c.height - 4);
  }

  private createChamberWalls(): void {
    const c = this.level.chamber;
    const t = 20;
    const opts = { isStatic: true, label: 'chamber-wall', friction: 0.3, restitution: 0.2 };
    this.wallBodies.push(
      this.matter.add.rectangle(c.x + c.width / 2, c.y - t / 2, c.width + t * 2, t, opts),
      this.matter.add.rectangle(c.x + c.width / 2, c.y + c.height + t / 2, c.width + t * 2, t, opts),
      this.matter.add.rectangle(c.x - t / 2, c.y + c.height / 2, t, c.height, opts),
      this.matter.add.rectangle(c.x + c.width + t / 2, c.y + c.height / 2, t, c.height, opts)
    );
  }

  private createInteriorWalls(): void {
    const opts = { isStatic: true, label: 'interior-wall', friction: 0.3, restitution: 0.2 };
    for (const wall of this.level.walls) {
      const body = this.matter.add.rectangle(
        wall.x + wall.width / 2, wall.y + wall.height / 2,
        wall.width, wall.height, opts
      );
      this.interiorWallBodies.push(body);
    }
  }

  // ════════════════════════════════════════════════
  // GRID WARPING (Mass / Dark Energy only)
  // ════════════════════════════════════════════════

  private renderGrid(time: number): void {
    const g = this.gridGraphics;
    g.clear();

    // Only render grid if there's an active grid-mode field
    const gridFields = this.activeFields.filter(f => f.ability.visualMode === 'grid' && f.active);
    if (gridFields.length === 0) return;

    const c = this.level.chamber;
    const gridSpacing = 30;
    const color = gridFields[0].ability.color;
    const pulse = Math.sin(time * 0.002) * 0.02 + 0.98;

    // Draw warped grid lines
    const warpPoint = (px: number, py: number): [number, number] => {
      let ox = px, oy = py;
      for (const field of gridFields) {
        const dx = px - field.x;
        const dy = py - field.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) continue;
        const warpDir = (field.ability as any).warpDirection ?? -1;
        const strength = 60;
        const falloff = Math.max(0, 1 - dist / (field.radius * 1.2));
        const warp = warpDir * strength * falloff * falloff * pulse;
        ox += (dx / dist) * warp;
        oy += (dy / dist) * warp;
      }
      return [ox, oy];
    };

    // Vertical lines
    for (let x = c.x; x <= c.x + c.width; x += gridSpacing) {
      g.lineStyle(0.5, color, 0.12);
      g.beginPath();
      let first = true;
      for (let y = c.y; y <= c.y + c.height; y += 4) {
        const [wx, wy] = warpPoint(x, y);
        // Clip to chamber
        if (wx < c.x || wx > c.x + c.width || wy < c.y || wy > c.y + c.height) {
          first = true;
          continue;
        }
        if (first) { g.moveTo(wx, wy); first = false; }
        else g.lineTo(wx, wy);
      }
      g.strokePath();
    }

    // Horizontal lines
    for (let y = c.y; y <= c.y + c.height; y += gridSpacing) {
      g.lineStyle(0.5, color, 0.12);
      g.beginPath();
      let first = true;
      for (let x = c.x; x <= c.x + c.width; x += 4) {
        const [wx, wy] = warpPoint(x, y);
        if (wx < c.x || wx > c.x + c.width || wy < c.y || wy > c.y + c.height) {
          first = true;
          continue;
        }
        if (first) { g.moveTo(wx, wy); first = false; }
        else g.lineTo(wx, wy);
      }
      g.strokePath();
    }

    // Warped arrow field showing direction
    const arrowStep = 50;
    for (let x = c.x + arrowStep; x < c.x + c.width; x += arrowStep) {
      for (let y = c.y + arrowStep; y < c.y + c.height; y += arrowStep) {
        const [wx, wy] = warpPoint(x, y);
        const dx = wx - x;
        const dy = wy - y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) continue;
        const alpha = Math.min(0.35, len * 0.008);
        const nx = dx / len;
        const ny = dy / len;
        const arrowLen = Math.min(12, len * 0.6);
        g.lineStyle(1, color, alpha);
        g.lineBetween(wx - nx * arrowLen, wy - ny * arrowLen, wx, wy);
        // Arrowhead
        const ha = 0.5;
        const hl = 3;
        const angle = Math.atan2(ny, nx);
        g.lineBetween(wx, wy, wx - Math.cos(angle - ha) * hl, wy - Math.sin(angle - ha) * hl);
        g.lineBetween(wx, wy, wx - Math.cos(angle + ha) * hl, wy - Math.sin(angle + ha) * hl);
      }
    }
  }

  // ════════════════════════════════════════════════
  // WALLS RENDERING (with tunneling effects)
  // ════════════════════════════════════════════════

  private renderWalls(time: number): void {
    const g = this.wallGraphics;
    g.clear();

    const tunnelingFields = this.activeFields.filter(f => f.ability.id === 'tunneling' && f.active);

    for (let wi = 0; wi < this.level.walls.length; wi++) {
      const wall = this.level.walls[wi];
      const wb = this.interiorWallBodies[wi];
      const isTunneled = (wb as any).collisionFilter.mask === 0;

      if (isTunneled) {
        // Static noise / wireframe effect
        this.renderTunneledWall(g, wall, time);
      } else {
        // Normal wall
        g.fillStyle(0xffffff, 0.15);
        g.fillRect(wall.x, wall.y, wall.width, wall.height);
        g.lineStyle(1, 0xffffff, 0.3);
        g.strokeRect(wall.x, wall.y, wall.width, wall.height);
      }
    }
  }

  private renderTunneledWall(
    g: Phaser.GameObjects.Graphics,
    wall: { x: number; y: number; width: number; height: number },
    time: number
  ): void {
    // Wireframe mesh
    const meshStep = 8;
    g.lineStyle(0.5, 0xffffff, 0.15);
    // Vertical mesh lines
    for (let x = wall.x; x <= wall.x + wall.width; x += meshStep) {
      const wobble = Math.sin(x * 0.3 + time * 0.005) * 2;
      g.lineBetween(x, wall.y + wobble, x, wall.y + wall.height + wobble);
    }
    // Horizontal mesh lines
    for (let y = wall.y; y <= wall.y + wall.height; y += meshStep) {
      const wobble = Math.cos(y * 0.3 + time * 0.004) * 2;
      g.lineBetween(wall.x + wobble, y, wall.x + wall.width + wobble, y);
    }

    // Static noise dots
    const seed = Math.floor(time * 0.06);
    g.fillStyle(0xffffff, 0.25);
    for (let i = 0; i < 40; i++) {
      const hash = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
      const frac = hash - Math.floor(hash);
      const hash2 = Math.sin(i * 269.5 + seed * 183.3) * 21345.6789;
      const frac2 = hash2 - Math.floor(hash2);
      const px = wall.x + frac * wall.width;
      const py = wall.y + frac2 * wall.height;
      g.fillRect(px, py, 1.5, 1.5);
    }
  }

  // ════════════════════════════════════════════════
  // PARTICLES (High Pressure / Vacuum)
  // ════════════════════════════════════════════════

  private updateParticles(dt: number, time: number): void {
    const particleFields = this.activeFields.filter(
      f => f.ability.visualMode === 'particles' && f.active
    );

    // Spawn new particles
    for (let fi = 0; fi < particleFields.length; fi++) {
      const field = particleFields[fi];
      const dir = (field.ability as any).particleDirection ?? 1;
      const spawnRate = 8; // per frame

      for (let i = 0; i < spawnRate; i++) {
        if (this.particles.length >= this.MAX_PARTICLES) break;

        const angle = Math.random() * Math.PI * 2;
        let startR: number, vr: number;
        if (dir > 0) {
          // Outward: start near center
          startR = 5 + Math.random() * 20;
          vr = 80 + Math.random() * 180;
        } else {
          // Inward: start at edge
          startR = field.radius * (0.7 + Math.random() * 0.3);
          vr = -(100 + Math.random() * 200);
        }

        this.particles.push({
          x: field.x + Math.cos(angle) * startR,
          y: field.y + Math.sin(angle) * startR,
          vx: Math.cos(angle) * vr,
          vy: Math.sin(angle) * vr,
          life: 0,
          maxLife: 0.4 + Math.random() * 0.6,
          fieldIdx: fi,
        });
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private renderParticles(): void {
    const g = this.particleGraphics;
    g.clear();

    for (const p of this.particles) {
      const alpha = (1 - p.life / p.maxLife) * 0.6;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const len = Math.min(speed * 0.02, 8);
      const nx = speed > 0 ? p.vx / speed : 0;
      const ny = speed > 0 ? p.vy / speed : 0;

      g.lineStyle(1, 0xffffff, alpha);
      g.lineBetween(p.x - nx * len, p.y - ny * len, p.x + nx * len, p.y + ny * len);
    }
  }

  // ════════════════════════════════════════════════
  // QUANTUM EFFECTS (Tunneling visual stripes on walls)
  // ════════════════════════════════════════════════

  private renderQuantumEffects(time: number): void {
    const g = this.quantumGraphics;
    g.clear();

    const tunnelingFields = this.activeFields.filter(f => f.ability.id === 'tunneling' && f.active);
    if (tunnelingFields.length === 0) return;

    // Vertical noise column at each tunneling field
    for (const field of tunnelingFields) {
      const c = this.level.chamber;
      const halfW = 30;
      // Noise stripe
      const seed = Math.floor(time * 0.08);
      for (let y = c.y; y < c.y + c.height; y += 3) {
        for (let x = field.x - halfW; x < field.x + halfW; x += 3) {
          const hash = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
          const val = hash - Math.floor(hash);
          if (val > 0.6) {
            g.fillStyle(0xffffff, val * 0.15);
            g.fillRect(x, y, 2, 2);
          }
        }
      }

      // Wireframe mesh at field edges
      g.lineStyle(0.5, 0xce93d8, 0.08);
      const meshStep = 15;
      for (let y = c.y; y < c.y + c.height; y += meshStep) {
        for (let x = field.x - halfW; x < field.x + halfW; x += meshStep) {
          const dx = x - field.x;
          const dy = y - (c.y + c.height / 2);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > field.radius) continue;
          // Draw small triangle
          g.lineBetween(x, y, x + meshStep, y);
          g.lineBetween(x, y, x + meshStep / 2, y + meshStep);
          g.lineBetween(x + meshStep, y, x + meshStep / 2, y + meshStep);
        }
      }
    }
  }

  // ════════════════════════════════════════════════
  // GOAL
  // ════════════════════════════════════════════════

  private createGoal(): void {
    const g = this.level.goal;
    this.goalSensor = this.matter.add.rectangle(
      g.x + g.width / 2, g.y + g.height / 2, g.width, g.height,
      { isSensor: true, isStatic: true, label: 'goal' }
    );
  }

  private renderGoal(time: number): void {
    const g = this.goalGraphics;
    g.clear();
    const goal = this.level.goal;
    const cx = goal.x + goal.width / 2;
    const cy = goal.y + goal.height / 2;
    const pulse = Math.sin(time * 0.003) * 0.15 + 0.85;

    // Diamond / 4-point star
    const outerR = 14 * pulse;
    const innerR = 6 * pulse;

    g.fillStyle(0xcccccc, 0.25 * pulse);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    // Glow
    g.fillStyle(0xffffff, 0.04 * pulse);
    g.fillCircle(cx, cy, 25);
  }

  private checkGoal(delta: number): void {
    const bpos = this.balloon.getPosition();
    const goal = this.level.goal;
    const inGoal = bpos.x >= goal.x && bpos.x <= goal.x + goal.width &&
                   bpos.y >= goal.y && bpos.y <= goal.y + goal.height;

    if (inGoal) {
      this.goalOverlapTime += delta;
      if (this.goalOverlapTime >= this.GOAL_DWELL_MS) this.onWin();
    } else {
      this.goalOverlapTime = 0;
    }
  }

  private onWin(): void {
    this.hasWon = true;
    this.winText.setText('Level Complete');

    this.time.delayedCall(1200, () => {
      const continueText = this.add.text(
        this.scale.width / 2, this.scale.height / 2 + 40,
        'Click to continue',
        { fontSize: '14px', color: '#666666', fontFamily: 'Georgia, serif' }
      );
      continueText.setOrigin(0.5).setDepth(60);

      this.input.once('pointerdown', () => {
        const idx = levels.findIndex(l => l.id === this.level.id);
        this.scene.restart({ levelIndex: (idx + 1) % levels.length });
      });
    });
  }

  // ════════════════════════════════════════════════
  // FIELD MANAGEMENT
  // ════════════════════════════════════════════════

  private placeField(ability: PhysicsAbility, x: number, y: number): void {
    this.activeFields.push(new AbilityFieldInstance(ability, x, y));
  }

  private removeFieldAt(x: number, y: number): void {
    for (let i = this.activeFields.length - 1; i >= 0; i--) {
      const field = this.activeFields[i];
      if (field.contains(x, y)) {
        const card = this.toolbar.cards.find(c => c.ability.id === field.ability.id);
        if (card) {
          card.remaining++;
          this.toolbar.refreshBadges();
        }
        field.destroy();
        this.activeFields.splice(i, 1);
        return;
      }
    }
  }

  private renderFields(time: number): void {
    this.fieldGizmos.clear();
    for (const field of this.activeFields) {
      if (!field.active) continue;
      field.ability.renderGizmo(this.fieldGizmos, field.x, field.y, field.radius, time);

      // Subtle radial glow fill
      const glowSteps = 4;
      for (let i = 0; i < glowSteps; i++) {
        const t = i / glowSteps;
        const alpha = 0.03 * (1 - t);
        this.fieldGizmos.fillStyle(field.ability.color, alpha);
        this.fieldGizmos.fillCircle(field.x, field.y, field.radius * (1 - t * 0.3));
      }
    }
  }

  // ════════════════════════════════════════════════
  // DEBUG
  // ════════════════════════════════════════════════

  private renderDebug(): void {
    const g = this.debugGraphics;
    g.clear();
    for (const field of this.activeFields) {
      g.lineStyle(1, 0xff0000, 0.5);
      g.strokeCircle(field.x, field.y, field.radius);
    }
    const bpos = this.balloon.getPosition();
    g.fillStyle(0x00ff00, 0.5);
    g.fillCircle(bpos.x, bpos.y, 3);
  }
}
