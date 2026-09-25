import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';

export interface PhaserGameHandle {
  /**
   * `onStageComplete`, if given, fires once when the started scene emits
   * `cipherquest:stage-complete` (every Scene does this the moment its
   * puzzle is solved correctly) — this is how the Episode flow in App.tsx
   * knows to show a "Continue" prompt without any Scene knowing narrative
   * exists.
   */
  switchStage: (sceneKey: string, data?: Record<string, unknown>, onStageComplete?: () => void) => void;
  /**
   * Phaser's InputManager also listens on `window` (so a drag released outside the
   * canvas still registers) — that listener hit-tests purely by screen position, so a
   * tap on a DOM overlay stacked on top of the canvas (dialogue box, intro/end screen,
   * "Continue" button) would *also* land on whatever game object sits underneath it,
   * even though the tap's actual DOM target was the overlay. `stopPropagation` in the
   * overlay's own handler doesn't stop this — Phaser's window listener runs in the
   * capture phase, ahead of it. Disabling every active scene's input for as long as an
   * overlay covers the canvas is the reliable fix.
   */
  setInputEnabled: (enabled: boolean) => void;
}

export const PhaserGame = forwardRef<PhaserGameHandle>(function PhaserGame(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game(createGameConfig(containerRef.current));
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    switchStage: (sceneKey: string, data?: Record<string, unknown>, onStageComplete?: () => void) => {
      const game = gameRef.current;
      if (!game) return;
      game.scene.getScenes(false).forEach((scene) => game.scene.stop(scene.scene.key));
      if (onStageComplete) {
        game.scene.getScene(sceneKey)?.events.once('cipherquest:stage-complete', onStageComplete);
      }
      game.scene.start(sceneKey, data);
    },
    setInputEnabled: (enabled: boolean) => {
      const game = gameRef.current;
      if (!game) return;
      // `getScenes(false)` — not `(true)` — deliberately: a scene just started via
      // `switchStage` isn't marked "active" (`getScenes(true)`) until Phaser's next game
      // step, but its Systems (incl. `.input`) already exist from game boot, so setting
      // `.input.enabled` here still lands correctly ahead of that scene's first frame.
      game.scene.getScenes(false).forEach((scene) => {
        scene.input.enabled = enabled;
      });
    },
  }));

  return <div ref={containerRef} className="phaser-container" />;
});
