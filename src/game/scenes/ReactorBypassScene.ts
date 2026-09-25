import Phaser from 'phaser';
import { getStage2Content } from '../../data/content';
import { evaluateReactorSelection, sumCellValues, validateReactorContent } from '../../domain/reactorLogic';
import { Rational } from '../../domain/rational';
import type { DifficultyTier, Locale, PowerCell, ReactorStage } from '../../domain/types';

const REACTOR_CENTER = { x: 400, y: 250 };
const REACTOR_RADIUS = 130;
const TRAY_Y = 500;
const CELL_SIZE = 92;

// Fixed 3-slot triangle near the rim, scaled down, so inserted cells never
// overlap each other or the percentage label at the reactor's center.
const INSERT_SLOT_ANGLES_DEG = [-150, -30, 90];
const INSERT_RADIUS = 95;
const INSERT_SCALE = 0.42;

const CONDITION_COLOR: Record<string, number> = {
  overload: 0xf1c40f,
  underload: 0x3498db,
  concept_error: 0x9b59b6,
  correct: 0x2ecc71,
};

const STRINGS: Record<Locale, { title: string; capacityRequired: string; defaultFeedback: string; missionComplete: string }> = {
  en: {
    title: 'REACTOR BYPASS',
    capacityRequired: 'Critical Capacity Required',
    defaultFeedback: 'Drag 3 power cells into the reactor.',
    missionComplete: 'Mission Complete!',
  },
  id: {
    title: 'PINTASAN REAKTOR',
    capacityRequired: 'Kapasitas Kritis Dibutuhkan',
    defaultFeedback: 'Seret 3 sel daya ke dalam reaktor.',
    missionComplete: 'Misi Selesai!',
  },
};

interface CellSprite {
  cell: PowerCell;
  container: Phaser.GameObjects.Container;
  trayPosition: { x: number; y: number };
  inserted: boolean;
}

export class ReactorBypassScene extends Phaser.Scene {
  private cellSprites: CellSprite[] = [];
  private insertedOrder: string[] = [];
  private reactorRing!: Phaser.GameObjects.Arc;
  private reactorGauge!: Phaser.GameObjects.Graphics;
  private percentLabel!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private locked = false;
  private stage!: ReactorStage;
  private locale: Locale = 'en';

  constructor() {
    super('ReactorBypassScene');
  }

  init(data: { tier?: DifficultyTier; locale?: Locale } = {}): void {
    this.locale = data.locale ?? 'en';
    this.stage = getStage2Content(data.tier ?? 'medium', this.locale);
  }

