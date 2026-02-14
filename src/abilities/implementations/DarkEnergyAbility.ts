import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Dark Energy — Anti-Gravity
 * Repels balloon away from center.
 * Visual: Grid mode with grid warping OUTWARD.
 */
export class DarkEnergyAbility extends PhysicsAbility {
  readonly id = 'dark-energy';
  readonly name = 'Λ';
  readonly displayName = 'Dark Energy';
  readonly iconKey = 'icon-dark-energy';
  readonly category = 'relativity';
  readonly radius = 260;
  readonly color = 0x7c4dff;
  readonly visualMode: VisualMode = 'grid';
  strength = 0.0005;

  /** Grid warps OUTWARD (repulsion) */
  readonly warpDirection = 1;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    _dt: number
  ): void {
    if (dist < 5) return;
    // Repel away from center
    const falloff = 1 - dist / this.radius;
    const mag = this.strength * falloff * falloff;
    (body as any).force.x += (dx / dist) * mag;
    (body as any).force.y += (dy / dist) * mag;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    _time: number
  ): void {
    g.lineStyle(2, this.color, 0.15);
    g.strokeCircle(x, y, radius);
    g.lineStyle(1, this.color, 0.06);
    g.strokeCircle(x, y, radius * 0.7);
  }
}
