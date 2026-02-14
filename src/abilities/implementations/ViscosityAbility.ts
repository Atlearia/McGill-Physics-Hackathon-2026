import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Viscosity — The Brake
 * Slows velocity within radius.
 */
export class ViscosityAbility extends PhysicsAbility {
  readonly id = 'viscosity';
  readonly name = 'η';
  readonly displayName = 'Viscosity';
  readonly iconKey = 'icon-viscosity';
  readonly category = 'material';
  readonly radius = 150;
  readonly color = 0x78909c;
  readonly visualMode: VisualMode = 'none';
  strength = 0.025;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    const falloff = 1 - dist / this.radius;
    const damping = this.strength * falloff;
    const vel = (body as any).velocity;
    (body as any).force.x -= vel.x * damping;
    (body as any).force.y -= vel.y * damping;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Horizontal viscous flow lines
    const step = 14;
    const phase = time * 0.002;
    for (let ly = y - radius * 0.8; ly <= y + radius * 0.8; ly += step) {
      const dy = ly - y;
      const halfW = Math.sqrt(Math.max(0, radius * radius * 0.64 - dy * dy));
      if (halfW < 10) continue;
      const alpha = 0.08 * (1 - Math.abs(dy) / (radius * 0.8));

      // Wavy horizontal line
      g.lineStyle(0.8, this.color, alpha);
      g.beginPath();
      for (let lx = x - halfW; lx <= x + halfW; lx += 4) {
        const wx = lx + Math.sin((lx - x) * 0.05 + phase) * 3;
        const wy = ly + Math.sin((lx - x) * 0.08 + phase) * 2;
        if (lx === x - halfW) g.moveTo(wx, wy);
        else g.lineTo(wx, wy);
      }
      g.strokePath();
    }
  }
}
