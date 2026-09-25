import type { LeverSequenceStageSource } from '../domain/types';

export const stage4LeverSequenceEasy: LeverSequenceStageSource = {
  id: 'stage-4-lever-sequence-easy',
  type: 'deductive_logic',
  objective: {
    en: 'Arrange the 3 levers into positions 1-3 using the clues below.',
    id: 'Susun 3 tuas ke posisi 1-3 pakai logika (logic) dari petunjuk di bawah ini.',
  },
  levers: [
    { id: 'green', label: { en: 'Green', id: 'Hijau' }, color: 0x2ecc71 },
    { id: 'orange', label: { en: 'Orange', id: 'Oranye' }, color: 0xe67e22 },
    { id: 'purple', label: { en: 'Purple', id: 'Ungu' }, color: 0x9b59b6 },
  ],
  clues: [
    {
      kind: 'not_position',
      subject: 'orange',
      position: 1,
      text: { en: 'The Orange lever cannot be pulled first.', id: 'Tuas Oranye tidak boleh ditarik pertama.' },
    },
    {
      kind: 'not_position',
      subject: 'orange',
      position: 3,
      text: { en: 'The Orange lever cannot be pulled last.', id: 'Tuas Oranye tidak boleh ditarik terakhir.' },
    },
    {
      kind: 'before',
      subject: 'green',
      object: 'purple',
      text: {
        en: 'The Green lever must be pulled before the Purple lever.',
        id: 'Tuas Hijau harus ditarik sebelum tuas Ungu.',
      },
    },
  ],
  assets: [],
  solution: { description: 'Green=1, Orange=2, Purple=3' },
  feedbackRules: [
    {
      condition: 'incorrect',
      visualResponse: 'lever-lock-red',
      audioResponse: 'sfx-mechanical-click',
      textResponse: {
        en: 'Lever sequence rejected. Violated: {violatedRules}',
        id: 'Urutan tuas ditolak. Melanggar: {violatedRules}',
      },
    },
    {
      condition: 'correct',
      visualResponse: 'levers-descend',
      audioResponse: 'sfx-vault-open',
      textResponse: {
        en: 'All levers descend together. Vault opens!',
        id: 'Semua tuas turun bersamaan. Brankas terbuka!',
      },
    },
  ],
};