  create(): void {
    validateReactorContent(this.stage);

    // Reset instance state: Phaser reuses this Scene instance across
    // restarts (e.g. switching tiers), destroying old game objects but not
    // clearing custom fields that reference them.
    this.cellSprites = [];
    this.insertedOrder = [];
    this.locked = false;
    const strings = STRINGS[this.locale];

    this.add.text(400, 36, strings.title, { fontSize: '26px', color: '#7CFC9C', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(400, 66, `${strings.capacityRequired}: ${Rational.fromValue(this.stage.targetPercentage).toPercentLabel(1)}`, {
        fontSize: '15px',
        color: '#c9d6e3',
      })
      .setOrigin(0.5);

    this.drawReactorBase();
    this.reactorGauge = this.add.graphics();
    this.percentLabel = this.add
      .text(REACTOR_CENTER.x, REACTOR_CENTER.y, '0%', {
        fontSize: '30px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.feedbackText = this.add
      .text(400, 410, strings.defaultFeedback, {
        fontSize: '15px',
        color: '#8b98a5',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5, 0);

    this.createTray();
    this.updateGauge();
    this.setupDragHandlers();
  }

  private drawReactorBase(): void {
    this.reactorRing = this.add.circle(REACTOR_CENTER.x, REACTOR_CENTER.y, REACTOR_RADIUS);
    this.reactorRing.setStrokeStyle(4, 0x2c3e50);
    this.reactorRing.setFillStyle(0x111827, 1);
  }

  private createTray(): void {
    const startX = 130;
    const gap = 140;

    this.stage.availableCells.forEach((cell, index) => {
      const trayPosition = { x: startX + index * gap, y: TRAY_Y };
      const container = this.buildCellContainer(cell, trayPosition);
      this.cellSprites.push({ cell, container, trayPosition, inserted: false });
    });
  }

  private buildCellContainer(cell: PowerCell, pos: { x: number; y: number }): Phaser.GameObjects.Container {
    const bg = this.add
      .rectangle(0, 0, CELL_SIZE, CELL_SIZE, cell.isDistractor ? 0x3a2b52 : 0x1f3a6e, 1)
      .setStrokeStyle(2, 0x8ab4f8);
    const label = this.add
      .text(0, 0, cell.display, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);

    const container = this.add.container(pos.x, pos.y, [bg, label]);
    container.setSize(CELL_SIZE, CELL_SIZE);
    container.setInteractive({ useHandCursor: true });
    this.input.setDraggable(container);
    container.setData('cellId', cell.id);

    return container;
  }

  private setupDragHandlers(): void {
    this.input.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
        if (this.locked) return;
        gameObject.x = dragX;
        gameObject.y = dragY;
      },
    );

    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
      if (this.locked) return;
      this.handleDrop(gameObject);
    });
  }

  private handleDrop(container: Phaser.GameObjects.Container): void {
    const cellId = container.getData('cellId') as string;
    const sprite = this.cellSprites.find((s) => s.cell.id === cellId);
    if (!sprite) return;

    const distance = Phaser.Math.Distance.Between(container.x, container.y, REACTOR_CENTER.x, REACTOR_CENTER.y);
    const droppedInsideReactor = distance <= REACTOR_RADIUS;

    if (droppedInsideReactor && !sprite.inserted) {
      if (this.insertedOrder.length >= this.stage.requiredCellCount) {
        this.snapBack(sprite); // reactor already full — reject the extra cell
        return;
      }
      sprite.inserted = true;
      this.insertedOrder.push(cellId);
      this.arrangeInsertedCell(sprite);
    } else if (!droppedInsideReactor && sprite.inserted) {
      sprite.inserted = false;
      this.insertedOrder = this.insertedOrder.filter((id) => id !== cellId);
      this.snapBack(sprite);
    } else if (!droppedInsideReactor) {
      this.snapBack(sprite);
    }

    this.updateGauge();

    if (this.insertedOrder.length === this.stage.requiredCellCount) {
      this.evaluateAndShowFeedback();
    }
  }

  private snapBack(sprite: CellSprite): void {
    this.tweens.add({
      targets: sprite.container,
      x: sprite.trayPosition.x,
      y: sprite.trayPosition.y,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  private arrangeInsertedCell(sprite: CellSprite): void {
    const slotIndex = this.insertedOrder.indexOf(sprite.cell.id);
    const angle = Phaser.Math.DegToRad(INSERT_SLOT_ANGLES_DEG[slotIndex]);
    this.tweens.add({
      targets: sprite.container,
      x: REACTOR_CENTER.x + Math.cos(angle) * INSERT_RADIUS,
      y: REACTOR_CENTER.y + Math.sin(angle) * INSERT_RADIUS,
      scale: INSERT_SCALE,
      duration: 180,
    });
  }

  private currentSelectedCells(): PowerCell[] {
    return this.insertedOrder
      .map((id) => this.cellSprites.find((s) => s.cell.id === id)?.cell)
      .filter((cell): cell is PowerCell => Boolean(cell));
  }

  private updateGauge(): void {
    const selected = this.currentSelectedCells();
    const sum = sumCellValues(selected);
    this.drawGaugeArc(Math.min(sum.toDecimal(), 1.2));
    this.percentLabel.setText(selected.length > 0 ? sum.toPercentLabel(1) : '0%');
  }

  private drawGaugeArc(fraction: number): void {
    this.reactorGauge.clear();
    this.reactorGauge.fillStyle(0x1f6feb, 0.5);
    this.reactorGauge.slice(
      REACTOR_CENTER.x,
      REACTOR_CENTER.y,
      REACTOR_RADIUS - 10,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(-90 + 360 * Math.min(fraction, 1)),
      false,
    );
    this.reactorGauge.fillPath();
  }

  private evaluateAndShowFeedback(): void {
    this.locked = true;
    const selected = this.currentSelectedCells();
    const evaluation = evaluateReactorSelection(this.stage, selected);
    if (!evaluation) return;

    this.reactorRing.setStrokeStyle(6, CONDITION_COLOR[evaluation.condition]);
    this.feedbackText.setColor(evaluation.condition === 'correct' ? '#7CFC9C' : '#ffd166');
    this.feedbackText.setText(evaluation.message);

    this.tweens.add({
      targets: this.reactorRing,
      scale: 1.04,
      yoyo: true,
      duration: 180,
      repeat: 2,
    });

    if (evaluation.condition === 'correct') {
      this.time.delayedCall(700, () => {
        this.feedbackText.setText(`${evaluation.message}\n${STRINGS[this.locale].missionComplete}`);
      });
      this.events.emit('cipherquest:stage-complete');
      return; // stay locked — stage solved
    }

    this.time.delayedCall(1400, () => this.resetAfterFailedAttempt());
  }

  private resetAfterFailedAttempt(): void {
    this.insertedOrder = [];
    this.cellSprites.forEach((sprite) => {
      sprite.inserted = false;
      sprite.container.setPosition(sprite.trayPosition.x, sprite.trayPosition.y).setScale(1);
    });
    this.reactorRing.setStrokeStyle(4, 0x2c3e50);
    this.feedbackText.setColor('#8b98a5');
    this.feedbackText.setText(STRINGS[this.locale].defaultFeedback);
    this.locked = false;
    this.updateGauge();
  }
}
