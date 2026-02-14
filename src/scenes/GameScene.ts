import Phaser from 'phaser';
import { Balloon } from '../entities/Balloon';
import { AbilityFieldInstance } from '../abilities/AbilityFieldInstance';
import { AbilityRegistry } from '../abilities/AbilityRegistry';
import { PhysicsAbility } from '../abilities/PhysicsAbility';
import { Toolbar } from '../ui/Toolbar';
import { levels, LevelConfig } from '../levels/LevelConfig';

/** Set to true for debug outlines */
const DEBUG = false;

export class GameScene extends Phaser.Scene {
  private balloon!: Balloon;
  private activeFields: AbilityFieldInstance[] = [];
  private toolbar!: Toolbar;
  private level!: LevelConfig;

  private fieldGizmos!: Phaser.GameObjects.Graphics;
  private chamberGraphics!: Phaser.GameObjects.Graphics;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private goalGraphics!: Phaser.GameObjects.Graphics;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private wallBodies: MatterJS.BodyType[] = [];

  /** Goal overlap tracking */
  private goalOverlapTime: number = 0;
  private readonly GOAL_DWELL_MS = 500;
  private hasWon: boolean = false;

  /** UI elements */
  private titleText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private toolbarTitle!: Phaser.GameObjects.Text;

  /** Goal sensor */
  private goalSensor!: MatterJS.BodyType;

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

    // ─── Background ───────────────────────────────
    this.bgGraphics = this.add.graphics();
    this.bgGraphics.setDepth(0);
    this.drawBackground();

    // ─── Chamber ──────────────────────────────────
    this.chamberGraphics = this.add.graphics();
    this.chamberGraphics.setDepth(1);
    this.drawChamber();
    this.createChamberWalls();

    // ─── Interior Walls ───────────────────────────
    this.createInteriorWalls();

    // ─── Goal Zone ────────────────────────────────
    this.goalGraphics = this.add.graphics();
    this.goalGraphics.setDepth(2);
    this.createGoal();

    // ─── Balloon ──────────────────────────────────
    this.balloon = new Balloon(this, this.level.spawnX, this.level.spawnY);

    // ─── Field Gizmos Layer ───────────────────────
    this.fieldGizmos = this.add.graphics();
    this.fieldGizmos.setDepth(5);

    // ─── Debug Layer ──────────────────────────────
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(100);

    // ─── Toolbar ──────────────────────────────────
    this.toolbar = new Toolbar(this, this.level.chamber);
    const selectedAbilities = AbilityRegistry.selectRandom(10, this.level.seed);
    this.toolbar.setCards(selectedAbilities);
    this.toolbar.onPlace = (ability, x, y) => this.placeField(ability, x, y);

