import Phaser from 'phaser';
import { getStage4Content } from '../../data/content';
import { evaluateLeverArrangement, leverIdsInClue, validateLeverSequenceContent } from '../../domain/leverLogic';
import type { DifficultyTier, LeverItem, LeverSequenceStage, Locale } from '../../domain/types';

const PANEL_COLOR_DEFAULT = 0x2c3e50;
const PANEL_COLOR_CORRECT = 0x2ecc71;
const PANEL_COLOR_INCORRECT = 0xf1c40f;

const STRINGS: Record<Locale, { title: string; defaultFeedback: string }> = {
  en: { title: 'LEVER SEQUENCE', defaultFeedback: 'Drag each lever into a position slot.' },
  id: { title: 'URUTAN TUAS', defaultFeedback: 'Seret tiap tuas ke slot posisinya.' },
};

const SLOT_Y = 260;
const SLOT_WIDTH = 90;
const SLOT_HEIGHT = 140;
const SLOT_SPACING = 150;
const TRAY_Y = 480;
const LEVER_WIDTH = 90;
const LEVER_HEIGHT = 56;

interface SlotSprite {
  index: number; // 0-based position
  x: number;
  y: number;
  border: Phaser.GameObjects.Rectangle;
  leverId: string | null;
}

interface LeverSprite {
  lever: LeverItem;
  container: Phaser.GameObjects.Container;
  trayPosition: { x: number; y: number };
  slotIndex: number | null;
}

export class LeverSequenceScene extends Phaser.Scene {
  private stage!: LeverSequenceStage;
  private slots: SlotSprite[] = [];
  private leverSprites: LeverSprite[] = [];
  private feedbackText!: Phaser.GameObjects.Text;
  private locked = false;
  private locale: Locale = 'en';

  constructor() {
    super('LeverSequenceScene');
  }

  init(data: { tier?: DifficultyTier; locale?: Locale } = {}): void {
    this.locale = data.locale ?? 'en';
    this.stage = getStage4Content(data.tier ?? 'medium', this.locale);
  }

  create(): void {
    validateLeverSequenceContent(this.stage);

    this.slots = [];
    this.leverSprites = [];
    this.locked = false;
    const strings = STRINGS[this.locale];

    this.add.text(400, 32, strings.title, { fontSize: '26px', color: '#7CFC9C', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(400, 58, this.stage.objective, {
        fontSize: '13px',
        color: '#c9d6e3',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    this.drawCluePanel();
    this.createSlots();
    this.createTray();

    this.feedbackText = this.add
      .text(400, 372, strings.defaultFeedback, {
        fontSize: '14px',
        color: '#8b98a5',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5, 0);

    this.setupDragHandlers();
  }

  private drawCluePanel(): void {
    this.add.rectangle(400, 130, 620, 110).setStrokeStyle(2, PANEL_COLOR_DEFAULT).setFillStyle(0x111827, 1);

    const lines = this.stage.clues.map((clue, i) => `${i + 1}. ${clue.text}`).join('\n');
    this.add
      .text(400, 130, lines, {
        fontSize: '13px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 580 },
      })
      .setOrigin(0.5);
  }

  private slotX(index: number): number {
    const count = this.stage.levers.length;
    const totalWidth = SLOT_SPACING * (count - 1);
    const startX = 400 - totalWidth / 2;
    return startX + index * SLOT_SPACING;
  }

  private createSlots(): void {
    this.stage.levers.forEach((_, index) => {
      const x = this.slotX(index);
      const border = this.add
        .rectangle(x, SLOT_Y, SLOT_WIDTH, SLOT_HEIGHT)
        .setStrokeStyle(3, PANEL_COLOR_DEFAULT)
        .setFillStyle(0x111827, 1);
      this.add
        .text(x, SLOT_Y + SLOT_HEIGHT / 2 + 16, String(index + 1), { fontSize: '16px', color: '#8b98a5' })
        .setOrigin(0.5);
      this.slots.push({ index, x, y: SLOT_Y, border, leverId: null });
    });
  }

  private createTray(): void {
    this.stage.levers.forEach((lever, index) => {
      const trayPosition = { x: this.slotX(index), y: TRAY_Y };
      const swatch = this.add
        .rectangle(0, 0, LEVER_WIDTH, LEVER_HEIGHT, lever.color, 1)
        .setStrokeStyle(2, 0xffffff);
      const label = this.add
        .text(0, 0, lever.label, { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      const container = this.add.container(trayPosition.x, trayPosition.y, [swatch, label]);
      container.setSize(LEVER_WIDTH, LEVER_HEIGHT);
      container.setInteractive({ useHandCursor: true });
      this.input.setDraggable(container);
      container.setData('leverId', lever.id);

      this.leverSprites.push({ lever, container, trayPosition, slotIndex: null });
    });
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
    const leverId = container.getData('leverId') as string;
    const sprite = this.leverSprites.find((s) => s.lever.id === leverId);
    if (!sprite) return;

    const targetSlot = this.slots.find(
      (slot) => Math.abs(container.x - slot.x) <= SLOT_WIDTH / 2 && Math.abs(container.y - slot.y) <= SLOT_HEIGHT / 2,
    );

    if (sprite.slotIndex !== null) {
      this.slots[sprite.slotIndex].leverId = null;
      sprite.slotIndex = null;
    }

    if (targetSlot && targetSlot.leverId === null) {
      targetSlot.leverId = leverId;
      sprite.slotIndex = targetSlot.index;
      this.tweens.add({ targets: container, x: targetSlot.x, y: targetSlot.y, duration: 150 });
    } else {
      this.snapBack(sprite);
    }

    if (this.slots.every((slot) => slot.leverId !== null)) {
      this.evaluateAndShowFeedback();
    }
  }

  private snapBack(sprite: LeverSprite): void {
    this.tweens.add({
      targets: sprite.container,
      x: sprite.trayPosition.x,
      y: sprite.trayPosition.y,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  private evaluateAndShowFeedback(): void {
    this.locked = true;
    const arrangement = this.slots
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((slot) => slot.leverId as string);

    const evaluation = evaluateLeverArrangement(this.stage, arrangement);

    if (evaluation.condition === 'correct') {
      this.slots.forEach((slot) => slot.border.setStrokeStyle(4, PANEL_COLOR_CORRECT));
      this.feedbackText.setColor('#7CFC9C').setText(evaluation.message);
      this.events.emit('cipherquest:stage-complete');
      return; // stay locked — stage solved
    }

    const highlightedLeverIds = new Set(evaluation.violatedClues.flatMap((clue) => leverIdsInClue(clue)));
    this.slots.forEach((slot) => {
      const isHighlighted = slot.leverId !== null && highlightedLeverIds.has(slot.leverId);
      slot.border.setStrokeStyle(4, isHighlighted ? PANEL_COLOR_INCORRECT : PANEL_COLOR_DEFAULT);
    });
    this.feedbackText.setColor('#ffd166').setText(evaluation.message);

    this.time.delayedCall(1800, () => this.resetAfterFailedAttempt());
  }

  private resetAfterFailedAttempt(): void {
    this.slots.forEach((slot) => {
      slot.leverId = null;
      slot.border.setStrokeStyle(3, PANEL_COLOR_DEFAULT);
    });
    this.leverSprites.forEach((sprite) => {
      sprite.slotIndex = null;
      sprite.container.setPosition(sprite.trayPosition.x, sprite.trayPosition.y);
    });
    this.feedbackText.setColor('#8b98a5').setText(STRINGS[this.locale].defaultFeedback);
    this.locked = false;
  }
}
