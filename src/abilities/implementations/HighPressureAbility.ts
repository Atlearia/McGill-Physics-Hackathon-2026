import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * High Pressure — Explosive push
 * Strong instant push away from center.
 * Visual: particles explode outward from cursor.
 */
export class HighPressureAbility extends PhysicsAbility {
  readonly id = 'high-pressure';
  readonly name = 'P↑';
  readonly displayName = 'High Pressure';
  readonly iconKey = 'icon-high-pressure';
  readonly category = 'fluid-dynamics';
  readonly radius = 200;
  readonly color = 0xffffff;
  readonly visualMode: VisualMode = 'particles';
  strength = 0.0012;

  /** Particles move OUTWARD */
  readonly particleDirection = 1;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    _dt: number
  ): void {
    if (dist < 1) return;
    // Strong outward impulse
    const falloff = Math.pow(1 - dist / this.radius, 1.5);
    const mag = this.strength * falloff;
    (body as any).force.x += (dx / dist) * mag;
    (body as any).force.y += (dy / dist) * mag;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    _radius: number,
    _time: number
  ): void {
    // Center glow
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(x, y, 8);
    g.fillStyle(0xffffff, 0.06);
    g.fillCircle(x, y, 20);
  }
}
