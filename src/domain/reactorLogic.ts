import { Rational, sumRationals } from './rational';
import type { PowerCell, ReactorEvaluation, ReactorStage } from './types';

export function sumCellValues(cells: PowerCell[]): Rational {
  return sumRationals(cells.map((cell) => Rational.fromValue(cell.value)));
}

/**
 * Judges a completed selection. Returns null if the selection isn't at
 * `requiredCellCount` yet — callers should use `sumCellValues` directly for
 * a live running total before that point.
 *
 * Precedence: a distractor cell (non-terminating decimal) always yields
 * `concept_error`, even when the numeric sum would otherwise read as
 * overload/underload — the lesson is "this cell is unstable," not "this
 * cell happens to also be too much/too little."
 */
export function evaluateReactorSelection(
  stage: ReactorStage,
  selectedCells: PowerCell[],
): ReactorEvaluation | null {
  if (selectedCells.length !== stage.requiredCellCount) {
    return null;
  }

  const sum = sumCellValues(selectedCells);
  const target = Rational.fromValue(stage.targetPercentage);
  const hasDistractor = selectedCells.some((cell) => cell.isDistractor);

  const condition = hasDistractor
    ? 'concept_error'
    : sum.equals(target)
      ? 'correct'
      : sum.compare(target) > 0
        ? 'overload'
        : 'underload';

  const rule = stage.feedbackRules.find((r) => r.condition === condition);
  const message = (rule?.textResponse ?? '').replace('{percent}', sum.toPercentLabel(1));

  return {
    condition,
    sum: sum.toValue(),
    sumPercentDisplay: sum.toPercentLabel(1),
    selectedCellIds: selectedCells.map((cell) => cell.id),
    message,
  };
}

/**
 * Dev-time content check: catches content-authoring mistakes where a
 * cell's `isDistractor` flag disagrees with what the fraction actually does
 * in base 10. Cheap and only runs in dev builds.
 */
export function validateReactorContent(stage: ReactorStage): void {
  if (!import.meta.env.DEV) return;
  stage.availableCells.forEach((cell) => {
    const terminates = Rational.fromValue(cell.value).isTerminatingDecimal();
    console.assert(
      cell.isDistractor === !terminates,
      `[ReactorStage:${stage.id}] cell "${cell.id}" isDistractor=${cell.isDistractor} ` +
        `but its value ${terminates ? 'terminates' : 'does not terminate'} in base 10.`,
    );
  });
}
