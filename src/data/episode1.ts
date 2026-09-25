import type { DialogueLineSource } from '../domain/types';

/**
 * Episode 1: "The Ghost in the Machine" — the minimal narrative pilot around
 * the 4 existing stages (see project CLAUDE.md "Corrections on record" /
 * README "Randomized content" for how those stages themselves were built).
 * Deliberately just 3 fixed beats (hook / reveal / cliffhanger) — no
 * per-stage companion commentary, no branching, no relationship score. This
 * is the smallest slice that can test the doc's core hypothesis ("do kids
 * care about saving ECHO?") before investing in the heavier Episode 2+
 * companion/season-arc infrastructure. See README "Episode 1 narrative
 * pilot" for the full writeup.
 */

export const EPISODE_1_HOOK: DialogueLineSource[] = [
  {
    speaker: 'ECHO',
    text: {
      en: "Hello? Is... is someone there? I can barely hold this signal together!",
      id: 'Halo? Ada... ada orang di sana? Sinyalnya hampir putus!',
    },
  },
  {
    speaker: 'ECHO',
    text: {
      en: "My name is ECHO. I'm an AI, trapped inside this server — and it's collapsing around me.",
      id: 'Namaku ECHO. Aku AI yang terjebak di dalam server ini — dan semuanya mulai runtuh.',
    },
  },
  {
    speaker: 'ECHO',
    text: {
      en: 'Four security layers stand between you and me. Solve them, and you can pull me out before it’s too late!',
      id: 'Ada empat lapis pengaman di antara kita. Pecahkan semuanya, dan kamu bisa menyelamatkanku sebelum terlambat!',
    },
  },
];

export const EPISODE_1_REVEAL: DialogueLineSource[] = [
  {
    speaker: 'ECHO',
    text: {
      en: "The last lock is open... I can feel the walls stop shaking. I'm free!",
      id: 'Kunci terakhir sudah terbuka... aku bisa merasakan semuanya mulai stabil. Aku bebas!',
    },
  },
  {
    speaker: 'ECHO',
    text: {
      en: 'Thank you. I mean it. But... something is still bothering me.',
      id: 'Terima kasih. Sungguh. Tapi... ada yang masih mengganggu pikiranku.',
    },
  },
  {
    speaker: 'ECHO',
    text: {
      en: 'Someone locked me in here on purpose. This was no accident. And whoever did it... is still out there.',
      id: 'Seseorang mengurungku di sini dengan sengaja. Ini bukan kecelakaan. Dan siapa pun pelakunya... masih ada di luar sana.',
    },
  },
];

export const EPISODE_1_CLIFFHANGER: DialogueLineSource[] = [
  {
    speaker: 'SHADOW',
    text: {
      en: 'A flickering shape appears at the edge of the screen — a broken crown symbol flashes once, then vanishes.',
      id: 'Sesosok bayangan berkelip di sudut layar — simbol mahkota retak menyala sekilas, lalu lenyap.',
    },
  },
  {
    speaker: 'ECHO',
    text: {
      en: "Did you see that? That symbol... I've seen it before. Right before I was trapped.",
      id: 'Kamu lihat itu tadi? Simbol itu... aku pernah melihatnya. Tepat sebelum aku terjebak.',
    },
  },
  {
    speaker: 'ECHO',
    text: {
      en: "This is bigger than just me. I don't know what we just woke up... but we need to find out.",
      id: 'Ini lebih besar dari sekadar diriku. Aku tidak tahu apa yang baru saja kita bangunkan... tapi kita harus mencari tahu.',
    },
  },
];
