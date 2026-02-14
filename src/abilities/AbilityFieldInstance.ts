import { PhysicsAbility } from './PhysicsAbility';

/**
 * A placed instance of a PhysicsAbility in the game world.
 */
export class AbilityFieldInstance {
  ability: PhysicsAbility;
  x: number;
  y: number;
  radius: number;
  strength: number;
  active: boolean;

  /** Phaser graphics object for the gizmo visual */
  gizmo: Phaser.GameObjects.Graphics | null = null;

  /** Particle/decoration container */
  particles: Phaser.GameObjects.Graphics | null = null;

  constructor(ability: PhysicsAbility, x: number, y: number) {
    this.ability = ability;
    this.x = x;
    this.y = y;
    this.radius = ability.radius;
    this.strength = ability.strength;
    this.active = true;
  }

  /**
   * Check if a point is within this field's radius.
   */
  contains(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  /**
   * Destroy visual objects when removing this field.
   */
  destroy(): void {
    this.active = false;
    if (this.gizmo) {
      this.gizmo.destroy();
      this.gizmo = null;
    }
    if (this.particles) {
      this.particles.destroy();
      this.particles = null;
    }
  }
}
