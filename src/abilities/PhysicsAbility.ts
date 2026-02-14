/**
 * Base abstract class for all physics abilities.
 * Extend this to create new ability types — no core loop changes needed.
 */
export type VisualMode = 'vectors' | 'grid' | 'particles' | 'quantum' | 'none';

export abstract class PhysicsAbility {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly iconKey: string;
  abstract readonly category: string;
  abstract readonly radius: number;
  abstract readonly color: number;
  abstract readonly visualMode: VisualMode;

  maxPlacements?: number;
  strength: number = 1;

  abstract applyEffect(
    scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    dt: number
  ): void;

  /** Global effect applied to balloon every tick regardless of distance */
  applyGlobalEffect(
    _scene: Phaser.Scene,
    _body: MatterJS.BodyType,
    _balloon: any,
    _dt: number
  ): void {}

  renderGizmo(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    _time: number
  ): void {
    graphics.lineStyle(1, this.color, 0.25);
    graphics.strokeCircle(x, y, radius);
  }
}
