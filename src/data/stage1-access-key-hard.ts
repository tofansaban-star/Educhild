import type { AccessKeyStageSource } from '../domain/types';

export const stage1AccessKeyHard: AccessKeyStageSource = {
  id: 'stage-1-access-key-hard',
  type: 'visual_algebra',
  objective: {
    en: 'Find the hidden variable values through visual substitution.',
    id: 'Temukan nilai (value) tiap simbol rahasia lewat substitusi (substitution) visual.',
  },
  icons: [
    { id: 'vial', emoji: '🧪', label: 'Tabung' },
    { id: 'lens', emoji: '🔬', label: 'Lensa' },
    { id: 'helix', emoji: '🧬', label: 'Heliks' },
    { id: 'core', emoji: '⚛️', label: 'Inti' },
  ],
  equations: [
    {
      id: 'eq1',
      coefficients: { vial: 2 },
      constant: { numerator: 14, denominator: 1 },
      display: '🧪 + 🧪 = 14',
    },
    {
      id: 'eq2',
      coefficients: { vial: 1, lens: 1 },
      constant: { numerator: 20, denominator: 1 },
      display: '🧪 + 🔬 = 20',
    },
    {
      // helix = lens - vial  ->  vial - lens + helix = 0
      id: 'eq3',
      coefficients: { vial: 1, lens: -1, helix: 1 },
      constant: { numerator: 0, denominator: 1 },
      display: '🧬 = 🔬 - 🧪',
    },
    {
      // core = helix + lens  ->  -helix - lens + core = 0
      id: 'eq4',
      coefficients: { helix: -1, lens: -1, core: 1 },
      constant: { numerator: 0, denominator: 1 },
      display: '⚛️ = 🧬 + 🔬',
    },
  ],
  queryCoefficients: { core: 1, helix: -1 },
  queryDisplay: '⚛️ - 🧬',
  assets: [],
  solution: { description: 'Vial=7, Lens=13, Helix=6, Core=19 -> Core - Helix = 13' },
  feedbackRules: [
    {
      condition: 'incorrect',
      visualResponse: 'panel-blink-yellow',
      audioResponse: 'sfx-error-buzz',
      textResponse: {
        en: 'Values not synchronized. Re-check the Lens value.',
        id: 'Nilai belum sinkron. Cek ulang nilai Lensa.',
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
