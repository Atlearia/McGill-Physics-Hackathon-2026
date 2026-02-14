import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Elasticity — The Bounce
 * Sets perfect conservation of momentum on walls (restitution = 1).
 */
export class ElasticityAbility extends PhysicsAbility {
  readonly id = 'elasticity';
  readonly name = 'k';
  readonly displayName = 'Elasticity';
  readonly iconKey = 'icon-elasticity';
  readonly category = 'material';
  readonly radius = 140;
  readonly color = 0xaed581;
  readonly visualMode: VisualMode = 'none';
  strength = 1;

  applyEffect(
    _scene: Phaser.Scene,
    _body: MatterJS.BodyType,
    _dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    // Physics effect is handled via restitution in global effect
  }

  applyGlobalEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    _balloon: any,
    _dt: number
  ): void {
    // Set perfect bounce
    (body as any).restitution = 1.0;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Spring/wave pattern
    const amplitude = 8;
    const freq = 0.15;
    const phase = time * 0.004;

    // Concentric bouncy rings
    for (let r = 0.3; r <= 0.9; r += 0.3) {
      const rr = radius * r;
      const alpha = 0.12 * (1 - r);
      g.lineStyle(1, this.color, alpha);
      g.beginPath();
      const segments = 48;
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const wobble = Math.sin(a * 8 + phase) * amplitude * r * 0.3;
        const px = x + Math.cos(a) * (rr + wobble);
        const py = y + Math.sin(a) * (rr + wobble);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
    }

    // Spring coils in center
    g.lineStyle(1, this.color, 0.2);
    g.beginPath();
    for (let t = 0; t < 30; t++) {
      const py = y - 15 + t;
      const px = x + Math.sin(t * freq + phase) * amplitude;
      if (t === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
  }
}
