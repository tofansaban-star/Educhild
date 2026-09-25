import type { LeverClue, LeverEvaluation, LeverSequenceStage } from './types';

function checkClue(clue: LeverClue, positions: Record<string, number>): boolean {
  switch (clue.kind) {
    case 'before':
      return positions[clue.subject] < positions[clue.object];
    case 'not_position':
      return positions[clue.subject] !== clue.position;
    case 'gap':
      return Math.abs(positions[clue.a] - positions[clue.b]) === clue.gap + 1;
  }
}

function toPositions(arrangement: string[]): Record<string, number> {
  const positions: Record<string, number> = {};
  arrangement.forEach((id, index) => {
    positions[id] = index + 1;
  });
  return positions;
}

/** Every lever id a clue references — used to highlight the specific levers involved in a violated rule. */
export function leverIdsInClue(clue: LeverClue): string[] {
  switch (clue.kind) {
    case 'before':
      return [clue.subject, clue.object];
    case 'not_position':
      return [clue.subject];
    case 'gap':
      return [clue.a, clue.b];
  }
}

/**
 * Judges a full arrangement (one lever id per position, left to right,
 * 1-based) against every clue at once.
 */
export function evaluateLeverArrangement(stage: LeverSequenceStage, arrangement: string[]): LeverEvaluation {
  const positions = toPositions(arrangement);
  const violatedClues = stage.clues.filter((clue) => !checkClue(clue, positions));
  const condition = violatedClues.length === 0 ? 'correct' : 'incorrect';

  const rule = stage.feedbackRules.find((r) => r.condition === condition);
  const message = (rule?.textResponse ?? '').replace(
    '{violatedRules}',
    violatedClues.map((c) => c.text).join(' '),
  );

  return { condition, violatedClues, message };
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

/**
 * Dev-time content check: brute-forces every arrangement of this tier's
 * levers and confirms exactly one satisfies every clue — the same
 * anti-drift principle as the other stages' validate*Content functions.
 */
export function validateLeverSequenceContent(stage: LeverSequenceStage): void {
  if (!import.meta.env.DEV) return;
  const leverIds = stage.levers.map((l) => l.id);
  const solutionCount = permutations(leverIds).filter((order) =>
    stage.clues.every((clue) => checkClue(clue, toPositions(order))),
  ).length;
  console.assert(
    solutionCount === 1,
    `[LeverSequenceStage:${stage.id}] expected exactly 1 arrangement satisfying every clue, found ${solutionCount}.`,
  );
}
