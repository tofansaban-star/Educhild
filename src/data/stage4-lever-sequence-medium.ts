import type { LeverSequenceStageSource } from '../domain/types';

/**
 * The design doc's own worked example (Section 5, Stage 4) states the answer
 * as Blue=1/Red=2/Yellow=3, but that arrangement does NOT satisfy its own
 * clue 3 ("exactly 1 lever between Red and Blue") under the literal reading
 * — positions 1 and 2 are adjacent, with 0 levers between them. Brute-forcing
 * all 6 permutations against the clues as literally worded (see this
 * project's CLAUDE.md "Corrections on record") gives a different, actually
 * unique solution: Blue=1, Yellow=2, Red=3. That's what's encoded here.
 */
export const stage4LeverSequenceMedium: LeverSequenceStageSource = {
  id: 'stage-4-lever-sequence-medium',
  type: 'deductive_logic',
  objective: {
    en: 'Arrange the 3 levers into positions 1-3 using the clues below.',
    id: 'Susun 3 tuas ke posisi 1-3 pakai logika (logic) dari petunjuk di bawah ini.',
  },
  levers: [
    { id: 'red', label: { en: 'Red', id: 'Merah' }, color: 0xe74c3c },
    { id: 'yellow', label: { en: 'Yellow', id: 'Kuning' }, color: 0xf1c40f },
    { id: 'blue', label: { en: 'Blue', id: 'Biru' }, color: 0x3498db },
  ],
  clues: [
    {
      kind: 'before',
      subject: 'blue',
      object: 'yellow',
      text: {
        en: 'Blue lever must be pulled BEFORE Yellow lever.',
        id: 'Tuas Biru harus ditarik SEBELUM tuas Kuning.',
      },
    },
    {
      kind: 'not_position',
      subject: 'red',
      position: 1,
      text: { en: 'Red lever CANNOT be the first lever.', id: 'Tuas Merah TIDAK BOLEH jadi tuas pertama.' },
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
  ],
  assets: [],
  solution: { description: 'Blue=1, Yellow=2, Red=3' },
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
