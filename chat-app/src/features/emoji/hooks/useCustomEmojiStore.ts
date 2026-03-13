// 레퍼런스: custom-emoji--form--mutation--zustand.md
// S-08: 클라이언트 상태 Zustand, S-01: set()으로 새 참조, S-15: localStorage 스키마 버전

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomEmoji } from '../types';

// ✅ P-03: 모듈 레벨 상수
const CUSTOM_EMOJI_STORAGE_KEY = 'custom-emojis';
const CUSTOM_EMOJI_STORAGE_VERSION = 1;

// ✅ T-13: named exported interface
export interface CustomEmojiStoreState {
  customEmojis: CustomEmoji[];
}

export interface CustomEmojiStoreActions {
  addCustomEmoji: (emoji: CustomEmoji) => void;
  removeCustomEmoji: (id: string) => void;
}

// ✅ S-08: 클라이언트 상태 Zustand
// ✅ S-01: state 직접 변경 금지 → set()으로 새 참조
// ✅ S-09: Feature 디렉토리 내 배치
export const useCustomEmojiStore = create<CustomEmojiStoreState & CustomEmojiStoreActions>()(
  persist(
    (set) => ({
      customEmojis: [],
      addCustomEmoji: (emoji) =>
        set((prev) => ({ customEmojis: [...prev.customEmojis, emoji] })),
      removeCustomEmoji: (id) =>
        set((prev) => ({
          customEmojis: prev.customEmojis.filter((e) => e.id !== id),
        })),
    }),
    {
      name: `${CUSTOM_EMOJI_STORAGE_KEY}_v${CUSTOM_EMOJI_STORAGE_VERSION}`,
      partialize: (state) => ({ customEmojis: state.customEmojis }),
    },
  ),
);
