import { solveLinearSystem } from '../linearSystem';
import type { AccessKeyStageSource, AlgebraEquation, AlgebraIcon, DifficultyTier, RationalValue } from '../types';
import type { Rng } from '../rng';
import { randInt, sample, shuffle } from '../rng';

/**
 * Icon pool a puzzle's 3 (easy/medium) or 4 (hard) icons are drawn from, so
 * repeated plays don't always show the same symbols. `label` is authoring-only
 * (AccessKeyScene never renders it, see `types.ts`'s `AccessKeyStageSource`
 * comment), so it stays a single mixed-language string like the original
 * hand-authored tiers did.
 */
const ICON_BANK: AlgebraIcon[] = [
  { id: 'key', emoji: '🔑', label: 'Kunci' },
  { id: 'shield', emoji: '🛡️', label: 'Perisai' },
  { id: 'coin', emoji: '🪙', label: 'Koin' },
  { id: 'gear', emoji: '⚙️', label: 'Gir' },
  { id: 'battery', emoji: '🔋', label: 'Baterai' },
  { id: 'disk', emoji: '💾', label: 'Disk' },
  { id: 'vial', emoji: '🧪', label: 'Tabung' },
  { id: 'lens', emoji: '🔬', label: 'Lensa' },
  { id: 'helix', emoji: '🧬', label: 'Heliks' },
  { id: 'core', emoji: '⚛️', label: 'Inti' },
  { id: 'gem', emoji: '💎', label: 'Permata' },
  { id: 'chip', emoji: '💻', label: 'Chip' },
];

const rat = (n: number): RationalValue => ({ numerator: n, denominator: 1 });

const TIER_RANGES: Record<'easy' | 'medium', { v1: [number, number]; inc: [number, number] }> = {
  easy: { v1: [3, 6], inc: [2, 6] },
  medium: { v1: [4, 8], inc: [3, 7] },
};

/**
 * Builds the 3-icon, addition-only equation chain (easy/medium tiers):
 * 2*v1 = c1, v1+v2 = c2, v3 = v2+v2. Sequential substitution only — the
 * target age group can't do simultaneous-equation elimination, per this
 * project's CLAUDE.md and the hand-authored tiers this pattern is lifted from.
 */
function buildAdditionChain(
  iconIds: string[],
  emoji: Record<string, string>,
  rng: Rng,
  range: { v1: [number, number]; inc: [number, number] },
): { equations: AlgebraEquation[]; queryCoefficients: Record<string, number>; queryDisplay: string } {
  const [i1, i2, i3] = iconIds;
  const v1 = randInt(rng, ...range.v1);
  const v2 = v1 + randInt(rng, ...range.inc);

  const equations: AlgebraEquation[] = [
    { id: 'eq1', coefficients: { [i1]: 2 }, constant: rat(2 * v1), display: `${emoji[i1]} + ${emoji[i1]} = ${2 * v1}` },
    {
      id: 'eq2',
      coefficients: { [i1]: 1, [i2]: 1 },
      constant: rat(v1 + v2),
      display: `${emoji[i1]} + ${emoji[i2]} = ${v1 + v2}`,
    },
    {
      id: 'eq3',
      coefficients: { [i2]: -2, [i3]: 1 },
      constant: rat(0),
      display: `${emoji[i3]} = ${emoji[i2]} + ${emoji[i2]}`,
    },
  ];

  return { equations, queryCoefficients: { [i3]: 1, [i1]: 1 }, queryDisplay: `${emoji[i3]} + ${emoji[i1]}` };
}

/**
 * Builds the 4-icon chain that adds subtraction (hard tier):
 * 2*v1 = c1, v1+v2 = c2, v3 = v2-v1, v4 = v3+v2. Still purely sequential.
 */
