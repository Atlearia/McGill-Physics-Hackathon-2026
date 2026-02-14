import { PhysicsAbility } from '../PhysicsAbility';

/**
 * Applies a constant directional gravity pull within radius.
 * Direction defaults to downward but can be configured.
 */
export class GravityAbility extends PhysicsAbility {
  readonly id = 'gravity';
  readonly name = 'Gravity Well';
  readonly iconKey = 'icon-gravity';
  readonly category = 'gravity';
  readonly radius = 90;
  readonly color = 0xce93d8;
  strength = 0.0006;

  /** Direction of gravity in radians (default: down = PI/2) */
  direction: number = Math.PI / 2;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    // Constant directional force with distance falloff
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
    // Warping ring
    const alpha = 0.12 + Math.sin(time * 0.003) * 0.05;
    graphics.lineStyle(1.5, this.color, alpha);
    graphics.strokeCircle(x, y, radius * 0.85);

    // Directional arrows showing pull direction
    graphics.lineStyle(1, this.color, 0.25);
    const arrowLen = 18;
    const numArrows = 5;
    for (let i = 0; i < numArrows; i++) {
      const offset = (i - 2) * 16;
      const perpX = -Math.sin(this.direction) * offset;
      const perpY = Math.cos(this.direction) * offset;
      const startX = x + perpX - Math.cos(this.direction) * arrowLen * 0.5;
      const startY = y + perpY - Math.sin(this.direction) * arrowLen * 0.5;
      const endX = x + perpX + Math.cos(this.direction) * arrowLen * 0.5;
      const endY = y + perpY + Math.sin(this.direction) * arrowLen * 0.5;
      graphics.lineBetween(startX, startY, endX, endY);
      // Arrowhead
      const headLen = 5;
      const headAngle = 0.5;
      graphics.lineBetween(
        endX,
        endY,
        endX - Math.cos(this.direction - headAngle) * headLen,
        endY - Math.sin(this.direction - headAngle) * headLen
      );
      graphics.lineBetween(
        endX,
        endY,
        endX - Math.cos(this.direction + headAngle) * headLen,
        endY - Math.sin(this.direction + headAngle) * headLen
      );
    }
  }
}
