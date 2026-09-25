import type { AreaPerimeterStageSource } from '../domain/types';

export const stage3SecretRoomMedium: AreaPerimeterStageSource = {
  id: 'stage-3-secret-room-medium',
  type: 'area_perimeter',
  objective: {
    en: 'Secret room has Area = 24 units AND Perimeter = 20 units. Pick the matching dimensions.',
    id: 'Ruangan rahasia punya Luas (area) = 24 satuan DAN Keliling (perimeter) = 20 satuan. Pilih ukuran yang cocok.',
  },
  targetArea: 24,
  targetPerimeter: 20,
  dimensionOptions: [
    { id: 'opt-a', width: 8, height: 3, display: '8 × 3' },
    { id: 'opt-b', width: 6, height: 4, display: '6 × 4' },
    { id: 'opt-c', width: 12, height: 2, display: '12 × 2' },
    { id: 'opt-d', width: 5, height: 5, display: '5 × 5' },
  ],
  assets: [],
  solution: { description: '6 × 4: Area=24, Perimeter=20' },
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
