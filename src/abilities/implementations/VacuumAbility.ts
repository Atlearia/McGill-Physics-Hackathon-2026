import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Vacuum — Sink Flow
 * Strong instant pull toward center.
 * Visual: particles stream inward (dramatic radial lines).
 */
export class VacuumAbility extends PhysicsAbility {
  readonly id = 'vacuum';
  readonly name = 'P↓';
  readonly displayName = 'Fluid Dynamics (Vacuum)';
  readonly iconKey = 'icon-vacuum';
  readonly category = 'fluid-dynamics';
  readonly radius = 200;
  readonly color = 0xeeeeee;
  readonly visualMode: VisualMode = 'particles';
  strength = 0.001;

  /** Particles move INWARD */
  readonly particleDirection = -1;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    _dt: number
  ): void {
    if (dist < 5) return;
    // Strong inward pull
    const falloff = Math.pow(1 - dist / this.radius, 1.5);
    const mag = this.strength * falloff;
    (body as any).force.x -= (dx / dist) * mag;
    (body as any).force.y -= (dy / dist) * mag;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    _radius: number,
    _time: number
  ): void {
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(x, y, 6);
    g.fillStyle(0xffffff, 0.08);
    g.fillCircle(x, y, 15);
  }
}
