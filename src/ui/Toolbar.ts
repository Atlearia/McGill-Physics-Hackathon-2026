import { PhysicsAbility } from '../abilities/PhysicsAbility';

/**
 * Left-side vertical toolbar with physics-symbol icons.
 * Dark background, icons highlight in ability color when selected/dragging.
 */
export class Toolbar {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;

  cards: { ability: PhysicsAbility; remaining: number }[] = [];

  private bg: Phaser.GameObjects.Graphics;
  private cardGraphics: Phaser.GameObjects.Graphics;
  private badgeTexts: Phaser.GameObjects.Text[] = [];

  dragging: { ability: PhysicsAbility; cardIndex: number } | null = null;
  dragPreview: Phaser.GameObjects.Graphics;

  chamberBounds: { x: number; y: number; width: number; height: number };
  onPlace: ((ability: PhysicsAbility, x: number, y: number) => void) | null = null;

  /** Title text that shows "FUNDAMENTAL CONSTANT: [NAME]" */
  private titleText: Phaser.GameObjects.Text;

  private readonly CARD_SIZE = 52;
  private readonly CARD_GAP = 4;
  private readonly CARD_X = 8;

  constructor(
    scene: Phaser.Scene,
    chamberBounds: { x: number; y: number; width: number; height: number }
  ) {
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.width = 80;
    this.height = scene.scale.height;
    this.chamberBounds = chamberBounds;

    this.bg = scene.add.graphics();
    this.bg.setDepth(20);

    this.cardGraphics = scene.add.graphics();
    this.cardGraphics.setDepth(21);

    this.dragPreview = scene.add.graphics();
    this.dragPreview.setDepth(50);

    // Title at top center of game
    this.titleText = scene.add.text(
      chamberBounds.x + chamberBounds.width / 2,
      12,
      '',
      {
        fontSize: '16px',
        color: '#888888',
        fontFamily: 'Georgia, "Times New Roman", serif',
        letterSpacing: 3,
      }
    );
    this.titleText.setOrigin(0.5, 0);
    this.titleText.setDepth(25);

    this.setupInput();
  }

