import type { AreaPerimeterStageSource } from '../domain/types';

export const stage3SecretRoomEasy: AreaPerimeterStageSource = {
  id: 'stage-3-secret-room-easy',
  type: 'area_perimeter',
  objective: {
    en: 'Secret room has Area = 12 units AND Perimeter = 14 units. Pick the matching dimensions.',
    id: 'Ruangan rahasia punya Luas (area) = 12 satuan DAN Keliling (perimeter) = 14 satuan. Pilih ukuran yang cocok.',
  },
  targetArea: 12,
  targetPerimeter: 14,
  dimensionOptions: [
    { id: 'opt-a', width: 4, height: 3, display: '4 × 3' },
    { id: 'opt-b', width: 6, height: 2, display: '6 × 2' },
    { id: 'opt-c', width: 2, height: 5, display: '2 × 5' },
    { id: 'opt-d', width: 1, height: 8, display: '1 × 8' },
  ],
  assets: [],
  solution: { description: '4 × 3: Area=12, Perimeter=14' },
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
