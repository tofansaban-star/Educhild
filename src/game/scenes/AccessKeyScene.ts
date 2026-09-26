import Phaser from 'phaser';
import { getStage1Content } from '../../data/content';
import { evaluateAccessKeyAnswer } from '../../domain/algebraLogic';
import type { AccessKeyStage, DifficultyTier, Locale } from '../../domain/types';

const PANEL_COLOR_DEFAULT = 0x2c3e50;
const PANEL_COLOR_CORRECT = 0x2ecc71;
const PANEL_COLOR_INCORRECT = 0xf1c40f;

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
const MAX_DIGITS = 3;

const STRINGS: Record<Locale, { title: string; query: string; unlocked: string }> = {
  en: { title: 'ACCESS KEY', query: 'Final Question: Enter the value of', unlocked: 'Key unlocked!' },
  id: { title: 'KUNCI AKSES', query: 'Pertanyaan Terakhir: Masukkan nilai (value) dari', unlocked: 'Kunci terbuka!' },
};

export class AccessKeyScene extends Phaser.Scene {
  private panelBorder!: Phaser.GameObjects.Rectangle;
  private answerText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private buffer = '';
  private locked = false;
  private stage!: AccessKeyStage;
  private locale: Locale = 'en';

  constructor() {
    super('AccessKeyScene');
  }

  init(data: { tier?: DifficultyTier; locale?: Locale } = {}): void {
    this.locale = data.locale ?? 'en';
    this.stage = getStage1Content(data.tier ?? 'medium', this.locale);
  }

  create(): void {
    this.buffer = '';
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
      .rectangle(400, 165, 560, 130)
      .setStrokeStyle(3, PANEL_COLOR_DEFAULT)
      .setFillStyle(0x111827, 1);

    const equationLines = this.stage.equations.map((eq) => eq.display).join('\n');
    this.add
      .text(400, 165, equationLines, { fontSize: '19px', color: '#ffffff', align: 'center', lineSpacing: 10 })
      .setOrigin(0.5);

    this.add
      .text(400, 250, `${strings.query} (${this.stage.queryDisplay})`, {
        fontSize: '14px',
        color: '#c9d6e3',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);

    this.answerText = this.add
      .text(400, 285, '_', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);

    this.feedbackText = this.add
      .text(400, 320, '', { fontSize: '14px', color: '#8b98a5', align: 'center', wordWrap: { width: 620 } })
      .setOrigin(0.5, 0);

    this.createKeypad();
  }

  private createKeypad(): void {
    const cols = 3;
    const startX = 310;
    const startY = 395;
    const gapX = 90;
    const gapY = 54;

    KEYPAD_KEYS.forEach((key, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      const bg = this.add.rectangle(0, 0, 76, 46, 0x1f3a6e, 1).setStrokeStyle(2, 0x8ab4f8);
      const label = this.add.text(0, 0, key, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      const container = this.add.container(x, y, [bg, label]);
      container.setSize(76, 46);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerup', () => this.handleKeyPress(key));
    });
  }

  private handleKeyPress(key: string): void {
    if (this.locked) return;

    if (key === '⌫') {
      this.buffer = this.buffer.slice(0, -1);
    } else if (key === '✓') {
      this.submitAnswer();
      return;
    } else if (this.buffer.length < MAX_DIGITS) {
      this.buffer += key;
    }

    this.answerText.setText(this.buffer.length ? this.buffer : '_');
  }

  private submitAnswer(): void {
    if (this.buffer.length === 0) return;

    const playerAnswer = Number(this.buffer);
    const evaluation = evaluateAccessKeyAnswer(this.stage, playerAnswer);

    if (evaluation.condition === 'correct') {
      this.locked = true;
      this.panelBorder.setStrokeStyle(4, PANEL_COLOR_CORRECT);
      this.feedbackText.setColor('#7CFC9C').setText(`${evaluation.message} ${STRINGS[this.locale].unlocked}`);
      this.events.emit('cipherquest:stage-complete');
      return;
    }

    this.panelBorder.setStrokeStyle(4, PANEL_COLOR_INCORRECT);
    this.feedbackText.setColor('#ffd166').setText(evaluation.message);
    this.buffer = '';
    this.answerText.setText('_');
    this.time.delayedCall(500, () => this.panelBorder.setStrokeStyle(3, PANEL_COLOR_DEFAULT));
  }
}
