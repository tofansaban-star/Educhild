import { useEffect, useRef, useState } from 'react';
import { PhaserGame, type PhaserGameHandle } from './game/PhaserGame';
import { DialogueOverlay } from './game/DialogueOverlay';
import type { DifficultyTier, Locale } from './domain/types';
import { resolveDialogue } from './domain/localize';
import { EPISODE_1_HOOK, EPISODE_1_REVEAL, EPISODE_1_CLIFFHANGER } from './data/episode1';
import './App.css';

const STAGES = [
  { key: 'AccessKeyScene', label: 'Stage 1 — Access Key' },
  { key: 'ReactorBypassScene', label: 'Stage 2 — Reactor Bypass' },
  { key: 'SecretRoomScene', label: 'Stage 3 — Secret Room Map' },
  { key: 'LeverSequenceScene', label: 'Stage 4 — Lever Sequence' },
];

const TIERS: { key: DifficultyTier; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

const LOCALES: { key: Locale; flag: string; label: string }[] = [
  { key: 'en', flag: '🇬🇧', label: 'English' },
  { key: 'id', flag: '🇮🇩', label: 'Indonesia' },
];

/** The narrative pilot's state machine — see `data/episode1.ts` and README "Episode 1 narrative pilot". */
type EpisodePhase = 'intro' | 'hook' | 'stage' | 'reveal' | 'cliffhanger' | 'end';

const EPISODE_STRINGS: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    start: string;
    continueLabel: string;
    endTitle: string;
    endBody: string;
    playAgain: string;
    devToggle: string;
    backToEpisode: string;
    devSubtitle: string;
  }
> = {
  en: {
    title: 'CipherQuest',
    subtitle: 'Episode 1 — The Ghost in the Machine',
    start: 'Start',
    continueLabel: 'Continue →',
    endTitle: 'End of Episode 1',
    endBody: 'ECHO joins you as a companion. "Neon Hoodie" unlocked.\nTo be continued in Episode 2...',
    playAgain: 'Play Again',
    devToggle: 'Dev: pick a stage manually',
    backToEpisode: '← Back to Episode 1',
    devSubtitle: 'Stage proof-of-concept (dev mode)',
  },
  id: {
    title: 'CipherQuest',
    subtitle: 'Episode 1 — Hantu di Dalam Mesin',
    start: 'Mulai',
    continueLabel: 'Lanjut →',
    endTitle: 'Akhir Episode 1',
    endBody: 'ECHO bergabung sebagai teman. "Neon Hoodie" terbuka.\nBersambung ke Episode 2...',
    playAgain: 'Main Lagi',
    devToggle: 'Dev: pilih stage manual',
    backToEpisode: '← Kembali ke Episode 1',
    devSubtitle: 'Stage proof-of-concept (mode dev)',
  },
};

