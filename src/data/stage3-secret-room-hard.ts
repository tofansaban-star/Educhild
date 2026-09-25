import type { AreaPerimeterStageSource } from '../domain/types';

export const stage3SecretRoomHard: AreaPerimeterStageSource = {
  id: 'stage-3-secret-room-hard',
  type: 'area_perimeter',
  objective: {
    en: 'Secret room has Area = 36 units AND Perimeter = 26 units. Pick the matching dimensions.',
    id: 'Ruangan rahasia punya Luas (area) = 36 satuan DAN Keliling (perimeter) = 26 satuan. Pilih ukuran yang cocok.',
  },
  targetArea: 36,
  targetPerimeter: 26,
  dimensionOptions: [
    { id: 'opt-a', width: 9, height: 4, display: '9 × 4' },
    { id: 'opt-b', width: 6, height: 6, display: '6 × 6' },
    { id: 'opt-c', width: 12, height: 3, display: '12 × 3' },
    { id: 'opt-d', width: 5, height: 8, display: '5 × 8' },
  ],
  assets: [],
  solution: { description: '9 × 4: Area=36, Perimeter=26' },
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
