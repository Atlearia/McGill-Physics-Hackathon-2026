import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Heat — Thermal Expansion
 * Increases balloon radius, adds outward radial velocity.
 * Visual: radial orange gradient + outward vector arrows.
 */
export class HeatAbility extends PhysicsAbility {
  readonly id = 'heat';
  readonly name = 'ΔT↑';
  readonly displayName = 'Thermal Expansion';
  readonly iconKey = 'icon-heat';
  readonly category = 'thermodynamics';
  readonly radius = 220;
  readonly color = 0xff6b35;
  readonly visualMode: VisualMode = 'vectors';
  strength = 0.0004;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    _dt: number
  ): void {
    if (dist < 1) return;
    const falloff = 1 - dist / this.radius;
    // Outward radial push
    const mag = this.strength * falloff;
    (body as any).force.x += (dx / dist) * mag;
    (body as any).force.y += (dy / dist) * mag;
  }

  applyGlobalEffect(
    _scene: Phaser.Scene,
    _body: MatterJS.BodyType,
    balloon: any,
    _dt: number
  ): void {
    // Expand balloon visually
    balloon.targetRadius = Math.min(balloon.baseRadius * 1.8, balloon.targetRadius + 0.3);
    balloon.glowColor = 0xff6b35;
    balloon.glowIntensity = 0.6;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Radial gradient rings
    const pulse = Math.sin(time * 0.003) * 0.05 + 0.95;
    for (let r = 0.2; r <= 1.0; r += 0.15) {
      const rr = radius * r * pulse;
      const alpha = 0.12 * (1 - r);
      g.lineStyle(1, this.color, alpha);
      g.strokeCircle(x, y, rr);
    }

    // Outward pointing vector arrows in a grid
    const step = 35;
    const arrowLen = 10;
    for (let ax = x - radius; ax <= x + radius; ax += step) {
      for (let ay = y - radius; ay <= y + radius; ay += step) {
        const ddx = ax - x;
        const ddy = ay - y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < 15 || d > radius * 0.95) continue;
        const falloff = 1 - d / radius;
        const nx = ddx / d;
        const ny = ddy / d;
        const alpha = 0.35 * falloff;
        g.lineStyle(1.5, this.color, alpha);

        const endX = ax + nx * arrowLen;
        const endY = ay + ny * arrowLen;
        g.lineBetween(ax, ay, endX, endY);
        // Arrowhead
        const ha = 0.5;
        const hl = 4;
        const angle = Math.atan2(ny, nx);
        g.lineBetween(endX, endY, endX - Math.cos(angle - ha) * hl, endY - Math.sin(angle - ha) * hl);
        g.lineBetween(endX, endY, endX - Math.cos(angle + ha) * hl, endY - Math.sin(angle + ha) * hl);
      }
    }
  }
}
