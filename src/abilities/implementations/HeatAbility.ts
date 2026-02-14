import { PhysicsAbility } from '../PhysicsAbility';

/**
 * Increases balloon motion (boosts velocity, reduces damping) — warm zone.
 */
export class HeatAbility extends PhysicsAbility {
  readonly id = 'heat';
  readonly name = 'Heat';
  readonly iconKey = 'icon-heat';
  readonly category = 'temperature';
  readonly radius = 70;
  readonly color = 0xef5350;
  strength = 1.08; // velocity multiplier per frame

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    // Boost velocity slightly — stronger near center
    const falloff = 1 - dist / this.radius;
    const boost = 1 + (this.strength - 1) * falloff;
    const vel = (body as any).velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    // Clamp max speed to avoid chaos
    if (speed < 4) {
      (body as any).force.x += vel.x * (boost - 1) * 0.01;
      (body as any).force.y += vel.y * (boost - 1) * 0.01;
    }
    // Also add a tiny random jitter (thermal noise)
    (body as any).force.x += (Math.random() - 0.5) * 0.00015 * falloff;
    (body as any).force.y += (Math.random() - 0.5) * 0.00015 * falloff;
  }

  renderGizmo(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Warm shimmer — wavy circle
    const segments = 32;
    const alpha = 0.15 + Math.sin(time * 0.004) * 0.05;
    graphics.lineStyle(1.5, this.color, alpha);
    graphics.beginPath();
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const wobble = Math.sin(a * 4 + time * 0.005) * 3;
      const r = radius * 0.85 + wobble;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) graphics.moveTo(px, py);
      else graphics.lineTo(px, py);
    }
    graphics.strokePath();
    // Inner glow
    graphics.fillStyle(this.color, 0.04);
    graphics.fillCircle(x, y, radius * 0.5);
  }
}
