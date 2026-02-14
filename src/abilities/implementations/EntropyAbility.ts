import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Entropy — The Chaos
 * Adds Perlin-style noise to velocity vector.
 */
export class EntropyAbility extends PhysicsAbility {
  readonly id = 'entropy';
  readonly name = 'S';
  readonly displayName = 'Entropy';
  readonly iconKey = 'icon-entropy';
  readonly category = 'material';
  readonly radius = 160;
  readonly color = 0xffffff;
  readonly visualMode: VisualMode = 'none';
  strength = 0.0004;

  // Simple noise state
  private noisePhase = Math.random() * 1000;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    dt: number
  ): void {
    this.noisePhase += dt;
    const falloff = 1 - dist / this.radius;
    // Perlin-like noise using sin combinations
    const nx = Math.sin(this.noisePhase * 2.3 + 17.1) * Math.cos(this.noisePhase * 1.7 + 3.2);
    const ny = Math.cos(this.noisePhase * 1.9 + 7.8) * Math.sin(this.noisePhase * 2.1 + 11.3);
    (body as any).force.x += nx * this.strength * falloff;
    (body as any).force.y += ny * this.strength * falloff;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Scattered dots — chaotic pattern
    const seed = time * 0.001;
    g.fillStyle(this.color, 0.08);
    for (let i = 0; i < 60; i++) {
      const a = Math.sin(i * 127.1 + seed) * 43758.5453;
      const frac = a - Math.floor(a);
      const b = Math.sin(i * 269.5 + seed * 1.3) * 21345.6789;
      const frac2 = b - Math.floor(b);
      const px = x + (frac - 0.5) * radius * 1.8;
      const py = y + (frac2 - 0.5) * radius * 1.8;
      const dd = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
      if (dd < radius * 0.9) {
        const sz = 1 + frac * 2;
        g.fillCircle(px, py, sz);
      }
    }

    // Outer ring
    g.lineStyle(0.5, this.color, 0.06);
    g.strokeCircle(x, y, radius * 0.9);
  }
}
