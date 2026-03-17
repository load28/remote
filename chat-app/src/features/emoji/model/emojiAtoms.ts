// S-08: 클라이언트 상태 Jotai atom으로 관리
// S-01: set()으로 새 참조 생성, 직접 변경 금지
// S-15: localStorage 스키마 버전 관리

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { CustomEmoji } from '../types';

// P-03: 모듈 레벨 상수
const CUSTOM_EMOJI_STORAGE_KEY = 'custom-emojis';
const CUSTOM_EMOJI_STORAGE_VERSION = 2;

// N-09: ___Atom 접미사
export const customEmojisAtom = atomWithStorage<CustomEmoji[]>(
  `${CUSTOM_EMOJI_STORAGE_KEY}_v${CUSTOM_EMOJI_STORAGE_VERSION}`,
  [],
);

// writable atom — write-only 액션
// S-01: spread로 새 배열 생성
export const addCustomEmojiAtom = atom(
  null,
  (get, set, emoji: CustomEmoji) => {
    set(customEmojisAtom, [...get(customEmojisAtom), emoji]);
  },
);

export const removeCustomEmojiAtom = atom(
  null,
  (get, set, id: string) => {
    set(customEmojisAtom, get(customEmojisAtom).filter((e) => e.id !== id));
  },
);
