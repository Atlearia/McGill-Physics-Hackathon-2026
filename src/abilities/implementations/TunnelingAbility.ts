import { PhysicsAbility, VisualMode } from '../PhysicsAbility';

/**
 * Quantum Tunneling
 * Disables collision for wall segments within radius. Applies drag.
 * Visual: wall turns to static noise/wireframe. Balloon splits to RGB ghosts.
 */
export class TunnelingAbility extends PhysicsAbility {
  readonly id = 'tunneling';
  readonly name = 'Ψ';
  readonly displayName = 'Quantum Tunneling';
  readonly iconKey = 'icon-tunneling';
  readonly category = 'quantum';
  readonly radius = 120;
  readonly color = 0xce93d8;
  readonly visualMode: VisualMode = 'quantum';
  strength = 1;

  applyEffect(
    _scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    _dx: number,
    _dy: number,
    _dt: number
  ): void {
    // Apply drag while tunneling
    const falloff = 1 - dist / this.radius;
    const damping = 0.015 * falloff;
    const vel = (body as any).velocity;
    (body as any).force.x -= vel.x * damping;
    (body as any).force.y -= vel.y * damping;
  }

  applyGlobalEffect(
    _scene: Phaser.Scene,
    _body: MatterJS.BodyType,
    balloon: any,
    _dt: number
  ): void {
    balloon.quantumMode = true;
  }

  renderGizmo(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    time: number
  ): void {
    // Pulsing quantum field border
    const pulse = Math.sin(time * 0.004) * 0.05 + 0.15;
    g.lineStyle(1.5, this.color, pulse);
    g.strokeCircle(x, y, radius);

    // Probability wave rings
    for (let r = 0.3; r < 1; r += 0.2) {
      const alpha = 0.05 * (1 - r);
      g.lineStyle(0.5, this.color, alpha);
      g.strokeCircle(x, y, radius * r);
    }
  }
}
