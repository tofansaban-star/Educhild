import type { LeverSequenceStageSource } from '../domain/types';

export const stage4LeverSequenceHard: LeverSequenceStageSource = {
  id: 'stage-4-lever-sequence-hard',
  type: 'deductive_logic',
  objective: {
    en: 'Arrange the 4 levers into positions 1-4 using the clues below.',
    id: 'Susun 4 tuas ke posisi 1-4 pakai logika (logic) dari petunjuk di bawah ini.',
  },
  levers: [
    { id: 'red', label: { en: 'Red', id: 'Merah' }, color: 0xe74c3c },
    { id: 'yellow', label: { en: 'Yellow', id: 'Kuning' }, color: 0xf1c40f },
    { id: 'blue', label: { en: 'Blue', id: 'Biru' }, color: 0x3498db },
    { id: 'green', label: { en: 'Green', id: 'Hijau' }, color: 0x2ecc71 },
  ],
  clues: [
    {
      kind: 'before',
      subject: 'blue',
      object: 'yellow',
      text: {
        en: 'Blue lever must be pulled before Yellow lever.',
        id: 'Tuas Biru harus ditarik sebelum tuas Kuning.',
      },
    },
    {
      kind: 'not_position',
      subject: 'red',
      position: 1,
      text: { en: 'Red lever cannot be the first lever.', id: 'Tuas Merah tidak boleh jadi tuas pertama.' },
    },
    {
      kind: 'gap',
      a: 'red',
      b: 'blue',
      gap: 1,
      text: {
        en: 'There is exactly 1 lever between Red and Blue.',
        id: 'Ada tepat 1 tuas di antara Merah dan Biru.',
      },
    },
    {
      kind: 'before',
      subject: 'green',
      object: 'blue',
      text: {
        en: 'Green lever must be pulled before Blue lever.',
        id: 'Tuas Hijau harus ditarik sebelum tuas Biru.',
      },
    },
  ],
  assets: [],
  solution: { description: 'Green=1, Blue=2, Yellow=3, Red=4' },
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