function buildSubtractionChain(
  iconIds: string[],
  emoji: Record<string, string>,
  rng: Rng,
): { equations: AlgebraEquation[]; queryCoefficients: Record<string, number>; queryDisplay: string } {
  const [i1, i2, i3, i4] = iconIds;
  const v1 = randInt(rng, 4, 9);
  const v2 = v1 + randInt(rng, 4, 9);

  const equations: AlgebraEquation[] = [
    { id: 'eq1', coefficients: { [i1]: 2 }, constant: rat(2 * v1), display: `${emoji[i1]} + ${emoji[i1]} = ${2 * v1}` },
    {
      id: 'eq2',
      coefficients: { [i1]: 1, [i2]: 1 },
      constant: rat(v1 + v2),
      display: `${emoji[i1]} + ${emoji[i2]} = ${v1 + v2}`,
    },
    {
      id: 'eq3',
      coefficients: { [i1]: 1, [i2]: -1, [i3]: 1 },
      constant: rat(0),
      display: `${emoji[i3]} = ${emoji[i2]} - ${emoji[i1]}`,
    },
    {
      id: 'eq4',
      coefficients: { [i3]: -1, [i2]: -1, [i4]: 1 },
      constant: rat(0),
      display: `${emoji[i4]} = ${emoji[i3]} + ${emoji[i2]}`,
    },
  ];

  return { equations, queryCoefficients: { [i4]: 1, [i3]: -1 }, queryDisplay: `${emoji[i4]} - ${emoji[i3]}` };
}

/**
 * Generates a fresh Stage 1 puzzle. Never trusts its own hand-derived values —
 * every candidate is re-solved through the real `solveLinearSystem` (same code
 * the game runs) and rejected unless it yields a unique, all-positive,
 * all-distinct integer solution, mirroring how the hand-authored tiers were
 * verified (see README "Tiered content").
 */
export function generateAccessKeyStage(tier: DifficultyTier, rng: Rng): AccessKeyStageSource {
  const iconCount = tier === 'hard' ? 4 : 3;

  for (let attempt = 0; attempt < 200; attempt++) {
    const icons = shuffle(rng, sample(rng, ICON_BANK, iconCount));
    const iconIds = icons.map((icon) => icon.id);
    const emoji = Object.fromEntries(icons.map((icon) => [icon.id, icon.emoji]));

    const built =
      tier === 'hard'
        ? buildSubtractionChain(iconIds, emoji, rng)
        : buildAdditionChain(iconIds, emoji, rng, TIER_RANGES[tier]);

    const coeffMatrix = built.equations.map((eq) => iconIds.map((id) => rat(eq.coefficients[id] ?? 0)));
    const constants = built.equations.map((eq) => eq.constant);
    const solved = solveLinearSystem(coeffMatrix, constants);
    if (!solved) continue;

    const solvedValues = solved.map((r) => r.toDecimal());
    if (solvedValues.some((v) => !Number.isInteger(v) || v <= 0)) continue;
    if (new Set(solvedValues).size !== solvedValues.length) continue;

    const expectedAnswer = Object.entries(built.queryCoefficients).reduce(
      (sum, [id, coefficient]) => sum + solvedValues[iconIds.indexOf(id)] * coefficient,
      0,
    );

    return {
      id: `stage-1-access-key-${tier}-${Date.now()}`,
      type: 'visual_algebra',
      objective: {
        en: 'Find the hidden variable values through visual substitution.',
        id: 'Temukan nilai (value) tiap simbol rahasia lewat substitusi (substitution) visual.',
      },
      icons,
      equations: built.equations,
      queryCoefficients: built.queryCoefficients,
      queryDisplay: built.queryDisplay,
      assets: [],
      solution: {
        description: `${iconIds.map((id, i) => `${id}=${solvedValues[i]}`).join(', ')} -> ${built.queryDisplay} = ${expectedAnswer}`,
      },
      feedbackRules: [
        {
          condition: 'incorrect',
          visualResponse: 'panel-blink-yellow',
          audioResponse: 'sfx-error-buzz',
          textResponse: {
            en: 'Values not synchronized. Try again.',
            id: 'Nilai belum sinkron. Coba lagi.',
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
  }

  throw new Error(`generateAccessKeyStage: failed to generate a valid ${tier} puzzle after 200 attempts`);
}
