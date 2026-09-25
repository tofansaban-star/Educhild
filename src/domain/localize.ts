import type {
  AccessKeyStage,
  AccessKeyStageSource,
  AreaPerimeterStage,
  AreaPerimeterStageSource,
  DialogueLine,
  DialogueLineSource,
  FeedbackRule,
  FeedbackRuleSource,
  LeverClue,
  LeverClueSource,
  LeverItem,
  LeverItemSource,
  LeverSequenceStage,
  LeverSequenceStageSource,
  Locale,
  LocalizedText,
  ReactorStage,
  ReactorStageSource,
} from './types';

/**
 * The only place `Locale` matters. Every `resolve*Stage` function here turns
 * a bilingual `*StageSource` (what data files author) into the plain-string
 * `*Stage` shape (what Scene and the other domain-logic files consume) —
 * so nothing outside `data/content.ts` and this file ever needs to know a
 * second language exists.
 */
export function pickText(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

function resolveFeedbackRules(rules: FeedbackRuleSource[], locale: Locale): FeedbackRule[] {
  return rules.map((rule) => ({ ...rule, textResponse: pickText(rule.textResponse, locale) }));
}

export function resolveAccessKeyStage(source: AccessKeyStageSource, locale: Locale): AccessKeyStage {
  return {
    ...source,
    objective: pickText(source.objective, locale),
    feedbackRules: resolveFeedbackRules(source.feedbackRules, locale),
  };
}

export function resolveReactorStage(source: ReactorStageSource, locale: Locale): ReactorStage {
  return {
    ...source,
    objective: pickText(source.objective, locale),
    feedbackRules: resolveFeedbackRules(source.feedbackRules, locale),
  };
}

export function resolveAreaPerimeterStage(source: AreaPerimeterStageSource, locale: Locale): AreaPerimeterStage {
  return {
    ...source,
    objective: pickText(source.objective, locale),
    feedbackRules: resolveFeedbackRules(source.feedbackRules, locale),
  };
}

function resolveLeverItem(item: LeverItemSource, locale: Locale): LeverItem {
  return { ...item, label: pickText(item.label, locale) };
}

function resolveLeverClue(clue: LeverClueSource, locale: Locale): LeverClue {
  return { ...clue, text: pickText(clue.text, locale) };
}

export function resolveLeverSequenceStage(source: LeverSequenceStageSource, locale: Locale): LeverSequenceStage {
  return {
    ...source,
    objective: pickText(source.objective, locale),
    feedbackRules: resolveFeedbackRules(source.feedbackRules, locale),
    levers: source.levers.map((lever) => resolveLeverItem(lever, locale)),
    clues: source.clues.map((clue) => resolveLeverClue(clue, locale)),
  };
}

/** Resolves an Episode 1 narrative beat (`data/episode1.ts`) to one language. */
export function resolveDialogue(lines: DialogueLineSource[], locale: Locale): DialogueLine[] {
  return lines.map((line) => ({ speaker: line.speaker, text: pickText(line.text, locale) }));
}
