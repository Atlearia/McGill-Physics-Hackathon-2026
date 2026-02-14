import { PhysicsAbility } from '../PhysicsAbility';

/**
 * Slows balloon motion (increases damping) — cold zone.
 */
export class ColdAbility extends PhysicsAbility {
  readonly id = 'cold';
  readonly name = 'Cold';
  readonly iconKey = 'icon-cold';
  readonly category = 'temperature';
  readonly radius = 70;
  readonly color = 0x80deea;
  strength = 0.92; // velocity damping multiplier per frame

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    // Slow down velocity — stronger near center
    const falloff = 1 - dist / this.radius;
    const damping = 1 - (1 - this.strength) * falloff;
    const vel = (body as any).velocity;
    // Apply as opposing force (damping)
    (body as any).force.x += vel.x * (damping - 1) * 0.02;
    (body as any).force.y += vel.y * (damping - 1) * 0.02;
  }

  renderGizmo(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Frost sparkle — dashed circle with slow pulse
    const alpha = 0.12 + Math.sin(time * 0.002) * 0.05;
    graphics.lineStyle(1, this.color, alpha);
    // Draw dashed circle
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        graphics.lineBetween(
          x + Math.cos(a1) * radius * 0.85,
          y + Math.sin(a1) * radius * 0.85,
          x + Math.cos(a2) * radius * 0.85,
          y + Math.sin(a2) * radius * 0.85
        );
      }
    }
    // Small snowflake-like dots
    const numDots = 6;
    const phase = time * 0.001;
    graphics.fillStyle(this.color, 0.2);
    for (let i = 0; i < numDots; i++) {
      const a = (i / numDots) * Math.PI * 2 + phase;
      const r = radius * 0.5;
      graphics.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, 2);
    }
  }
}
