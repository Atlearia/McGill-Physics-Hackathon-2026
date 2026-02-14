import { PhysicsAbility } from '../PhysicsAbility';

/**
 * Repels the balloon away from the field center (high pressure zone).
 */
export class HighPressureAbility extends PhysicsAbility {
  readonly id = 'high-pressure';
  readonly name = 'High Pressure';
  readonly iconKey = 'icon-high-pressure';
  readonly category = 'pressure';
  readonly radius = 80;
  readonly color = 0xff8a65;
  strength = 0.0008;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    _dt: number
  ): void {
    if (dist < 1) return;
    // Force away from center, stronger when closer
    const falloff = 1 - dist / this.radius;
    const magnitude = this.strength * falloff;
    const fx = (dx / dist) * magnitude;
    const fy = (dy / dist) * magnitude;
    (body as any).force.x += fx;
    (body as any).force.y += fy;
  }

  renderGizmo(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Concentric circles pulsing outward
    const pulse = Math.sin(time * 0.003) * 0.15 + 0.85;
    for (let i = 0; i < 3; i++) {
      const r = radius * (0.3 + i * 0.3) * (2 - pulse);
      const alpha = 0.15 - i * 0.03;
      graphics.lineStyle(1, this.color, alpha);
      graphics.strokeCircle(x, y, Math.min(r, radius));
    }
    // Outward arrows
    graphics.lineStyle(1, this.color, 0.2);
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const a of angles) {
      const ax = x + Math.cos(a) * radius * 0.35;
      const ay = y + Math.sin(a) * radius * 0.35;
      const tipX = x + Math.cos(a) * radius * 0.65;
      const tipY = y + Math.sin(a) * radius * 0.65;
      graphics.lineBetween(ax, ay, tipX, tipY);
    }
  }
}
