import type { AccessKeyStageSource } from '../domain/types';

export const stage1AccessKeyMedium: AccessKeyStageSource = {
  id: 'stage-1-access-key-medium',
  type: 'visual_algebra',
  objective: {
    en: 'Find the hidden variable values through visual substitution.',
    id: 'Temukan nilai (value) tiap simbol rahasia lewat substitusi (substitution) visual.',
  },
  icons: [
    { id: 'gear', emoji: '⚙️', label: 'Gir' },
    { id: 'battery', emoji: '🔋', label: 'Baterai' },
    { id: 'disk', emoji: '💾', label: 'Disk' },
  ],
  equations: [
    {
      id: 'eq1',
      coefficients: { gear: 2 },
      constant: { numerator: 12, denominator: 1 },
      display: '⚙️ + ⚙️ = 12',
    },
    {
      id: 'eq2',
      coefficients: { gear: 1, battery: 1 },
      constant: { numerator: 10, denominator: 1 },
      display: '⚙️ + 🔋 = 10',
    },
    {
      // disk = battery + battery  ->  -2*battery + disk = 0
      id: 'eq3',
      coefficients: { battery: -2, disk: 1 },
      constant: { numerator: 0, denominator: 1 },
      display: '💾 = 🔋 + 🔋',
    },
  ],
  queryCoefficients: { disk: 1, gear: 1 },
  queryDisplay: '💾 + ⚙️',
  assets: [],
  solution: { description: 'Gear=6, Battery=4, Disk=8 -> Disk + Gear = 14' },
  feedbackRules: [
    {
      condition: 'incorrect',
      visualResponse: 'panel-blink-yellow',
      audioResponse: 'sfx-error-buzz',
      textResponse: {
        en: 'Values not synchronized. Re-check the Battery value.',
        id: 'Nilai belum sinkron. Cek ulang nilai Baterai.',
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
