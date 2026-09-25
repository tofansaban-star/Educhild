import { Rational } from './rational';
import { solveLinearSystem } from './linearSystem';
import type { AccessKeyStage, AlgebraEvaluation } from './types';

/**
 * Solves for each icon's value from the stage's equations. The expected
 * answer to the final query is derived from this, never hardcoded — so a
 * content author editing the equations can't leave a stale answer behind.
 */
export function solveIconValues(stage: AccessKeyStage): Record<string, Rational> | null {
  const iconIds = stage.icons.map((icon) => icon.id);
  const coefficientMatrix = stage.equations.map((equation) =>
    iconIds.map((id) => ({ numerator: equation.coefficients[id] ?? 0, denominator: 1 })),
  );
  const constants = stage.equations.map((equation) => equation.constant);

  const solution = solveLinearSystem(coefficientMatrix, constants);
  if (!solution) return null;

  return Object.fromEntries(iconIds.map((id, index) => [id, solution[index]]));
}

export function evaluateAccessKeyAnswer(stage: AccessKeyStage, playerAnswer: number): AlgebraEvaluation {
  const values = solveIconValues(stage);
  if (!values) {
    throw new Error(`[AccessKeyStage:${stage.id}] equations do not have a unique solution`);
  }

  const expected = Object.entries(stage.queryCoefficients).reduce(
    (sum, [iconId, coefficient]) => sum.add(values[iconId].multiply(new Rational(coefficient, 1))),
    Rational.zero(),
  );

  const expectedAnswer = expected.toDecimal();
  const condition = playerAnswer === expectedAnswer ? 'correct' : 'incorrect';
  const rule = stage.feedbackRules.find((r) => r.condition === condition);

  return { condition, expectedAnswer, message: rule?.textResponse ?? '' };
}
