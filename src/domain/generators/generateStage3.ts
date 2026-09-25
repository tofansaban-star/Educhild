import type { AreaPerimeterStageSource, DifficultyTier, DimensionOption } from '../types';
import type { Rng } from '../rng';
import { pick, randInt, shuffle } from '../rng';

interface Dim {
  width: number;
  height: number;
}

const DIM_RANGE: Record<DifficultyTier, [number, number]> = {
  easy: [2, 8],
  medium: [3, 10],
  hard: [4, 12],
};

const sameDim = (a: Dim, b: Dim) => (a.width === b.width && a.height === b.height) || (a.width === b.height && a.height === b.width);

/** Every (w,h) factor pair of `area` with both sides in [min,max], excluding `exclude`. */
function areaFactorPairs(area: number, min: number, max: number, exclude: Dim): Dim[] {
  const out: Dim[] = [];
  for (let w = min; w <= max; w++) {
    if (area % w !== 0) continue;
    const h = area / w;
    if (h < min || h > max) continue;
    const dim = { width: w, height: h };
    if (sameDim(dim, exclude)) continue;
    out.push(dim);
  }
  return out;
}

/** Every (w,h) pair whose perimeter matches `perimeter`, both sides in [min,max], excluding `exclude`. */
function perimeterPairs(perimeter: number, min: number, max: number, exclude: Dim): Dim[] {
  const halfP = perimeter / 2;
  const out: Dim[] = [];
  for (let w = min; w <= Math.min(max, halfP - min); w++) {
    const h = halfP - w;
    if (h < min || h > max) continue;
    const dim = { width: w, height: h };
    if (sameDim(dim, exclude)) continue;
    out.push(dim);
  }
  return out;
}

function computeArea(d: Dim) {
  return d.width * d.height;
}
function computePerimeter(d: Dim) {
  return 2 * (d.width + d.height);
}

/**
 * Generates a fresh Stage 3 puzzle: one correct dimension pair plus 3
 * distractors, matching each tier's "near-miss" profile from the
 * hand-authored data (README "Tiered content"): easy gets one distractor of
 * each wrong-answer type (area-only / perimeter-only / both-wrong); medium
 * and hard get 2 area-only + 1 perimeter-only, with hard preferring the
 * closest numeric near-misses (harder to eyeball).
 */
