import type { RationalValue } from './types';

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

/** Exact fraction arithmetic. Avoids the float-precision pitfalls of summing decimals. */
export class Rational {
  readonly numerator: number;
  readonly denominator: number;

  constructor(numerator: number, denominator: number) {
    if (denominator === 0) {
      throw new Error('Rational: denominator cannot be 0');
    }
    const sign = denominator < 0 ? -1 : 1;
    const n = sign * numerator;
    const d = sign * denominator;
    const g = gcd(n, d);
    this.numerator = n / g;
    this.denominator = d / g;
  }

  static fromValue(value: RationalValue): Rational {
    return new Rational(value.numerator, value.denominator);
  }

  static zero(): Rational {
    return new Rational(0, 1);
  }

  add(other: Rational): Rational {
    return new Rational(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  subtract(other: Rational): Rational {
    return new Rational(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  multiply(other: Rational): Rational {
    return new Rational(this.numerator * other.numerator, this.denominator * other.denominator);
  }

  divide(other: Rational): Rational {
    return new Rational(this.numerator * other.denominator, this.denominator * other.numerator);
  }

  /** Negative if this < other, 0 if equal, positive if this > other. */
  compare(other: Rational): number {
    return this.numerator * other.denominator - other.numerator * this.denominator;
  }

  equals(other: Rational): boolean {
    return this.compare(other) === 0;
  }

  toValue(): RationalValue {
    return { numerator: this.numerator, denominator: this.denominator };
  }

  toDecimal(): number {
    return this.numerator / this.denominator;
  }

  /** True if this fraction terminates in base 10 (denominator's only prime factors are 2 and 5). */
  isTerminatingDecimal(): boolean {
    let d = this.denominator;
    for (const p of [2, 5]) {
      while (d % p === 0) d /= p;
    }
    return d === 1;
  }

  /** e.g. "90%" when exact, "103.3%" when non-terminating. */
  toPercentLabel(maxDecimals = 1): string {
    const percentNumerator = this.numerator * 100;
    const { denominator } = this;
    if (percentNumerator % denominator === 0) {
      return `${percentNumerator / denominator}%`;
    }
    return `${(percentNumerator / denominator).toFixed(maxDecimals)}%`;
  }
}

export function sumRationals(values: Rational[]): Rational {
  return values.reduce((acc, v) => acc.add(v), Rational.zero());
}
