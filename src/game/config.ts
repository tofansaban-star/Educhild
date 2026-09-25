import Phaser from 'phaser';
import { AccessKeyScene } from './scenes/AccessKeyScene';
import { ReactorBypassScene } from './scenes/ReactorBypassScene';
import { SecretRoomScene } from './scenes/SecretRoomScene';
import { LeverSequenceScene } from './scenes/LeverSequenceScene';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0f1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 3, // basic multi-touch headroom on mobile
    },
    // Only the first scene auto-starts; the switcher in App.tsx starts the rest on demand.
    scene: [AccessKeyScene, ReactorBypassScene, SecretRoomScene, LeverSequenceScene],
  };
}
