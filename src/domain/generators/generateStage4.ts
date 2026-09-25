import type { DifficultyTier, LeverClueSource, LeverItemSource, LeverSequenceStageSource, LocalizedText } from '../types';
import type { Rng } from '../rng';
import { sample, shuffle } from '../rng';

const LEVER_BANK: LeverItemSource[] = [
  { id: 'red', label: { en: 'Red', id: 'Merah' }, color: 0xe74c3c },
  { id: 'yellow', label: { en: 'Yellow', id: 'Kuning' }, color: 0xf1c40f },
  { id: 'blue', label: { en: 'Blue', id: 'Biru' }, color: 0x3498db },
  { id: 'green', label: { en: 'Green', id: 'Hijau' }, color: 0x2ecc71 },
  { id: 'orange', label: { en: 'Orange', id: 'Oranye' }, color: 0xe67e22 },
  { id: 'purple', label: { en: 'Purple', id: 'Ungu' }, color: 0x9b59b6 },
];

interface ClueQuota {
  before: number;
  not_position: number;
  gap: number;
}

/**
 * Clue-kind mix per tier, lifted straight from the hand-authored data (README
 * "Tiered content"): easy is before + not_position only, medium adds one gap
 * clue, hard adds a second before clue on top of medium's mix (and scales to
 * 4 levers).
 */
const TIER_QUOTA: Record<DifficultyTier, ClueQuota> = {
  easy: { before: 1, not_position: 2, gap: 0 },
  medium: { before: 1, not_position: 1, gap: 1 },
  hard: { before: 2, not_position: 1, gap: 1 },
};

function checkClue(clue: LeverClueSource, positions: Record<string, number>): boolean {
  switch (clue.kind) {
    case 'before':
      return positions[clue.subject] < positions[clue.object];
    case 'not_position':
      return positions[clue.subject] !== clue.position;
    case 'gap':
      return Math.abs(positions[clue.a] - positions[clue.b]) === clue.gap + 1;
  }
}

function toPositions(order: string[]): Record<string, number> {
  const positions: Record<string, number> = {};
  order.forEach((id, i) => {
    positions[id] = i + 1;
  });
  return positions;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    permutations(rest).forEach((p) => out.push([item, ...p]));
  });
  return out;
}

function countSatisfying(leverIds: string[], clues: LeverClueSource[]): number {
  return permutations(leverIds).filter((order) => clues.every((clue) => checkClue(clue, toPositions(order)))).length;
}

function positionWord(position: number, n: number, locale: 'en' | 'id'): string {
  if (position === 1) return locale === 'en' ? 'first' : 'pertama';
  if (position === n) return locale === 'en' ? 'last' : 'terakhir';
  return locale === 'en' ? `position ${position}` : `posisi ke-${position}`;
}

function beforeClueText(subjectLabel: LocalizedText, objectLabel: LocalizedText): LocalizedText {
  return {
    en: `The ${subjectLabel.en} lever must be pulled before the ${objectLabel.en} lever.`,
    id: `Tuas ${subjectLabel.id} harus ditarik sebelum tuas ${objectLabel.id}.`,
  };
}

function notPositionClueText(subjectLabel: LocalizedText, position: number, n: number): LocalizedText {
  return {
    en: `The ${subjectLabel.en} lever cannot be pulled ${positionWord(position, n, 'en')}.`,
    id: `Tuas ${subjectLabel.id} tidak boleh ditarik ${positionWord(position, n, 'id')}.`,
  };
}

function gapClueText(aLabel: LocalizedText, bLabel: LocalizedText, gap: number): LocalizedText {
  if (gap === 0) {
    return {
      en: `The ${aLabel.en} and ${bLabel.en} levers are pulled right next to each other.`,
      id: `Tuas ${aLabel.id} dan ${bLabel.id} ditarik berdampingan langsung.`,
    };
  }
  return {
    en: `There is exactly ${gap} lever(s) between ${aLabel.en} and ${bLabel.en}.`,
    id: `Ada tepat ${gap} tuas di antara ${aLabel.id} dan ${bLabel.id}.`,
  };
}

/**
 * Generates a fresh Stage 4 puzzle: picks a random lever subset and a random
 * solution order for it, generates true clues about that order at the tier's
 * clue-kind quota, then brute-forces every permutation (cheap at 3-4 levers)
 * to confirm exactly one arrangement satisfies every clue — and, matching the
 * authoring-quality bar the hand-authored tiers were held to (README "Stage 4
 * — verified"), that every clue is load-bearing: removing any single one
 * would break uniqueness.
 */
export function generateLeverSequenceStage(tier: DifficultyTier, rng: Rng): LeverSequenceStageSource {
  const n = tier === 'hard' ? 4 : 3;
  const quota = TIER_QUOTA[tier];
  const labelById = new Map(LEVER_BANK.map((l) => [l.id, l.label]));

  for (let attempt = 0; attempt < 500; attempt++) {
    const levers = sample(rng, LEVER_BANK, n);
    const leverIds = levers.map((l) => l.id);
    const order = shuffle(rng, leverIds);
    const positions = toPositions(order);

    const beforeFacts = shuffle(
      rng,
      leverIds.flatMap((a) => leverIds.filter((b) => positions[a] < positions[b]).map((b) => [a, b] as const)),
    );
    const notPositionFacts = shuffle(
      rng,
      leverIds.flatMap((a) =>
        Array.from({ length: n }, (_, i) => i + 1)
          .filter((p) => p !== positions[a])
          .map((p) => [a, p] as const),
      ),
    );
    const gapFacts = shuffle(
      rng,
      leverIds.flatMap((a, i) =>
        leverIds.slice(i + 1).map((b) => [a, b, Math.abs(positions[a] - positions[b]) - 1] as const),
      ),
    );

    if (beforeFacts.length < quota.before || notPositionFacts.length < quota.not_position || gapFacts.length < quota.gap) {
      continue;
    }

    const clues: LeverClueSource[] = [
      ...beforeFacts.slice(0, quota.before).map(
        ([subject, object]): LeverClueSource => ({
          kind: 'before',
          subject,
          object,
          text: beforeClueText(labelById.get(subject)!, labelById.get(object)!),
        }),
      ),
      ...notPositionFacts.slice(0, quota.not_position).map(
        ([subject, position]): LeverClueSource => ({
          kind: 'not_position',
          subject,
          position,
          text: notPositionClueText(labelById.get(subject)!, position, n),
        }),
      ),
      ...gapFacts.slice(0, quota.gap).map(
        ([a, b, gap]): LeverClueSource => ({
          kind: 'gap',
          a,
          b,
          gap,
          text: gapClueText(labelById.get(a)!, labelById.get(b)!, gap),
        }),
      ),
    ];

    if (countSatisfying(leverIds, clues) !== 1) continue;

    const everyClueLoadBearing = clues.every(
      (_, i) => countSatisfying(leverIds, clues.filter((_, j) => j !== i)) !== 1,
    );
    if (!everyClueLoadBearing) continue;

    return {
      id: `stage-4-lever-sequence-${tier}-${Date.now()}`,
      type: 'deductive_logic',
      objective: {
        en: `Arrange the ${n} levers into positions 1-${n} using the clues below.`,
        id: `Susun ${n} tuas ke posisi 1-${n} pakai logika (logic) dari petunjuk di bawah ini.`,
      },
      levers,
      clues: shuffle(rng, clues),
      assets: [],
      solution: { description: order.map((id, i) => `${id}=${i + 1}`).join(', ') },
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
  }

  throw new Error(`generateLeverSequenceStage: failed to generate a valid ${tier} puzzle after 500 attempts`);
}
