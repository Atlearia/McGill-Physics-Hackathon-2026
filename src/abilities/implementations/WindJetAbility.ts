import { PhysicsAbility } from '../PhysicsAbility';

/**
 * WindJet — directional flow pushing the balloon in a specific direction.
 * Like a fan blowing.
 */
export class WindJetAbility extends PhysicsAbility {
  readonly id = 'wind-jet';
  readonly name = 'Wind Jet';
  readonly iconKey = 'icon-wind';
  readonly category = 'pressure';
  readonly radius = 85;
  readonly color = 0x81d4fa;
  strength = 0.0006;

  /** Wind direction in radians (default: right = 0) */
  direction: number = 0;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    const falloff = 1 - dist / this.radius;
    const fx = Math.cos(this.direction) * this.strength * falloff;
    const fy = Math.sin(this.direction) * this.strength * falloff;
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
    const alpha = 0.12 + Math.sin(time * 0.004) * 0.04;
    graphics.lineStyle(1, this.color, alpha);
    graphics.strokeCircle(x, y, radius * 0.85);

    // Flow lines in the wind direction
    graphics.lineStyle(1, this.color, 0.2);
    const numLines = 4;
    const offset = (time * 0.05) % 30;
    for (let i = 0; i < numLines; i++) {
      const perpOffset = (i - 1.5) * 14;
      const perpX = -Math.sin(this.direction) * perpOffset;
      const perpY = Math.cos(this.direction) * perpOffset;

      for (let j = 0; j < 3; j++) {
        const startDist = -20 + j * 25 + offset;
        const endDist = startDist + 12;
        const sx = x + perpX + Math.cos(this.direction) * startDist;
        const sy = y + perpY + Math.sin(this.direction) * startDist;
        const ex = x + perpX + Math.cos(this.direction) * endDist;
        const ey = y + perpY + Math.sin(this.direction) * endDist;
        graphics.lineBetween(sx, sy, ex, ey);
      }
    }
  }
}
