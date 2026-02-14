import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Cold — Thermal Contraction
 * Shrinks balloon radius, increases density (falls faster).
 * Visual: icy blue crystalline texture.
 */
export class ColdAbility extends PhysicsAbility {
  readonly id = 'cold';
  readonly name = 'ΔT↓';
  readonly displayName = 'Thermal Contraction';
  readonly iconKey = 'icon-cold';
  readonly category = 'thermodynamics';
  readonly radius = 200;
  readonly color = 0x80deea;
  readonly visualMode: VisualMode = 'vectors';
  strength = 0.0003;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    // Increase effective downward pull (denser = heavier)
    const falloff = 1 - dist / this.radius;
    (body as any).force.y += this.strength * falloff;
  }

  applyGlobalEffect(
    _scene: Phaser.Scene,
    _body: MatterJS.BodyType,
    balloon: any,
    _dt: number
  ): void {
    // Shrink balloon visually
    balloon.targetRadius = Math.max(balloon.baseRadius * 0.5, balloon.targetRadius - 0.3);
    balloon.glowColor = 0x80deea;
    balloon.glowIntensity = 0.3;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Icy shards / crystalline lines
    const phase = time * 0.001;
    const numShards = 12;
    for (let i = 0; i < numShards; i++) {
      const angle = (i / numShards) * Math.PI * 2 + phase;
      const len = radius * (0.3 + Math.sin(angle * 3 + time * 0.002) * 0.15);
      const sx = x + Math.cos(angle) * 20;
      const sy = y + Math.sin(angle) * 20;
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;
      const alpha = 0.15 + Math.sin(angle * 2 + time * 0.003) * 0.05;
      g.lineStyle(1, this.color, alpha);
      g.lineBetween(sx, sy, ex, ey);

      // Branch shards
      const bAngle = angle + 0.3;
      const bLen = len * 0.4;
      const mx = x + Math.cos(angle) * len * 0.6;
      const my = y + Math.sin(angle) * len * 0.6;
      g.lineStyle(0.5, 0xb2ebf2, alpha * 0.7);
      g.lineBetween(mx, my, mx + Math.cos(bAngle) * bLen, my + Math.sin(bAngle) * bLen);
    }

    // Frost dots
    g.fillStyle(0xffffff, 0.12);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + phase * 0.5;
      const r = radius * (0.3 + (i % 3) * 0.2);
      g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.5);
    }
  }
}