    // ─── UI Text ──────────────────────────────────
    this.toolbarTitle = this.add.text(12, 16, '10 LAWS', {
      fontSize: '13px',
      color: '#8eaccd',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.toolbarTitle.setDepth(25);

    this.titleText = this.add.text(
      this.level.chamber.x + this.level.chamber.width / 2,
      this.level.chamber.y - 2,
      this.level.name.toUpperCase(),
      {
        fontSize: '11px',
        color: '#555577',
        fontFamily: 'monospace',
      }
    );
    this.titleText.setOrigin(0.5, 1);
    this.titleText.setDepth(25);

    this.hintText = this.add.text(
      this.level.chamber.x + this.level.chamber.width / 2,
      this.level.chamber.y + this.level.chamber.height + 14,
      'Drag laws from the toolbar into the chamber. Right-click a placed field to remove it.',
      {
        fontSize: '10px',
        color: '#444466',
        fontFamily: 'monospace',
      }
    );
    this.hintText.setOrigin(0.5, 0);
    this.hintText.setDepth(25);

    // ─── Restart button ───────────────────────────
    const restartBtn = this.add.text(
      this.level.chamber.x + this.level.chamber.width - 4,
      this.level.chamber.y + this.level.chamber.height + 14,
      '↻ Reset',
      {
        fontSize: '11px',
        color: '#666688',
        fontFamily: 'monospace',
      }
    );
    restartBtn.setOrigin(1, 0);
    restartBtn.setDepth(25);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerover', () => restartBtn.setColor('#aaaacc'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#666688'));
    restartBtn.on('pointerdown', () => {
      const currentIdx = levels.findIndex((l) => l.id === this.level.id);
      this.scene.restart({ levelIndex: currentIdx });
    });

    this.winText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      '',
      {
        fontSize: '28px',
        color: '#a5d6a7',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }
    );
    this.winText.setOrigin(0.5);
    this.winText.setDepth(60);

    // ─── Right-click to remove fields ─────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.removeFieldAt(pointer.x, pointer.y);
      }
    });
    // Disable context menu (avoid stacking listeners on restart)
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }
    if (!(this.game as any).__ctxMenuDisabled) {
      this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      (this.game as any).__ctxMenuDisabled = true;
    }
  }

  update(time: number, delta: number): void {
    if (this.hasWon) return;

    const dt = delta / 1000;

    // ─── Buoyancy ─────────────────────────────────
    this.balloon.applyBuoyancy();

    // ─── Apply ability fields ─────────────────────
    const bpos = this.balloon.getPosition();
    for (const field of this.activeFields) {
      if (!field.active) continue;
      const dx = bpos.x - field.x;
      const dy = bpos.y - field.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= field.radius) {
        field.ability.applyEffect(this, this.balloon.body, dist, dx, dy, dt);
      }
    }

    // ─── Render ───────────────────────────────────
    this.balloon.render();
    this.toolbar.render();
    this.renderFields(time);
    this.renderGoal(time);

    if (DEBUG) this.renderDebug();
    else this.debugGraphics.clear();

    // ─── Goal check ───────────────────────────────
    this.checkGoal(delta);
  }

  // ════════════════════════════════════════════════
  // Chamber & Walls
  // ════════════════════════════════════════════════

  private drawBackground(): void {
    const g = this.bgGraphics;
    const w = this.scale.width;
    const h = this.scale.height;

    // Gradient background (simulated with bands)
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(0x10 + (0x1a - 0x10) * t);
      const gr = Math.floor(0x15 + (0x20 - 0x15) * t);
      const b = Math.floor(0x22 + (0x3e - 0x22) * t);
      const color = (r << 16) | (gr << 8) | b;
      g.fillStyle(color, 1);
      g.fillRect(0, (i / steps) * h, w, h / steps + 1);
    }
  }

  private drawChamber(): void {
    const g = this.chamberGraphics;
    const c = this.level.chamber;

    // Outer shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRoundedRect(c.x + 3, c.y + 3, c.width, c.height, 14);

    // Chamber fill
    g.fillStyle(0x0d1b2a, 0.8);
    g.fillRoundedRect(c.x, c.y, c.width, c.height, 14);

    // Glass border
    g.lineStyle(1.5, 0x3a506b, 0.5);
    g.strokeRoundedRect(c.x, c.y, c.width, c.height, 14);

    // Inner glow line
    g.lineStyle(0.5, 0x6fffe9, 0.08);
    g.strokeRoundedRect(c.x + 2, c.y + 2, c.width - 4, c.height - 4, 12);

    // Draw interior walls
    for (const wall of this.level.walls) {
      g.fillStyle(0x3a506b, 0.6);
      g.fillRoundedRect(wall.x, wall.y, wall.width, wall.height, 3);

      g.lineStyle(0.5, 0x5c7a99, 0.3);
      g.strokeRoundedRect(wall.x, wall.y, wall.width, wall.height, 3);
    }
  }

  private createChamberWalls(): void {
    const c = this.level.chamber;
    const t = 20; // wall thickness

    const wallOpts = { isStatic: true, label: 'wall', friction: 0.3, restitution: 0.2 };

    // Top
    this.wallBodies.push(
      this.matter.add.rectangle(c.x + c.width / 2, c.y - t / 2, c.width + t * 2, t, wallOpts)
    );
    // Bottom
    this.wallBodies.push(
      this.matter.add.rectangle(c.x + c.width / 2, c.y + c.height + t / 2, c.width + t * 2, t, wallOpts)
    );
    // Left
    this.wallBodies.push(
      this.matter.add.rectangle(c.x - t / 2, c.y + c.height / 2, t, c.height, wallOpts)
    );
    // Right
    this.wallBodies.push(
      this.matter.add.rectangle(c.x + c.width + t / 2, c.y + c.height / 2, t, c.height, wallOpts)
    );
  }

  private createInteriorWalls(): void {
    const wallOpts = { isStatic: true, label: 'wall', friction: 0.3, restitution: 0.2 };
    for (const wall of this.level.walls) {
      this.wallBodies.push(
        this.matter.add.rectangle(
          wall.x + wall.width / 2,
          wall.y + wall.height / 2,
          wall.width,
          wall.height,
          wallOpts
        )
      );
    }
  }

  // ════════════════════════════════════════════════
  // Goal
  // ════════════════════════════════════════════════

  private createGoal(): void {
    const g = this.level.goal;
    this.goalSensor = this.matter.add.rectangle(
      g.x + g.width / 2,
      g.y + g.height / 2,
      g.width,
      g.height,
      { isSensor: true, isStatic: true, label: 'goal' }
    );
  }

  private renderGoal(time: number): void {
    const g = this.goalGraphics;
    g.clear();

    const goal = this.level.goal;
    const pulse = Math.sin(time * 0.003) * 0.1 + 0.9;

    // Outer glow
    g.fillStyle(0xa5d6a7, 0.06 * pulse);
    g.fillRoundedRect(goal.x - 6, goal.y - 6, goal.width + 12, goal.height + 12, 10);

    // Goal area
    g.fillStyle(0x66bb6a, 0.12);
    g.fillRoundedRect(goal.x, goal.y, goal.width, goal.height, 6);

    g.lineStyle(1, 0xa5d6a7, 0.3 * pulse);
    g.strokeRoundedRect(goal.x, goal.y, goal.width, goal.height, 6);

    // Star/target in center
    const cx = goal.x + goal.width / 2;
    const cy = goal.y + goal.height / 2;
    g.fillStyle(0xa5d6a7, 0.25);
    g.fillCircle(cx, cy, 6);
    g.lineStyle(1, 0xa5d6a7, 0.15);
    g.strokeCircle(cx, cy, 12);
  }

  private checkGoal(delta: number): void {
    const bpos = this.balloon.getPosition();
    const goal = this.level.goal;

    const inGoal =
      bpos.x >= goal.x &&
      bpos.x <= goal.x + goal.width &&
      bpos.y >= goal.y &&
      bpos.y <= goal.y + goal.height;

    if (inGoal) {
      this.goalOverlapTime += delta;
      if (this.goalOverlapTime >= this.GOAL_DWELL_MS) {
        this.onWin();
      }
    } else {
      this.goalOverlapTime = 0;
    }
  }

  private onWin(): void {
    this.hasWon = true;
    this.winText.setText('Level Complete!');

    // Fade in restart prompt
    this.time.delayedCall(1200, () => {
      const restartText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 40,
        'Click to continue',
        {
          fontSize: '14px',
          color: '#8eaccd',
          fontFamily: 'monospace',
        }
      );
      restartText.setOrigin(0.5);
      restartText.setDepth(60);

      this.input.once('pointerdown', () => {
        // Find current level index and go to next
        const currentIdx = levels.findIndex((l) => l.id === this.level.id);
        const nextIdx = (currentIdx + 1) % levels.length;
        this.scene.restart({ levelIndex: nextIdx });
      });
    });
  }

  // ════════════════════════════════════════════════
  // Ability Field Management
  // ════════════════════════════════════════════════

  private placeField(ability: PhysicsAbility, x: number, y: number): void {
    const field = new AbilityFieldInstance(ability, x, y);
    this.activeFields.push(field);
  }

  private removeFieldAt(x: number, y: number): void {
    for (let i = this.activeFields.length - 1; i >= 0; i--) {
      const field = this.activeFields[i];
      if (field.contains(x, y)) {
        // Refund the ability to toolbar
        const card = this.toolbar.cards.find((c) => c.ability.id === field.ability.id);
        if (card) {
          card.remaining++;
          this.toolbar.refreshBadges();
        }
        field.destroy();
        this.activeFields.splice(i, 1);
        return; // Remove only one at a time
      }
    }
  }

  private renderFields(time: number): void {
    this.fieldGizmos.clear();
    for (const field of this.activeFields) {
      if (!field.active) continue;
      field.ability.renderGizmo(this.fieldGizmos, field.x, field.y, field.radius, time);

      // Subtle fill
      this.fieldGizmos.fillStyle(field.ability.color, 0.04);
      this.fieldGizmos.fillCircle(field.x, field.y, field.radius);
    }
  }

  // ════════════════════════════════════════════════
  // Debug
  // ════════════════════════════════════════════════

  private renderDebug(): void {
    const g = this.debugGraphics;
    g.clear();

    // Show field radii
    for (const field of this.activeFields) {
      g.lineStyle(1, 0xff0000, 0.5);
      g.strokeCircle(field.x, field.y, field.radius);
    }

    // Balloon position
    const bpos = this.balloon.getPosition();
    g.fillStyle(0x00ff00, 0.5);
    g.fillCircle(bpos.x, bpos.y, 3);
  }
}
