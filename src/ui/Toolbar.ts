import { PhysicsAbility } from '../abilities/PhysicsAbility';

/**
 * Left-side vertical toolbar showing available abilities for the current level.
 * Supports drag-and-drop into the chamber.
 */
export class Toolbar {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;

  /** Current level's ability cards */
  cards: { ability: PhysicsAbility; remaining: number }[] = [];

  /** Graphics layers */
  private bg: Phaser.GameObjects.Graphics;
  private cardGraphics: Phaser.GameObjects.Graphics;
  private textObjects: Phaser.GameObjects.Text[] = [];
  private badgeTexts: Phaser.GameObjects.Text[] = [];

  /** Currently dragging */
  dragging: { ability: PhysicsAbility; cardIndex: number } | null = null;
  dragPreview: Phaser.GameObjects.Graphics | null = null;

  /** Chamber bounds for drop validation */
  chamberBounds: { x: number; y: number; width: number; height: number };

  /** Callback when an ability is placed */
  onPlace: ((ability: PhysicsAbility, x: number, y: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    chamberBounds: { x: number; y: number; width: number; height: number }
  ) {
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.width = 90;
    this.height = scene.scale.height;
    this.chamberBounds = chamberBounds;

    this.bg = scene.add.graphics();
    this.bg.setDepth(20);

    this.cardGraphics = scene.add.graphics();
    this.cardGraphics.setDepth(21);

    this.dragPreview = scene.add.graphics();
    this.dragPreview.setDepth(50);

    this.setupInput();
  }

  setCards(abilities: PhysicsAbility[]): void {
    // Count occurrences
    const countMap = new Map<string, number>();
    for (const a of abilities) {
      countMap.set(a.id, (countMap.get(a.id) || 0) + 1);
    }

    // Build unique cards w/ remaining counts
    this.cards = [];
    const seen = new Set<string>();
    for (const a of abilities) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        this.cards.push({ ability: a, remaining: countMap.get(a.id)! });
      }
    }

    // Destroy old texts
    for (const t of this.textObjects) t.destroy();
    for (const t of this.badgeTexts) t.destroy();
    this.textObjects = [];
    this.badgeTexts = [];

    // Create labels + badges
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const cy = 55 + i * 58;

      const label = this.scene.add.text(this.x + 8, cy + 28, card.ability.name, {
        fontSize: '10px',
        color: '#cccccc',
        fontFamily: 'monospace',
      });
      label.setDepth(22);
      this.textObjects.push(label);

      const badge = this.scene.add.text(this.x + 68, cy + 2, `×${card.remaining}`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
      });
      badge.setDepth(22);
      this.badgeTexts.push(badge);
    }
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if clicking on a card
      for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (card.remaining <= 0) continue;

        const cx = this.x + 10;
        const cy = 55 + i * 58;
        const cw = 70;
        const ch = 44;

        if (
          pointer.x >= cx &&
          pointer.x <= cx + cw &&
          pointer.y >= cy &&
          pointer.y <= cy + ch
        ) {
          this.dragging = { ability: card.ability, cardIndex: i };
          break;
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging || !this.dragPreview) return;

      this.dragPreview.clear();

      // Draw preview circle at cursor
      const inChamber = this.isInChamber(pointer.x, pointer.y);
      const color = inChamber ? this.dragging.ability.color : 0x888888;
      const alpha = inChamber ? 0.3 : 0.15;

      this.dragPreview.lineStyle(2, color, alpha + 0.2);
      this.dragPreview.strokeCircle(pointer.x, pointer.y, this.dragging.ability.radius);
      this.dragPreview.fillStyle(color, alpha * 0.3);
      this.dragPreview.fillCircle(pointer.x, pointer.y, this.dragging.ability.radius);

      // Icon in center
      this.dragPreview.fillStyle(color, 0.5);
      this.dragPreview.fillCircle(pointer.x, pointer.y, 8);
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;

      if (this.dragPreview) this.dragPreview.clear();

      if (this.isInChamber(pointer.x, pointer.y)) {
        // Place the ability
        const card = this.cards[this.dragging.cardIndex];
        if (card.remaining > 0) {
          card.remaining--;
          this.updateBadge(this.dragging.cardIndex);
          if (this.onPlace) {
            this.onPlace(this.dragging.ability, pointer.x, pointer.y);
          }
        }
      }

      this.dragging = null;
    });
  }

  private isInChamber(x: number, y: number): boolean {
    const b = this.chamberBounds;
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  /** Refresh all badge texts (call after externally modifying remaining counts) */
  refreshBadges(): void {
    for (let i = 0; i < this.cards.length; i++) {
      this.updateBadge(i);
    }
  }

  private updateBadge(index: number): void {
    if (this.badgeTexts[index]) {
      this.badgeTexts[index].setText(`×${this.cards[index].remaining}`);
      if (this.cards[index].remaining <= 0) {
        this.badgeTexts[index].setColor('#666666');
      }
    }
  }

  render(): void {
    this.bg.clear();
    this.cardGraphics.clear();

    // Toolbar background
    this.bg.fillStyle(0x16213e, 0.95);
    this.bg.fillRoundedRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8, 12);

    // Title
    // (rendered once, not re-rendered — but for simplicity we just render a bar)
    this.bg.fillStyle(0xffffff, 0.06);
    this.bg.fillRoundedRect(this.x + 8, this.y + 10, this.width - 16, 30, 6);

    // Cards
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const cx = this.x + 10;
      const cy = 55 + i * 58;
      const cw = 70;
      const ch = 44;

      const isEmpty = card.remaining <= 0;
      const isHovered =
        this.dragging?.cardIndex === i;

      // Card background
      this.cardGraphics.fillStyle(
        isEmpty ? 0x333333 : card.ability.color,
        isEmpty ? 0.1 : isHovered ? 0.25 : 0.15
      );
      this.cardGraphics.fillRoundedRect(cx, cy, cw, ch, 6);

      // Card border
      this.cardGraphics.lineStyle(1, card.ability.color, isEmpty ? 0.1 : 0.3);
      this.cardGraphics.strokeRoundedRect(cx, cy, cw, ch, 6);

      // Simple icon (circle with color)
      if (!isEmpty) {
        this.cardGraphics.fillStyle(card.ability.color, 0.5);
        this.cardGraphics.fillCircle(cx + 14, cy + 14, 8);
        this.cardGraphics.fillStyle(0xffffff, 0.3);
        this.cardGraphics.fillCircle(cx + 12, cy + 12, 3);
      }
    }
  }
}
