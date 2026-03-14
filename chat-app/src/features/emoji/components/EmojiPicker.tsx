// 레퍼런스: emoji-picker--interactive--state.md
// C-07: SRP (이모지 선택만 담당), T-11: 시맨틱 HTML

import { useState } from 'react';
import type { EmojiCategory, CustomEmoji } from '../types';

// ✅ P-03: 모듈 레벨 상수
const DEFAULT_CATEGORY_INDEX = 0;

// ✅ T-13: named exported interface
export interface EmojiPickerProps {
  categories: EmojiCategory[];
  customEmojis: CustomEmoji[];
  onSelectEmoji: (emoji: string) => void;       // N-03: on 접두사
  onSelectCustomEmoji: (emoji: CustomEmoji) => void; // N-03
  onOpenCustomEmojiManager: () => void;          // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function EmojiPicker({
  categories,
  customEmojis,
  onSelectEmoji,
  onSelectCustomEmoji,
  onOpenCustomEmojiManager,
}: EmojiPickerProps) {
  // ✅ S-09: 로컬 UI 상태
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(DEFAULT_CATEGORY_INDEX);

  const hasCustomEmojis = customEmojis.length > 0; // N-04
  const isCustomTab = selectedCategoryIndex === categories.length; // N-04
  const currentCategory = isCustomTab ? null : categories[selectedCategoryIndex];

  return (
    // ✅ T-11: 시맨틱 HTML
    <section
      aria-label="이모지 선택"
      className="absolute bottom-full mb-2 left-0 border border-gray-200 rounded-lg shadow-lg bg-white w-80 z-10"
    >
      {/* 카테고리 탭 */}
      <nav className="flex border-b border-gray-200 overflow-x-auto" role="tablist" aria-label="이모지 카테고리">
        {categories.map((cat, idx) => (
          <button
            key={cat.name}
            type="button"
            role="tab"
            aria-selected={idx === selectedCategoryIndex}
            onClick={() => setSelectedCategoryIndex(idx)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              idx === selectedCategoryIndex
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={isCustomTab}
          onClick={() => setSelectedCategoryIndex(categories.length)}
          className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
            isCustomTab
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          커스텀
        </button>
      </nav>

      {/* 이모지 그리드 */}
      <div role="tabpanel" className="p-2 max-h-48 overflow-y-auto">
        {isCustomTab ? (
          <div>
            {hasCustomEmojis ? (
              <div className="grid grid-cols-8 gap-1">
                {customEmojis.map((emoji) => (
                  <button
                    key={emoji.id}
                    type="button"
                    onClick={() => onSelectCustomEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                    aria-label={`커스텀 이모지 :${emoji.name}:`}
                    title={`:${emoji.name}:`}
                  >
                    <img src={emoji.imageUrl} alt={emoji.name} className="w-6 h-6 object-contain" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">등록된 커스텀 이모지가 없습니다</p>
            )}
            <button
              type="button"
              onClick={onOpenCustomEmojiManager}
              className="w-full mt-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              커스텀 이모지 관리
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {currentCategory?.emojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
                aria-label={`이모지 ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
