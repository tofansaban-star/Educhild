import Phaser from 'phaser';
import { getStage3Content } from '../../data/content';
import { evaluateDimensionChoice, validateAreaPerimeterContent } from '../../domain/areaPerimeterLogic';
import type { AreaPerimeterStage, DifficultyTier, Locale } from '../../domain/types';

const PANEL_COLOR_DEFAULT = 0x2c3e50;
const PANEL_COLOR_CORRECT = 0x2ecc71;
const PANEL_COLOR_INCORRECT = 0xf1c40f;

const STRINGS: Record<Locale, { title: string; defaultFeedback: string }> = {
  en: { title: 'SECRET ROOM MAP', defaultFeedback: 'Pick the dimensions that match.' },
  id: { title: 'PETA RUANGAN RAHASIA', defaultFeedback: 'Pilih ukuran yang cocok.' },
};

const GRID_COLS = 6;
const GRID_ROWS = 5;
const GRID_CELL = 24;
const GRID_CENTER = { x: 400, y: 185 };

export class SecretRoomScene extends Phaser.Scene {
  private stage!: AreaPerimeterStage;
  private panelBorder!: Phaser.GameObjects.Rectangle;
  private feedbackText!: Phaser.GameObjects.Text;
  private locked = false;
  private locale: Locale = 'en';

  constructor() {
    super('SecretRoomScene');
  }

  init(data: { tier?: DifficultyTier; locale?: Locale } = {}): void {
    this.locale = data.locale ?? 'en';
    this.stage = getStage3Content(data.tier ?? 'medium', this.locale);
  }

  create(): void {
    validateAreaPerimeterContent(this.stage);
    this.locked = false;
    const strings = STRINGS[this.locale];

    this.add.text(400, 32, strings.title, { fontSize: '26px', color: '#7CFC9C', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(400, 60, this.stage.objective, {
        fontSize: '13px',
        color: '#c9d6e3',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    this.panelBorder = this.add
      .rectangle(GRID_CENTER.x, GRID_CENTER.y, GRID_COLS * GRID_CELL + 40, GRID_ROWS * GRID_CELL + 40)
      .setStrokeStyle(3, PANEL_COLOR_DEFAULT)
      .setFillStyle(0x111827, 1);

    this.drawBlueprintGrid();

    this.feedbackText = this.add
      .text(400, 335, strings.defaultFeedback, {
        fontSize: '14px',
        color: '#8b98a5',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5, 0);

    this.createOptionButtons();
  }

  /** Decorative placeholder for the "locked grid-floor blueprint" — not tied to any option's actual dimensions. */
  private drawBlueprintGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2c3e50, 1);
    const originX = GRID_CENTER.x - (GRID_COLS * GRID_CELL) / 2;
    const originY = GRID_CENTER.y - (GRID_ROWS * GRID_CELL) / 2;
    for (let col = 0; col <= GRID_COLS; col++) {
      const x = originX + col * GRID_CELL;
      graphics.lineBetween(x, originY, x, originY + GRID_ROWS * GRID_CELL);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = originY + row * GRID_CELL;
      graphics.lineBetween(originX, y, originX + GRID_COLS * GRID_CELL, y);
    }
  }

  private createOptionButtons(): void {
    const cols = 2;
    const startX = 300;
    const startY = 420;
    const gapX = 200;
    const gapY = 70;

    this.stage.dimensionOptions.forEach((option, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      const bg = this.add.rectangle(0, 0, 170, 54, 0x1f3a6e, 1).setStrokeStyle(2, 0x8ab4f8);
      const label = this.add
        .text(0, 0, option.display, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);

      const container = this.add.container(x, y, [bg, label]);
      container.setSize(170, 54);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerup', () => this.handleSelect(option.id));
    });
  }

  private handleSelect(optionId: string): void {
    if (this.locked) return;

    const evaluation = evaluateDimensionChoice(this.stage, optionId, this.locale);

    if (evaluation.condition === 'correct') {
      this.locked = true;
      this.panelBorder.setStrokeStyle(4, PANEL_COLOR_CORRECT);
      this.feedbackText.setColor('#7CFC9C').setText(evaluation.message);
      this.events.emit('cipherquest:stage-complete');
      return;
    }

    this.panelBorder.setStrokeStyle(4, PANEL_COLOR_INCORRECT);
    this.feedbackText.setColor('#ffd166').setText(evaluation.message);

    this.time.delayedCall(1400, () => {
      if (this.locked) return;
      this.panelBorder.setStrokeStyle(3, PANEL_COLOR_DEFAULT);
      this.feedbackText.setColor('#8b98a5').setText(STRINGS[this.locale].defaultFeedback);
    });
  }
}
