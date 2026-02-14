import Phaser from 'phaser';

/**
 * Balloon entity — a Matter body with light damping and buoyancy.
 */
export class Balloon {
  scene: Phaser.Scene;
  body: MatterJS.BodyType;
  sprite: Phaser.GameObjects.Graphics;
  radius: number = 14;

  // For glow/highlight rendering
  private glowGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create Matter circle body
    this.body = scene.matter.add.circle(x, y, this.radius, {
      restitution: 0.3,
      friction: 0.05,
      frictionAir: 0.02,
      density: 0.0005,
      label: 'balloon',
    });

    // Lock rotation so it doesn't spin wildly
    const MatterBody = (Phaser.Physics.Matter as any).Matter.Body;
    MatterBody.setInertia(this.body, Infinity);

    // Visual — drawn each frame
    this.sprite = scene.add.graphics();
    this.sprite.setDepth(10);

    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.setDepth(9);
  }

  /** Apply slight buoyancy each frame — nearly counteracts gravity for a floaty feel */
  applyBuoyancy(): void {
    // Matter.js applies gravity as:
    //   body.force.y += body.mass * gravity.y * gravity.scale (0.001) * body.gravityScale (1)
    // We counteract ~80% for a gentle downward drift
    const mass = (this.body as any).mass;
    const gravityY = 0.3; // must match game config
    const gravityScale = 0.001; // Matter.js default
    const buoyancyFraction = 0.80;
    (this.body as any).force.y -= mass * gravityY * gravityScale * buoyancyFraction;
  }

  /** Render the balloon at its current physics position */
  render(): void {
    const x = (this.body as any).position.x;
    const y = (this.body as any).position.y;

    // Outer glow
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(0xff7043, 0.08);
    this.glowGraphics.fillCircle(x, y, this.radius + 8);
    this.glowGraphics.fillStyle(0xff7043, 0.04);
    this.glowGraphics.fillCircle(x, y, this.radius + 14);

    // Balloon body
    this.sprite.clear();

    // Main fill — soft coral/salmon
    this.sprite.fillStyle(0xff7043, 0.9);
    this.sprite.fillCircle(x, y, this.radius);

    // Highlight
    this.sprite.fillStyle(0xffffff, 0.25);
    this.sprite.fillCircle(x - 4, y - 4, this.radius * 0.35);

    // Outline
    this.sprite.lineStyle(1.5, 0xe64a19, 0.6);
    this.sprite.strokeCircle(x, y, this.radius);

    // String
    this.sprite.lineStyle(1, 0xbdbdbd, 0.4);
    this.sprite.lineBetween(x, y + this.radius, x, y + this.radius + 18);
    // Tiny knot
    this.sprite.fillStyle(0xe64a19, 0.5);
    this.sprite.fillCircle(x, y + this.radius + 1, 2);
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
    this.glowGraphics.destroy();
  }
}
