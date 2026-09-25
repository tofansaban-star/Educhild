import type { AccessKeyStageSource } from '../domain/types';

export const stage1AccessKeyEasy: AccessKeyStageSource = {
  id: 'stage-1-access-key-easy',
  type: 'visual_algebra',
  objective: {
    en: 'Find the hidden variable values through visual substitution.',
    id: 'Temukan nilai (value) tiap simbol rahasia lewat substitusi (substitution) visual.',
  },
  icons: [
    { id: 'key', emoji: '🔑', label: 'Kunci' },
    { id: 'shield', emoji: '🛡️', label: 'Perisai' },
    { id: 'coin', emoji: '🪙', label: 'Koin' },
  ],
  equations: [
    {
      id: 'eq1',
      coefficients: { key: 2 },
      constant: { numerator: 8, denominator: 1 },
      display: '🔑 + 🔑 = 8',
    },
    {
      id: 'eq2',
      coefficients: { key: 1, shield: 1 },
      constant: { numerator: 10, denominator: 1 },
      display: '🔑 + 🛡️ = 10',
    },
    {
      // coin = shield + shield -> -2*shield + coin = 0
      id: 'eq3',
      coefficients: { shield: -2, coin: 1 },
      constant: { numerator: 0, denominator: 1 },
      display: '🪙 = 🛡️ + 🛡️',
    },
  ],
  queryCoefficients: { coin: 1, key: 1 },
  queryDisplay: '🪙 + 🔑',
  assets: [],
  solution: { description: 'Key=4, Shield=6, Coin=12 -> Coin + Key = 16' },
  feedbackRules: [
    {
      condition: 'incorrect',
      visualResponse: 'panel-blink-yellow',
      audioResponse: 'sfx-error-buzz',
      textResponse: {
        en: 'Values not synchronized. Re-check the Shield value.',
        id: 'Nilai belum sinkron. Cek ulang nilai Perisai.',
      },
    },
    {
      condition: 'correct',
      visualResponse: 'panel-glow-green',
      audioResponse: 'sfx-access-granted',
      textResponse: { en: 'Access Granted.', id: 'Akses Diberikan.' },
    },
  ],
};
