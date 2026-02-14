/**
 * Base abstract class for all physics abilities.
 * Extend this to create new ability types — no core loop changes needed.
 */
export abstract class PhysicsAbility {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly iconKey: string;
  abstract readonly category: string;
  abstract readonly radius: number;
  abstract readonly color: number;

  /** Max times this ability can be placed. undefined = unlimited */
  maxPlacements?: number;

  /** Default strength multiplier */
  strength: number = 1;

  /**
   * Called every physics update for each body within this field's radius.
   * @param scene   The GameScene
   * @param body    The Matter body to affect
   * @param dist    Distance from field center to body center
   * @param dx      X offset (body.x - field.x)
   * @param dy      Y offset (body.y - field.y)
   * @param dt      Delta time in seconds
   */
  abstract applyEffect(
    scene: Phaser.Scene,
    body: MatterJS.BodyType,
    dist: number,
    dx: number,
    dy: number,
    dt: number
  ): void;

  /**
   * Render a subtle gizmo for this field type (override for custom visuals).
   * Called each frame for active fields.
   */
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
