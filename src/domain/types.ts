export type StageType =
  | 'visual_algebra'
  | 'fractions_percent'
  | 'area_perimeter'
  | 'deductive_logic';

/** Hand-authored content variants per stage; see `data/content.ts`. */
export type DifficultyTier = 'easy' | 'medium' | 'hard';

/** Player-selectable UI/content language; see `data/content.ts` and `domain/localize.ts`. */
export type Locale = 'en' | 'id';

/** A player-facing string authored in both supported languages. */
export type LocalizedText = Record<Locale, string>;

/** ECHO (freed companion) or the still-unidentified antagonist teased in Episode 1's cliffhanger. */
export type NarrativeSpeaker = 'ECHO' | 'SHADOW';

/** Authoring-time shape for a narrative dialogue line; see `data/episode1.ts`. */
export interface DialogueLineSource {
  speaker: NarrativeSpeaker;
  text: LocalizedText;
}

/** Plain-string dialogue line, resolved via `domain/localize.ts`'s `resolveDialogue`. */
export interface DialogueLine {
  speaker: NarrativeSpeaker;
  text: string;
}

export type FeedbackCondition =
  | 'overload'
  | 'underload'
  | 'concept_error'
  | 'correct'
  | 'incorrect'
  | 'area_only_correct'
  | 'perimeter_only_correct'
  | 'both_incorrect';

export interface FeedbackRule {
  condition: FeedbackCondition;
  visualResponse: string;
  audioResponse: string;
  /** May contain a `{percent}` placeholder, interpolated at evaluation time. */
  textResponse: string;
}

/** Authoring-time shape: same as `FeedbackRule`, but `textResponse` isn't resolved to one language yet. */
export interface FeedbackRuleSource {
  condition: FeedbackCondition;
  visualResponse: string;
  audioResponse: string;
  textResponse: LocalizedText;
}

export interface Asset {
  id: string;
  kind: 'image' | 'audio' | 'spritesheet';
  path: string;
}

export interface Solution {
  description: string;
}

export interface Stage {
  id: string;
  type: StageType;
  objective: string;
  assets: Asset[];
  solution: Solution;
  feedbackRules: FeedbackRule[];
}

/**
 * Authoring-time shape data files use: same fields as `Stage`, but every
 * player-facing string is a `LocalizedText` instead of a plain string.
 * `domain/localize.ts` resolves one of these (plus the stage-specific extra
 * fields on e.g. `AccessKeyStageSource`) down to the plain-string shape
 * (`AccessKeyStage`) that Scene/domain-logic code actually consumes — those
 * files never need to know `Locale` exists.
 */
export interface StageSource {
  id: string;
  type: StageType;
  objective: LocalizedText;
  assets: Asset[];
  solution: Solution;
  feedbackRules: FeedbackRuleSource[];
}

export interface Reward {
  id: string;
  kind: 'badge' | 'cosmetic' | 'message';
  label: string;
}

export interface Level {
  id: string;
  title: string;
  theme: 'cyber' | 'space' | 'underwater' | 'jungle';
  duration: number;
  stages: Stage[];
  rewards: Reward[];
}

/**
 * Exact rational value (numerator/denominator). Replaces the design doc's
 * `actualValue: number` — floats can misclassify a sum that is exactly on
 * target (e.g. 90%) as off by an epsilon. All Stage 2 math is done on this
 * type; a decimal/percent is only computed for display.
 */
export interface RationalValue {
  numerator: number;
  denominator: number;
}

export interface PowerCell {
  id: string;
  display: string; // "1/2", "20%", "1/3"
  value: RationalValue;
  isDistractor: boolean;
  distractorReason?: string;
}

export interface ReactorStage extends Stage {
  type: 'fractions_percent';
  targetPercentage: RationalValue; // e.g. 90 -> { numerator: 90, denominator: 100 }
  availableCells: PowerCell[];
  requiredCellCount: number;
}

export interface ReactorStageSource extends StageSource {
  type: 'fractions_percent';
  targetPercentage: RationalValue;
  availableCells: PowerCell[]; // display ("1/2") and distractorReason aren't player-facing language, no localization needed
  requiredCellCount: number;
}

export interface ReactorEvaluation {
  condition: FeedbackCondition;
  sum: RationalValue;
  sumPercentDisplay: string; // e.g. "90%" or "103.3%"
  selectedCellIds: string[];
  message: string;
}

// --- Stage 1 specific ---
export interface AlgebraIcon {
  id: string;
  emoji: string;
  label: string;
}

export interface AlgebraEquation {
  id: string;
  /** Coefficient per icon id, LHS - RHS moved to one side; omitted icons default to 0. */
  coefficients: Record<string, number>;
  constant: RationalValue;
  /** Human-readable form for rendering, e.g. "⚙️ + ⚙️ = 12". */
  display: string;
}

export interface AccessKeyStage extends Stage {
  type: 'visual_algebra';
  icons: AlgebraIcon[];
  equations: AlgebraEquation[];
  queryCoefficients: Record<string, number>;
  queryDisplay: string; // e.g. "💾 + ⚙️"
}

export interface AccessKeyStageSource extends StageSource {
  type: 'visual_algebra';
  icons: AlgebraIcon[]; // label is unused by AccessKeyScene, not worth localizing
  equations: AlgebraEquation[]; // display is emoji/numbers, language-neutral
  queryCoefficients: Record<string, number>;
  queryDisplay: string;
}

export interface AlgebraEvaluation {
  condition: FeedbackCondition;
  expectedAnswer: number;
  message: string;
}

// --- Stage 3 specific ---
export interface DimensionOption {
  id: string;
  width: number;
  height: number;
  display: string; // "6 × 4"
}

export interface AreaPerimeterStage extends Stage {
  type: 'area_perimeter';
  targetArea: number;
  targetPerimeter: number;
  dimensionOptions: DimensionOption[];
}

export interface AreaPerimeterStageSource extends StageSource {
  type: 'area_perimeter';
  targetArea: number;
  targetPerimeter: number;
  dimensionOptions: DimensionOption[]; // display ("6 × 4") is language-neutral
}

export interface AreaPerimeterEvaluation {
  condition: FeedbackCondition;
  selectedOptionId: string;
  computedArea: number;
  computedPerimeter: number;
  message: string;
}

// --- Stage 4 specific ---
export interface LeverItem {
  id: string;
  label: string;
  color: number; // 0xe74c3c
}

export interface LeverItemSource {
  id: string;
  label: LocalizedText;
  color: number;
}

/** All positions are 1-based. */
export type LeverClue =
  | { kind: 'before'; subject: string; object: string; text: string }
  | { kind: 'not_position'; subject: string; position: number; text: string }
  /** "exactly `gap` levers physically sit between a and b", i.e. |pos(a) - pos(b)| === gap + 1. */
  | { kind: 'gap'; a: string; b: string; gap: number; text: string };

export type LeverClueSource =
  | { kind: 'before'; subject: string; object: string; text: LocalizedText }
  | { kind: 'not_position'; subject: string; position: number; text: LocalizedText }
  | { kind: 'gap'; a: string; b: string; gap: number; text: LocalizedText };

export interface LeverSequenceStage extends Stage {
  type: 'deductive_logic';
  levers: LeverItem[];
  clues: LeverClue[];
}

export interface LeverSequenceStageSource extends StageSource {
  type: 'deductive_logic';
  levers: LeverItemSource[];
  clues: LeverClueSource[];
}

export interface LeverEvaluation {
  condition: FeedbackCondition;
  violatedClues: LeverClue[];
  message: string;
}