function App() {
  const gameRef = useRef<PhaserGameHandle>(null);
  const [mode, setMode] = useState<'episode' | 'dev'>('episode');

  // Dev-mode state: free stage/tier/locale switching, unchanged from before the narrative pilot.
  const [activeStage, setActiveStage] = useState(STAGES[0].key);
  const [activeTier, setActiveTier] = useState<DifficultyTier>('medium');
  const [activeLocale, setActiveLocale] = useState<Locale>('en');

  // Episode-mode state.
  const [phase, setPhase] = useState<EpisodePhase>('intro');
  const [stageIndex, setStageIndex] = useState(0);
  const [awaitingContinue, setAwaitingContinue] = useState(false);

  const strings = EPISODE_STRINGS[activeLocale];

  // Whenever a narrative screen (intro/hook/continue-prompt/reveal/cliffhanger/end)
  // covers the canvas, disable Phaser input so a tap on that DOM overlay can't also
  // land on a game object underneath it — see `PhaserGameHandle.setInputEnabled`.
  const overlayShowing =
    mode === 'episode' &&
    (phase === 'intro' ||
      phase === 'hook' ||
      phase === 'reveal' ||
      phase === 'cliffhanger' ||
      phase === 'end' ||
      (phase === 'stage' && awaitingContinue));

  useEffect(() => {
    gameRef.current?.setInputEnabled(!overlayShowing);
  }, [overlayShowing]);

  const handleSelectStage = (key: string) => {
    setActiveStage(key);
    gameRef.current?.switchStage(key, { tier: activeTier, locale: activeLocale });
  };

  const handleSelectTier = (tier: DifficultyTier) => {
    setActiveTier(tier);
    gameRef.current?.switchStage(activeStage, { tier, locale: activeLocale });
  };

  const handleSelectLocale = (locale: Locale) => {
    setActiveLocale(locale);
    if (mode === 'dev') gameRef.current?.switchStage(activeStage, { tier: activeTier, locale });
  };

  const startStage = (index: number) => {
    setStageIndex(index);
    setAwaitingContinue(false);
    gameRef.current?.switchStage(STAGES[index].key, { tier: activeTier, locale: activeLocale }, () =>
      setAwaitingContinue(true),
    );
  };

  const startEpisode = () => {
    setPhase('hook');
    startStage(0);
  };

  const handleContinueStage = () => {
    if (stageIndex + 1 < STAGES.length) {
      startStage(stageIndex + 1);
    } else {
      setPhase('reveal');
    }
  };

  const handlePlayAgain = () => {
    setPhase('intro');
    setStageIndex(0);
    setAwaitingContinue(false);
  };

  const enterDevMode = () => {
    setMode('dev');
    gameRef.current?.switchStage(activeStage, { tier: activeTier, locale: activeLocale });
  };

  const exitDevMode = () => {
    setMode('episode');
    setPhase('intro');
    setStageIndex(0);
    setAwaitingContinue(false);
  };

  const hookLines = resolveDialogue(EPISODE_1_HOOK, activeLocale);
  const revealLines = resolveDialogue(EPISODE_1_REVEAL, activeLocale);
  const cliffhangerLines = resolveDialogue(EPISODE_1_CLIFFHANGER, activeLocale);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{strings.title}</h1>
        <p>{mode === 'episode' ? strings.subtitle : strings.devSubtitle}</p>
      </header>

      {mode === 'dev' && (
        <>
          <nav className="stage-switcher">
            {STAGES.map((stage) => (
              <button
                key={stage.key}
                type="button"
                className={stage.key === activeStage ? 'active' : ''}
                onClick={() => handleSelectStage(stage.key)}
              >
                {stage.label}
              </button>
            ))}
          </nav>
          <nav className="stage-switcher tier-switcher">
            {TIERS.map((tier) => (
              <button
                key={tier.key}
                type="button"
                className={tier.key === activeTier ? 'active' : ''}
                onClick={() => handleSelectTier(tier.key)}
              >
                {tier.label}
              </button>
            ))}
          </nav>
        </>
      )}

      {(mode === 'dev' || phase === 'intro') && (
        <nav className="stage-switcher locale-switcher" aria-label="Language">
          {LOCALES.map((locale) => (
            <button
              key={locale.key}
              type="button"
              className={locale.key === activeLocale ? 'active' : ''}
              onClick={() => handleSelectLocale(locale.key)}
              title={locale.label}
            >
              <span className="locale-flag" aria-hidden="true">
                {locale.flag}
              </span>
              {locale.label}
            </button>
          ))}
        </nav>
      )}

      <div className="stage-viewport">
        <PhaserGame ref={gameRef} />

        {mode === 'episode' && phase === 'intro' && (
          <div className="narrative-screen">
            <h2>{strings.subtitle}</h2>
            <div className="narrative-tier-picker">
              {TIERS.map((tier) => (
                <button
                  key={tier.key}
                  type="button"
                  className={tier.key === activeTier ? 'active' : ''}
                  onClick={() => setActiveTier(tier.key)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
            <button type="button" className="start-button" onClick={startEpisode}>
              {strings.start}
            </button>
          </div>
        )}

        {mode === 'episode' && phase === 'hook' && (
          <DialogueOverlay lines={hookLines} locale={activeLocale} onComplete={() => setPhase('stage')} />
        )}

        {mode === 'episode' && phase === 'stage' && awaitingContinue && (
          <div className="continue-overlay">
            <button type="button" className="continue-button" onClick={handleContinueStage}>
              {strings.continueLabel}
            </button>
          </div>
        )}

        {mode === 'episode' && phase === 'reveal' && (
          <DialogueOverlay lines={revealLines} locale={activeLocale} onComplete={() => setPhase('cliffhanger')} />
        )}

        {mode === 'episode' && phase === 'cliffhanger' && (
          <DialogueOverlay lines={cliffhangerLines} locale={activeLocale} onComplete={() => setPhase('end')} />
        )}

        {mode === 'episode' && phase === 'end' && (
          <div className="narrative-screen">
            <h2>{strings.endTitle}</h2>
            <p className="narrative-end-body">{strings.endBody}</p>
            <button type="button" className="start-button" onClick={handlePlayAgain}>
              {strings.playAgain}
            </button>
          </div>
        )}
      </div>

      <button type="button" className="dev-toggle" onClick={mode === 'episode' ? enterDevMode : exitDevMode}>
        {mode === 'episode' ? strings.devToggle : strings.backToEpisode}
      </button>
    </div>
  );
}

export default App;
