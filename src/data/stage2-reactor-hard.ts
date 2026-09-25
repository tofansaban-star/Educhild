import type { ReactorStageSource } from '../domain/types';

export const stage2ReactorHard: ReactorStageSource = {
  id: 'stage-2-reactor-bypass-hard',
  type: 'fractions_percent',
  objective: {
    en: 'Fill the reactor to EXACTLY 75% capacity using 3 power cells.',
    id: 'Isi reaktor pakai pecahan (fraction) & persen (percent) hingga TEPAT 75% kapasitas, pakai 3 sel daya (power cell).',
  },
  requiredCellCount: 3,
  targetPercentage: { numerator: 75, denominator: 100 },
  availableCells: [
    { id: 'cell-a', display: '1/8', value: { numerator: 1, denominator: 8 }, isDistractor: false },
    { id: 'cell-b', display: '3/8', value: { numerator: 3, denominator: 8 }, isDistractor: false },
    { id: 'cell-c', display: '1/4', value: { numerator: 1, denominator: 4 }, isDistractor: false },
    { id: 'cell-d', display: '1/2', value: { numerator: 1, denominator: 2 }, isDistractor: false },
    {
      id: 'cell-e',
      display: '1/3',
      value: { numerator: 1, denominator: 3 },
      isDistractor: true,
      distractorReason: 'desimal tak berujung (non-terminating decimal)',
    },
    {
      id: 'cell-f',
      display: '1/6',
      value: { numerator: 1, denominator: 6 },
      isDistractor: true,
      distractorReason: 'desimal tak berujung (non-terminating decimal)',
    },
  ],
  assets: [],
  solution: { description: 'Cell A (1/8) + Cell B (3/8) + Cell C (1/4) = 75%' },
  feedbackRules: [
    {
      condition: 'overload',
      visualResponse: 'reactor-blink-yellow',
      audioResponse: 'sfx-overload-buzz',
      textResponse: {
        en: 'Overload! Capacity {percent}. System rejected. Reduce slightly.',
        id: 'Kelebihan! Kapasitas {percent}. Sistem menolak. Kurangi sedikit.',
      },
    },
    {
      condition: 'underload',
      visualResponse: 'reactor-blink-blue',
      audioResponse: 'sfx-underload-hum',
      textResponse: {
        en: 'Insufficient power ({percent}). Target 75% missed. Try smaller capacity cells.',
        id: 'Daya kurang ({percent}). Target 75% meleset. Coba sel berkapasitas lebih kecil.',
      },
    },
    {
      condition: 'concept_error',
      visualResponse: 'reactor-flicker-purple',
      audioResponse: 'sfx-glitch',
      textResponse: {
        en: 'Alert: Repeating decimal ({percent}) is unstable in this system!',
        id: 'Peringatan: Desimal berulang (repeating decimal) ({percent}) bikin sistem tidak stabil!',
      },
    },
    {
      condition: 'correct',
      visualResponse: 'reactor-glow-green',
      audioResponse: 'sfx-access-granted',
      textResponse: { en: '{percent} locked in. Access Granted.', id: '{percent} terkunci. Akses Diberikan.' },
    },
  ],
};
