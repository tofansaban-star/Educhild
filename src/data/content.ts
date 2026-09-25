import type {
  AccessKeyStage,
  AreaPerimeterStage,
  DifficultyTier,
  LeverSequenceStage,
  Locale,
  ReactorStage,
} from '../domain/types';
import {
  resolveAccessKeyStage,
  resolveAreaPerimeterStage,
  resolveLeverSequenceStage,
  resolveReactorStage,
} from '../domain/localize';
import { createRng } from '../domain/rng';
import { generateAccessKeyStage } from '../domain/generators/generateStage1';
import { generateReactorStage } from '../domain/generators/generateStage2';
import { generateAreaPerimeterStage } from '../domain/generators/generateStage3';
import { generateLeverSequenceStage } from '../domain/generators/generateStage4';

/**
 * Single seam between Scene code and stage content. Each call generates a
 * fresh, solvability-validated puzzle for the given tier (full per-playthrough
 * randomization, "Opsi A") and resolves it to one of 2 languages — Scene code
 * never needs to change because it only depends on the
 * `AccessKeyStage`/`ReactorStage`/etc. shape (plain strings, one language
 * already picked), never on how that content was produced or on `Locale` at
 * all. See `domain/generators/` for the per-stage generation + validation
 * logic (constraints lifted from the previous hand-authored tiers, see
 * README "Tiered content"), and `domain/localize.ts` for the bilingual ->
 * plain-string resolution step.
 */

export function getStage1Content(tier: DifficultyTier, locale: Locale): AccessKeyStage {
  return resolveAccessKeyStage(generateAccessKeyStage(tier, createRng()), locale);
}

export function getStage2Content(tier: DifficultyTier, locale: Locale): ReactorStage {
  return resolveReactorStage(generateReactorStage(tier, createRng()), locale);
}

export function getStage3Content(tier: DifficultyTier, locale: Locale): AreaPerimeterStage {
  return resolveAreaPerimeterStage(generateAreaPerimeterStage(tier, createRng()), locale);
}

export function getStage4Content(tier: DifficultyTier, locale: Locale): LeverSequenceStage {
  return resolveLeverSequenceStage(generateLeverSequenceStage(tier, createRng()), locale);
}