  setCards(abilities: PhysicsAbility[]): void {
    const countMap = new Map<string, number>();
    for (const a of abilities) {
      countMap.set(a.id, (countMap.get(a.id) || 0) + 1);
    }

    this.cards = [];
    const seen = new Set<string>();
    for (const a of abilities) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        this.cards.push({ ability: a, remaining: countMap.get(a.id)! });
      }
    }

    for (const t of this.badgeTexts) t.destroy();
    this.badgeTexts = [];
  }

  private getCardY(index: number): number {
    return 8 + index * (this.CARD_SIZE + this.CARD_GAP);
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (card.remaining <= 0) continue;

        const cx = this.CARD_X;
        const cy = this.getCardY(i);
        const cs = this.CARD_SIZE;

        if (pointer.x >= cx && pointer.x <= cx + cs + 12 &&
            pointer.y >= cy && pointer.y <= cy + cs) {
          this.dragging = { ability: card.ability, cardIndex: i };
          break;
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragPreview.clear();

      const inChamber = this.isInChamber(pointer.x, pointer.y);
      const color = inChamber ? this.dragging.ability.color : 0x444444;
      const alpha = inChamber ? 0.2 : 0.08;

      // Crosshair
      this.dragPreview.lineStyle(1, color, 0.5);
      this.dragPreview.lineBetween(pointer.x - 12, pointer.y, pointer.x + 12, pointer.y);
      this.dragPreview.lineBetween(pointer.x, pointer.y - 12, pointer.x, pointer.y + 12);

      // Radius preview
      this.dragPreview.lineStyle(1.5, color, alpha + 0.15);
      this.dragPreview.strokeCircle(pointer.x, pointer.y, this.dragging.ability.radius);
      this.dragPreview.fillStyle(color, alpha * 0.2);
      this.dragPreview.fillCircle(pointer.x, pointer.y, this.dragging.ability.radius);

      // Update title while dragging
      this.titleText.setText(`Fundamental Constant: ${this.dragging.ability.displayName}`);
      this.titleText.setColor('#' + this.dragging.ability.color.toString(16).padStart(6, '0'));
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragPreview.clear();

      if (this.isInChamber(pointer.x, pointer.y)) {
        const card = this.cards[this.dragging.cardIndex];
        if (card.remaining > 0) {
          card.remaining--;
          if (this.onPlace) {
            this.onPlace(this.dragging.ability, pointer.x, pointer.y);
          }
        }
      }

      this.dragging = null;
      // Reset title
      this.titleText.setText('');
    });
  }

  private isInChamber(x: number, y: number): boolean {
    const b = this.chamberBounds;
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  refreshBadges(): void {
    // badges are drawn in render() now
  }

  /** Update the title to show the most recently placed field's name */
  setActiveTitle(name: string, color: number): void {
    if (!this.dragging) {
      if (name) {
        this.titleText.setText(`Fundamental Constant: ${name}`);
        this.titleText.setColor('#' + color.toString(16).padStart(6, '0'));
      } else {
        this.titleText.setText('');
      }
    }
  }

  render(): void {
    this.bg.clear();
    this.cardGraphics.clear();

    const g = this.bg;
    const cg = this.cardGraphics;

    // Toolbar background — very dark
    g.fillStyle(0x0a0a0a, 0.95);
    g.fillRoundedRect(this.x, this.y, this.width, this.height, 0);

    // Right edge subtle line
    g.lineStyle(1, 0x333333, 0.3);
    g.lineBetween(this.width, 0, this.width, this.height);

    // Cards
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const cx = this.CARD_X;
      const cy = this.getCardY(i);
      const cs = this.CARD_SIZE;
      const isEmpty = card.remaining <= 0;
      const isDragging = this.dragging?.cardIndex === i;
      const color = card.ability.color;

      // Card background
      if (isDragging) {
        cg.fillStyle(color, 0.15);
        cg.fillRoundedRect(cx, cy, cs + 12, cs, 4);
        cg.lineStyle(1.5, color, 0.6);
        cg.strokeRoundedRect(cx, cy, cs + 12, cs, 4);
      } else {
        cg.fillStyle(0x1a1a1a, isEmpty ? 0.3 : 0.7);
        cg.fillRoundedRect(cx, cy, cs + 12, cs, 4);
        cg.lineStyle(0.5, isEmpty ? 0x333333 : 0x555555, isEmpty ? 0.3 : 0.5);
        cg.strokeRoundedRect(cx, cy, cs + 12, cs, 4);
      }

      // Draw physics symbol icon
      if (!isEmpty || isDragging) {
        this.drawIcon(cg, card.ability, cx + (cs + 12) / 2, cy + cs / 2 - 2, isDragging);
      }

      // Remaining count (small text below)
      // Drawn dynamically since we don't use pre-created text objects
    }
  }

  /**
   * Draw a physics symbol icon for each ability type.
   */
  private drawIcon(g: Phaser.GameObjects.Graphics, ability: PhysicsAbility, cx: number, cy: number, active: boolean): void {
    const color = active ? ability.color : 0xaaaaaa;
    const alpha = active ? 0.9 : 0.5;
    const id = ability.id;

    if (id === 'heat') {
      // Thermometer up
      g.lineStyle(1.5, color, alpha);
      g.lineBetween(cx, cy - 12, cx, cy + 8);
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy + 10, 4);
      // Arrow up
      g.lineBetween(cx, cy - 12, cx - 3, cy - 8);
      g.lineBetween(cx, cy - 12, cx + 3, cy - 8);
      // ΔT label
      g.lineStyle(0.8, color, alpha * 0.7);
      g.lineBetween(cx + 7, cy - 10, cx + 11, cy - 4);
      g.lineBetween(cx + 11, cy - 4, cx + 15, cy - 10);
    } else if (id === 'cold') {
      // Thermometer down
      g.lineStyle(1.5, color, alpha);
      g.lineBetween(cx, cy - 10, cx, cy + 8);
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy + 10, 4);
      // Arrow down
      g.lineBetween(cx, cy + 14, cx - 3, cy + 10);
      g.lineBetween(cx, cy + 14, cx + 3, cy + 10);
    } else if (id === 'mass') {
      // M in circle
      g.lineStyle(1.5, color, alpha);
      g.strokeCircle(cx, cy, 12);
      // M
      g.lineStyle(1.5, color, alpha);
      g.lineBetween(cx - 6, cy + 5, cx - 6, cy - 5);
      g.lineBetween(cx - 6, cy - 5, cx, cy + 2);
      g.lineBetween(cx, cy + 2, cx + 6, cy - 5);
      g.lineBetween(cx + 6, cy - 5, cx + 6, cy + 5);
    } else if (id === 'dark-energy') {
      // Λ in circle
      g.lineStyle(1.5, color, alpha);
      g.strokeCircle(cx, cy, 12);
      // Λ (lambda)
      g.lineBetween(cx, cy - 7, cx - 6, cy + 7);
      g.lineBetween(cx, cy - 7, cx + 6, cy + 7);
    } else if (id === 'high-pressure') {
      // P with outward arrows
      g.lineStyle(1.5, color, alpha);
      // Center dot
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy, 3);
      // Outward arrows (4 directions)
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [ddx, ddy] of dirs) {
        const sx = cx + ddx * 6;
        const sy = cy + ddy * 6;
        const ex = cx + ddx * 13;
        const ey = cy + ddy * 13;
        g.lineBetween(sx, sy, ex, ey);
      }
      // P label top-right
      g.lineStyle(0.8, color, alpha * 0.7);
      g.lineBetween(cx + 8, cy - 12, cx + 8, cy - 6);
      g.beginPath(); g.arc(cx + 10, cy - 10, 3, -Math.PI / 2, Math.PI / 2); g.strokePath();
    } else if (id === 'vacuum') {
      // P with inward arrows
      g.lineStyle(1.5, color, alpha);
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy, 2);
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [ddx, ddy] of dirs) {
        const sx = cx + ddx * 14;
        const sy = cy + ddy * 14;
        const ex = cx + ddx * 6;
        const ey = cy + ddy * 6;
        g.lineBetween(sx, sy, ex, ey);
      }
      // P label
      g.lineStyle(0.8, color, alpha * 0.7);
      g.lineBetween(cx + 8, cy - 12, cx + 8, cy - 6);
    } else if (id === 'tunneling') {
      // Ψ (psi) with wave
      g.lineStyle(1.5, color, alpha);
      // Vertical bar
      g.lineBetween(cx, cy - 10, cx, cy + 10);
      // Curved sides
      g.beginPath();
      for (let t = 0; t <= 1; t += 0.05) {
        const py = cy - 8 + t * 16;
        const px = cx - 8 + Math.sin(t * Math.PI) * 4;
        if (t === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokePath();
      g.beginPath();
      for (let t = 0; t <= 1; t += 0.05) {
        const py = cy - 8 + t * 16;
        const px = cx + 8 - Math.sin(t * Math.PI) * 4;
        if (t === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokePath();
      // Horizontal bracket lines
      g.lineStyle(0.8, color, alpha * 0.5);
      g.lineBetween(cx - 12, cy + 12, cx + 12, cy + 12);
      g.lineBetween(cx - 12, cy - 12, cx - 12, cy - 8);
      g.lineBetween(cx + 12, cy - 12, cx + 12, cy - 8);
    } else if (id === 'viscosity') {
      // η with parallel flow lines
      g.lineStyle(1.5, color, alpha);
      // η shape
      g.lineBetween(cx - 4, cy - 8, cx - 4, cy + 10);
      g.beginPath();
      g.arc(cx + 1, cy - 5, 5, Math.PI, 0, true);
      g.strokePath();
      g.lineBetween(cx + 6, cy - 5, cx + 6, cy + 10);
      // Horizontal lines
      g.lineStyle(0.5, color, alpha * 0.3);
      for (let i = -2; i <= 2; i++) {
        g.lineBetween(cx - 15, cy + i * 5, cx + 15, cy + i * 5);
      }
    } else if (id === 'elasticity') {
      // k with spring
      g.lineStyle(1.5, color, alpha);
      // k letter
      g.lineBetween(cx - 8, cy - 8, cx - 8, cy + 8);
      g.lineBetween(cx - 8, cy, cx - 2, cy - 6);
      g.lineBetween(cx - 8, cy, cx - 2, cy + 6);
      // Spring coil
      g.lineStyle(1, color, alpha * 0.6);
      g.beginPath();
      let started = false;
      for (let t = 0; t < 20; t++) {
        const px = cx + 4 + Math.sin(t * 0.8) * 6;
        const py = cy - 10 + t;
        if (!started) { g.moveTo(px, py); started = true; }
        else g.lineTo(px, py);
      }
      g.strokePath();
    } else if (id === 'entropy') {
      // S with scattered dots
      g.lineStyle(1.5, color, alpha);
      // S curve
      g.beginPath();
      for (let t = 0; t <= 1; t += 0.05) {
        const px = cx + Math.sin(t * Math.PI * 2) * 6;
        const py = cy - 10 + t * 20;
        if (t === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
      // Scattered dots
      g.fillStyle(color, alpha * 0.4);
      const dots = [[8, -6], [10, 2], [7, 8], [-8, 4], [-10, -2], [-7, 7]];
      for (const [dx, dy] of dots) {
        g.fillCircle(cx + dx, cy + dy, 1.5);
      }
    }
  }
}
