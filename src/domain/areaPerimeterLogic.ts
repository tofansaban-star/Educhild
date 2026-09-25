import type { AreaPerimeterEvaluation, AreaPerimeterStage, DimensionOption, Locale } from './types';

export function computeArea(option: DimensionOption): number {
  return option.width * option.height;
}

export function computePerimeter(option: DimensionOption): number {
  return 2 * (option.width + option.height);
}

const AREA_VERDICT_WORDS: Record<Locale, { big: string; small: string }> = {
  en: { big: 'big', small: 'small' },
  id: { big: 'besar', small: 'kecil' },
};

const PERIMETER_VERDICT_WORDS: Record<Locale, { long: string; short: string }> = {
  en: { long: 'long', short: 'short' },
  id: { long: 'panjang', short: 'pendek' },
};

/**
 * Judges a chosen dimension option against both targets at once — the whole
 * point of the stage is that area alone (or perimeter alone) matching isn't
 * enough. Messages support `{area}`, `{perimeter}`, `{areaVerdict}` and
 * `{perimeterVerdict}` placeholders. Unlike the other stages' evaluate
 * functions, this one needs `locale`: the verdict words are *derived* at
 * evaluation time (not authored in `data/`), so they can't be resolved
 * upfront by `domain/localize.ts` — they have to be picked here, in
 * whichever language the already-resolved `stage.feedbackRules` text is in.
 */
export function evaluateDimensionChoice(
  stage: AreaPerimeterStage,
  optionId: string,
  locale: Locale,
): AreaPerimeterEvaluation {
  const option = stage.dimensionOptions.find((o) => o.id === optionId);
  if (!option) {
    throw new Error(`[AreaPerimeterStage:${stage.id}] unknown option "${optionId}"`);
  }

  const computedArea = computeArea(option);
  const computedPerimeter = computePerimeter(option);
  const areaMatches = computedArea === stage.targetArea;
  const perimeterMatches = computedPerimeter === stage.targetPerimeter;

  const condition =
    areaMatches && perimeterMatches
      ? 'correct'
      : areaMatches
        ? 'area_only_correct'
        : perimeterMatches
          ? 'perimeter_only_correct'
          : 'both_incorrect';

  const areaVerdict = AREA_VERDICT_WORDS[locale][computedArea > stage.targetArea ? 'big' : 'small'];
  const perimeterVerdict =
    PERIMETER_VERDICT_WORDS[locale][computedPerimeter > stage.targetPerimeter ? 'long' : 'short'];

  const rule = stage.feedbackRules.find((r) => r.condition === condition);
  const message = (rule?.textResponse ?? '')
    .replace('{area}', String(computedArea))
    .replace('{perimeter}', String(computedPerimeter))
    .replace('{areaVerdict}', areaVerdict)
    .replace('{perimeterVerdict}', perimeterVerdict);

  return { condition, selectedOptionId: optionId, computedArea, computedPerimeter, message };
}

/**
 * Dev-time content check: catches content-authoring mistakes where a tier's
 * options don't have exactly one that satisfies both targets — the same
 * anti-drift principle as `reactorLogic.ts`'s `validateReactorContent`.
 */
export function validateAreaPerimeterContent(stage: AreaPerimeterStage): void {
  if (!import.meta.env.DEV) return;
  const correctCount = stage.dimensionOptions.filter(
    (o) => computeArea(o) === stage.targetArea && computePerimeter(o) === stage.targetPerimeter,
  ).length;
  console.assert(
    correctCount === 1,
    `[AreaPerimeterStage:${stage.id}] expected exactly 1 option matching both targets, found ${correctCount}.`,
  );
}
