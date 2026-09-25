/**
 * Seedable PRNG (mulberry32) plus small array helpers, used by `domain/generators/`
 * so puzzle generation is reproducible when a seed is supplied (tests, debugging a
 * bad roll) but effectively random per playthrough when it isn't.
 */
export type Rng = () => number; // returns a float in [0, 1)

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fresh randomness per call when no seed is given. */
export function createRng(seed?: number): Rng {
  return mulberry32(seed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff)));
}

/** Inclusive on both ends. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Fisher-Yates; does not mutate the input. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `n` distinct elements (by array position), order randomized. */
export function sample<T>(rng: Rng, items: readonly T[], n: number): T[] {
  return shuffle(rng, items).slice(0, n);
}
