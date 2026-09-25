import { Rational, sumRationals } from '../rational';
import type { DifficultyTier, PowerCell, ReactorStageSource } from '../types';
import type { Rng } from '../rng';
import { sample, shuffle } from '../rng';

interface Frac {
  numerator: number;
  denominator: number;
}

const f = (numerator: number, denominator: number): Frac => ({ numerator, denominator });

/** Terminating fractions (denominator only has factors 2/5) — easy & medium tiers. */
const NICE_CLEAN_POOL: Frac[] = [
  f(1, 2),
  f(1, 4),
  f(3, 4),
  f(1, 5),
  f(2, 5),
  f(3, 5),
  f(4, 5),
  f(1, 10),
  f(3, 10),
  f(7, 10),
  f(9, 10),
];

/** Eighths-heavy pool — "less obvious fractions" for the hard tier, per README. */
const HARD_CLEAN_POOL: Frac[] = [f(1, 8), f(3, 8), f(5, 8), f(7, 8), f(1, 4), f(3, 4), f(1, 2)];

/** Non-terminating (repeating-decimal) fractions — always trigger `concept_error`. */
const DISTRACTOR_POOL: { value: Frac; reasonId: string }[] = [
  { value: f(1, 3), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(2, 3), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(1, 6), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(5, 6), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(1, 7), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(2, 7), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(1, 9), reasonId: 'desimal tak berujung (non-terminating decimal)' },
  { value: f(2, 9), reasonId: 'desimal tak berujung (non-terminating decimal)' },
];

function displayFraction(v: Frac, rng: Rng): string {
  const r = new Rational(v.numerator, v.denominator);
  const percentExact = (r.numerator * 100) % r.denominator === 0;
  if (percentExact && rng() < 0.4) {
    return `${(r.numerator * 100) / r.denominator}%`;
  }
  return `${r.numerator}/${r.denominator}`;
}

/** Counts how many 3-element subsets of `cells` sum exactly to `target`. */
function countTripleMatches(cells: Frac[], target: Rational): number {
  let matches = 0;
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      for (let k = j + 1; k < cells.length; k++) {
        const sum = Rational.fromValue(cells[i])
          .add(Rational.fromValue(cells[j]))
          .add(Rational.fromValue(cells[k]));
        if (sum.equals(target)) matches++;
      }
    }
  }
  return matches;
}

/**
 * Generates a fresh Stage 2 puzzle. Builds the target from 3 randomly chosen
 * "solution" cells (rather than picking a target and searching for cells that
 * hit it), then brute-force counts every 3-cell combo among the non-distractor
 * cells to confirm exactly one sums to the target exactly — the same
 * combo-enumeration check the hand-authored tiers were verified with (see
 * README "Tiered content"), just run at generation time instead of by hand.
 */
export function generateReactorStage(tier: DifficultyTier, rng: Rng): ReactorStageSource {
  const cleanPool = tier === 'hard' ? HARD_CLEAN_POOL : NICE_CLEAN_POOL;
  const distractorCount = tier === 'hard' ? 2 : 1;
  const totalCells = tier === 'hard' ? 6 : 5;
  const cleanCount = totalCells - distractorCount;

  for (let attempt = 0; attempt < 300; attempt++) {
    const chosenClean = sample(rng, cleanPool, cleanCount);
    const solution = sample(rng, chosenClean, 3);
    const target = sumRationals(solution.map((v) => Rational.fromValue(v)));
    const targetDecimal = target.toDecimal();

    // Keep the "fill to X%" framing sensible: not trivially low, not over 100%.
    if (targetDecimal < 0.5 || targetDecimal > 1) continue;
    if (countTripleMatches(chosenClean, target) !== 1) continue;

    const distractors = sample(rng, DISTRACTOR_POOL, distractorCount);

    const cleanCells: PowerCell[] = chosenClean.map((value, i) => ({
      id: `cell-clean-${i}`,
      display: displayFraction(value, rng),
      value,
      isDistractor: false,
    }));
    const distractorCells: PowerCell[] = distractors.map((d, i) => ({
      id: `cell-distractor-${i}`,
      display: displayFraction(d.value, rng),
      value: d.value,
      isDistractor: true,
      distractorReason: d.reasonId,
    }));

    const availableCells = shuffle(rng, [...cleanCells, ...distractorCells]);
    const targetLabel = target.toPercentLabel(1);

    return {
      id: `stage-2-reactor-bypass-${tier}-${Date.now()}`,
      type: 'fractions_percent',
      objective: {
        en: `Fill the reactor to EXACTLY ${targetLabel} capacity using 3 power cells.`,
        id: `Isi reaktor pakai pecahan (fraction) & persen (percent) hingga TEPAT ${targetLabel} kapasitas, pakai 3 sel daya (power cell).`,
      },
      requiredCellCount: 3,
      targetPercentage: target.toValue(),
      availableCells,
      assets: [],
      solution: {
        description: `${cleanCells
          .filter((c) => solution.some((s) => s.numerator === c.value.numerator && s.denominator === c.value.denominator))
          .map((c) => c.display)
          .join(' + ')} = ${targetLabel}`,
      },
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
            en: `Insufficient power ({percent}). Target ${targetLabel} missed. Try smaller capacity cells.`,
            id: `Daya kurang ({percent}). Target ${targetLabel} meleset. Coba sel berkapasitas lebih kecil.`,
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
  }

  throw new Error(`generateReactorStage: failed to generate a valid ${tier} puzzle after 300 attempts`);
}
