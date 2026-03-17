// A-07: barrel file — FSD: entities에서 re-export + feature 전용 export
// P-06: named export만

// entities/emoji에서 re-export (도메인 모델)
export { useCustomEmojis, useCreateCustomEmoji, useDeleteCustomEmoji, CUSTOM_EMOJI_QUERY_KEY, EMOJI_CATEGORIES } from '@/entities/emoji';
export type { CustomEmoji, CreateCustomEmojiInput, EmojiCategory } from '@/entities/emoji';

// feature 전용 (사용자 인터랙션 UI)
export { EmojiPicker } from './components/EmojiPicker';
export { CustomEmojiManager } from './components/CustomEmojiManager';
export { customEmojisAtom, addCustomEmojiAtom, removeCustomEmojiAtom } from './model/emojiAtoms';
