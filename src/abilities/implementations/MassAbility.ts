import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Mass — Gravity Well
 * Attracts balloon toward center over time.
 * Visual: THE ONLY mode with a background grid. Grid warps inward. Cyan.
 */
export class MassAbility extends PhysicsAbility {
  readonly id = 'mass';
  readonly name = 'M';
  readonly displayName = 'Gravity Well';
  readonly iconKey = 'icon-mass';
  readonly category = 'relativity';
  readonly radius = 280;
  readonly color = 0x00e5ff;
  readonly visualMode: VisualMode = 'grid';
  strength = 0.0006;

  /** Grid warps INWARD (attraction) */
  readonly warpDirection = -1;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    _dt: number
  ): void {
    if (dist < 5) return;
    // Attract toward center — stronger closer
    const falloff = 1 - dist / this.radius;
    const mag = this.strength * falloff * falloff;
    (body as any).force.x -= (dx / dist) * mag;
    (body as any).force.y -= (dy / dist) * mag;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    _time: number
  ): void {
    // Radius circle glow
    g.lineStyle(2, this.color, 0.15);
    g.strokeCircle(x, y, radius);
    g.lineStyle(1, this.color, 0.06);
    g.strokeCircle(x, y, radius * 0.7);
    g.strokeCircle(x, y, radius * 0.4);
  }
}