export function generateAreaPerimeterStage(tier: DifficultyTier, rng: Rng): AreaPerimeterStageSource {
  const [min, max] = DIM_RANGE[tier];

  for (let attempt = 0; attempt < 300; attempt++) {
    const correct: Dim = { width: randInt(rng, min, max), height: randInt(rng, min, max) };
    const targetArea = computeArea(correct);
    const targetPerimeter = computePerimeter(correct);

    const searchMin = 1;
    const searchMax = max + 6;
    const areaOnlyCandidates = areaFactorPairs(targetArea, searchMin, searchMax, correct).filter(
      (d) => computePerimeter(d) !== targetPerimeter,
    );
    const perimeterOnlyCandidates = perimeterPairs(targetPerimeter, searchMin, searchMax, correct).filter(
      (d) => computeArea(d) !== targetArea,
    );

    let distractors: Dim[] | null = null;

    if (tier === 'easy') {
      if (areaOnlyCandidates.length < 1 || perimeterOnlyCandidates.length < 1) continue;
      const areaOnly = pick(rng, areaOnlyCandidates);
      const perimOnly = pick(rng, perimeterOnlyCandidates);
      const bothWrong = findNeitherPair(correct, targetArea, targetPerimeter, searchMin, searchMax, rng, [areaOnly, perimOnly]);
      if (!bothWrong) continue;
      distractors = [areaOnly, perimOnly, bothWrong];
    } else {
      if (areaOnlyCandidates.length < 2 || perimeterOnlyCandidates.length < 1) continue;
      const sortedAreaOnly =
        tier === 'hard'
          ? [...areaOnlyCandidates].sort(
              (a, b) => Math.abs(computePerimeter(a) - targetPerimeter) - Math.abs(computePerimeter(b) - targetPerimeter),
            )
          : shuffle(rng, areaOnlyCandidates);
      const sortedPerimOnly =
        tier === 'hard'
          ? [...perimeterOnlyCandidates].sort((a, b) => Math.abs(computeArea(a) - targetArea) - Math.abs(computeArea(b) - targetArea))
          : shuffle(rng, perimeterOnlyCandidates);

      const [d1, d2] = sortedAreaOnly;
      if (!d2 || sameDim(d1, d2)) continue;
      const perimOnly = sortedPerimOnly[0];
      distractors = [d1, d2, perimOnly];
    }

    if (!distractors) continue;
    const allDims = [correct, ...distractors];
    // Reject if any two options are the same rectangle (would confuse the multiple-choice grid).
    if (allDims.some((d, i) => allDims.some((other, j) => i !== j && sameDim(d, other)))) continue;

    const bothMatchCount = allDims.filter((d) => computeArea(d) === targetArea && computePerimeter(d) === targetPerimeter).length;
    if (bothMatchCount !== 1) continue;

    const optionDims = shuffle(rng, allDims);
    const dimensionOptions: DimensionOption[] = optionDims.map((d, i) => ({
      id: `opt-${String.fromCharCode(97 + i)}`,
      width: d.width,
      height: d.height,
      display: `${d.width} × ${d.height}`,
    }));

    return {
      id: `stage-3-secret-room-${tier}-${Date.now()}`,
      type: 'area_perimeter',
      objective: {
        en: `Secret room has Area = ${targetArea} units AND Perimeter = ${targetPerimeter} units. Pick the matching dimensions.`,
        id: `Ruangan rahasia punya Luas (area) = ${targetArea} satuan DAN Keliling (perimeter) = ${targetPerimeter} satuan. Pilih ukuran yang cocok.`,
      },
      targetArea,
      targetPerimeter,
      dimensionOptions,
      assets: [],
      solution: { description: `${correct.width} × ${correct.height}: Area=${targetArea}, Perimeter=${targetPerimeter}` },
      feedbackRules: [
        {
          condition: 'area_only_correct',
          visualResponse: 'floor-shake',
          audioResponse: 'sfx-error-buzz',
          textResponse: {
            en: 'Area correct ({area}), but Perimeter = {perimeter}. Too {perimeterVerdict}!',
            id: 'Luas benar ({area}), tapi Keliling = {perimeter}. Terlalu {perimeterVerdict}!',
          },
        },
        {
          condition: 'perimeter_only_correct',
          visualResponse: 'floor-shake',
          audioResponse: 'sfx-error-buzz',
          textResponse: {
            en: 'Perimeter correct ({perimeter}), but Area = {area}. Too {areaVerdict}!',
            id: 'Keliling benar ({perimeter}), tapi Luas = {area}. Terlalu {areaVerdict}!',
          },
        },
        {
          condition: 'both_incorrect',
          visualResponse: 'floor-shake',
          audioResponse: 'sfx-error-buzz',
          textResponse: {
            en: 'Both wrong: Area = {area} (too {areaVerdict}), Perimeter = {perimeter} (too {perimeterVerdict}).',
            id: 'Keduanya salah: Luas = {area} (terlalu {areaVerdict}), Keliling = {perimeter} (terlalu {perimeterVerdict}).',
          },
        },
        {
          condition: 'correct',
          visualResponse: 'floor-open',
          audioResponse: 'sfx-access-granted',
          textResponse: {
            en: 'Area = {area}, Perimeter = {perimeter}. Floor opens!',
            id: 'Luas = {area}, Keliling = {perimeter}. Lantai terbuka!',
          },
        },
      ],
    };
  }

  throw new Error(`generateAreaPerimeterStage: failed to generate a valid ${tier} puzzle after 300 attempts`);
}

/** A dimension pair matching neither the target area nor the target perimeter. */
function findNeitherPair(
  correct: Dim,
  targetArea: number,
  targetPerimeter: number,
  min: number,
  max: number,
  rng: Rng,
  avoid: Dim[],
): Dim | null {
  const candidates: Dim[] = [];
  for (let w = min; w <= max; w++) {
    for (let h = min; h <= max; h++) {
      const dim = { width: w, height: h };
      if (sameDim(dim, correct)) continue;
      if (avoid.some((a) => sameDim(a, dim))) continue;
      if (computeArea(dim) === targetArea || computePerimeter(dim) === targetPerimeter) continue;
      candidates.push(dim);
    }
  }
  return candidates.length > 0 ? pick(rng, candidates) : null;
}
