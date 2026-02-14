import Phaser from 'phaser';

/**
 * Boot scene — preloads assets and generates procedural textures.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // No external assets — we generate everything procedurally
  }

  create(): void {
    this.scene.start('GameScene', { levelIndex: 0 });
  }
}
