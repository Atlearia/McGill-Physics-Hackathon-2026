import Phaser from 'phaser';

/**
 * Balloon entity — Matter body with dynamic radius, trail, glow, and quantum ghost mode.
 */
export class Balloon {
  scene: Phaser.Scene;
  body: MatterJS.BodyType;
  private sprite: Phaser.GameObjects.Graphics;
  private trailGraphics: Phaser.GameObjects.Graphics;

  /** Base radius — the default */
  baseRadius: number = 18;
  /** Current visual radius (smoothly interpolates toward targetRadius) */
  displayRadius: number = 18;
  /** Target radius (set by abilities like Heat/Cold) */
  targetRadius: number = 18;

  /** Glow */
  glowColor: number = 0xffffff;
  glowIntensity: number = 0.15;

  /** Quantum tunneling mode — renders RGB ghost spheres */
  quantumMode: boolean = false;

  /** Trail history */
  private trail: { x: number; y: number }[] = [];
  private readonly MAX_TRAIL = 120;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    this.body = scene.matter.add.circle(x, y, this.baseRadius, {
      restitution: 0.3,
      friction: 0.05,
      frictionAir: 0.018,
      density: 0.0005,
      label: 'balloon',
    });

    const MatterBody = (Phaser.Physics.Matter as any).Matter.Body;
    MatterBody.setInertia(this.body, Infinity);

    this.trailGraphics = scene.add.graphics();
    this.trailGraphics.setDepth(8);

    this.sprite = scene.add.graphics();
    this.sprite.setDepth(10);
  }

  /** Reset per-frame state (called before abilities apply) */
  resetFrameState(): void {
    this.targetRadius = this.baseRadius;
    this.glowColor = 0xffffff;
    this.glowIntensity = 0.15;
    this.quantumMode = false;
    // Reset restitution to default
    (this.body as any).restitution = 0.3;
  }

  applyBuoyancy(): void {
    const mass = (this.body as any).mass;
    const gravityY = 0.3;
    const gravityScale = 0.001;
    const buoyancyFraction = 0.80;
    (this.body as any).force.y -= mass * gravityY * gravityScale * buoyancyFraction;
  }

  render(): void {
    const x = (this.body as any).position.x;
    const y = (this.body as any).position.y;

    // Smooth radius interpolation
    this.displayRadius += (this.targetRadius - this.displayRadius) * 0.08;
    const r = this.displayRadius;

    // Update trail
    this.trail.push({ x, y });
    if (this.trail.length > this.MAX_TRAIL) this.trail.shift();

    // ─── Render trail ─────────────────────────────
    this.trailGraphics.clear();
    if (this.trail.length > 2) {
      for (let i = 1; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        const alpha = t * t * 0.25;
        const width = t * 2.5;
        this.trailGraphics.lineStyle(width, 0xffffff, alpha);
        this.trailGraphics.lineBetween(
          this.trail[i - 1].x, this.trail[i - 1].y,
          this.trail[i].x, this.trail[i].y
        );
      }
    }

    // ─── Render balloon ───────────────────────────
    this.sprite.clear();

    if (this.quantumMode) {
      this.renderQuantumGhosts(x, y, r);
    } else {
      this.renderNormal(x, y, r);
    }
  }

  private renderNormal(x: number, y: number, r: number): void {
    // Outer glow
    this.sprite.fillStyle(this.glowColor, this.glowIntensity * 0.5);
    this.sprite.fillCircle(x, y, r + 15);
    this.sprite.fillStyle(this.glowColor, this.glowIntensity);
    this.sprite.fillCircle(x, y, r + 6);

    // Main body — soft white with slight tint
    this.sprite.fillStyle(0xf5f5f5, 0.95);
    this.sprite.fillCircle(x, y, r);

    // Highlight
    this.sprite.fillStyle(0xffffff, 0.5);
    this.sprite.fillCircle(x - r * 0.25, y - r * 0.3, r * 0.3);

    // Edge shadow
    this.sprite.lineStyle(1.5, 0xcccccc, 0.3);
    this.sprite.strokeCircle(x, y, r);

    // String
    this.sprite.lineStyle(1.2, 0xffffff, 0.3);
    const knot = r + 2;
    const stringLen = r + 22;
    this.sprite.lineBetween(x, y + knot, x - 3, y + stringLen);
    this.sprite.fillStyle(0xdddddd, 0.4);
    this.sprite.fillCircle(x, y + knot, 2.5);

    // Crosshair on balloon
    this.sprite.lineStyle(1, 0x333333, 0.3);
    this.sprite.lineBetween(x - 6, y, x + 6, y);
    this.sprite.lineBetween(x, y - 6, x, y + 6);
  }

  private renderQuantumGhosts(x: number, y: number, r: number): void {
    // Main balloon (white, slightly transparent)
    this.sprite.fillStyle(0xffffff, 0.7);
    this.sprite.fillCircle(x, y, r);

    // RGB ghost spheres offset
    const offset = r * 0.7;

    // Red ghost
    this.sprite.fillStyle(0xff0000, 0.25);
    this.sprite.fillCircle(x - offset * 0.5, y, r * 0.95);

    // Green ghost (overlay)
    this.sprite.fillStyle(0x00ff00, 0.15);
    this.sprite.fillCircle(x, y - offset * 0.3, r * 0.95);

    // Blue ghost (ahead)
    this.sprite.fillStyle(0x0000ff, 0.25);
    this.sprite.fillCircle(x + offset * 0.8, y, r * 0.85);

    // White core
    this.sprite.fillStyle(0xffffff, 0.4);
    this.sprite.fillCircle(x, y, r * 0.5);

    // Highlight
    this.sprite.fillStyle(0xffffff, 0.3);
    this.sprite.fillCircle(x - r * 0.2, y - r * 0.2, r * 0.2);

    // String
    this.sprite.lineStyle(1, 0xffffff, 0.2);
    this.sprite.lineBetween(x, y + r + 2, x - 3, y + r + 20);

    // Dashed connection line from trail
    if (this.trail.length > 5) {
      const pt = this.trail[this.trail.length - 5];
      this.sprite.lineStyle(1, 0xffffff, 0.15);
      const steps = 8;
      for (let i = 0; i < steps; i += 2) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        this.sprite.lineBetween(
          pt.x + (x - pt.x) * t1, pt.y + (y - pt.y) * t1,
          pt.x + (x - pt.x) * t2, pt.y + (y - pt.y) * t2
        );
      }
    }
  }

  getPosition(): { x: number; y: number } {
    return {
      x: (this.body as any).position.x,
      y: (this.body as any).position.y,
    };
  }

  destroy(): void {
    this.scene.matter.world.remove(this.body);
    this.sprite.destroy();
    this.trailGraphics.destroy();
  }
}
