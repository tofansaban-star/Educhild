import { Rational } from './rational';
import type { RationalValue } from './types';

/**
 * Solves the n x n linear system `coefficients * x = constants` via Gaussian
 * elimination with exact fraction arithmetic. Returns null if the system has
 * no unique solution (singular matrix) — a content-authoring error for a
 * puzzle that's supposed to pin down every variable.
 */
export function solveLinearSystem(
  coefficients: RationalValue[][],
  constants: RationalValue[],
): Rational[] | null {
  const n = constants.length;
  const rows: Rational[][] = coefficients.map((row, i) => [
    ...row.map(Rational.fromValue),
    Rational.fromValue(constants[i]),
  ]);

  for (let pivot = 0; pivot < n; pivot++) {
    let pivotRow = pivot;
    while (pivotRow < n && rows[pivotRow][pivot].numerator === 0) pivotRow++;
    if (pivotRow === n) return null;
    [rows[pivot], rows[pivotRow]] = [rows[pivotRow], rows[pivot]];

    const pivotValue = rows[pivot][pivot];
    rows[pivot] = rows[pivot].map((cell) => cell.divide(pivotValue));

    for (let r = 0; r < n; r++) {
      if (r === pivot) continue;
      const factor = rows[r][pivot];
      if (factor.numerator === 0) continue;
      rows[r] = rows[r].map((cell, c) => cell.subtract(factor.multiply(rows[pivot][c])));
    }
  }

  return rows.map((row) => row[n]);
}
