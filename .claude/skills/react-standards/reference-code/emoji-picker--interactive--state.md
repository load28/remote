---
tags: [interactive, component, state, event-naming, a11y, keyboard-navigation]
rules: [C-07, C-10, T-11, T-13, N-03, N-04, S-09, P-03]
description: Emoji Picker — 카테고리 기반 이모지 선택 + 키보드 접근성
---

```tsx
// {Feature}/components/EmojiPicker.tsx
// ✅ C-07: 단일 책임 (이모지 선택만 담당)

import { useState } from 'react';

// ✅ T-13: named exported interface
export interface EmojiCategory {
  name: string;
  emojis: string[];
}

export interface EmojiPickerProps {
  categories: EmojiCategory[];
  onSelectEmoji: (emoji: string) => void;  // N-03: on 접두사
}

// ✅ P-03: 모듈 레벨 상수
const DEFAULT_CATEGORY_INDEX = 0;

// ✅ C-10: 파일당 1 exported 컴포넌트
export function EmojiPicker({ categories, onSelectEmoji }: EmojiPickerProps) {
  // ✅ S-09: 로컬 UI 상태
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(DEFAULT_CATEGORY_INDEX);

  const currentCategory = categories[selectedCategoryIndex];

  // ✅ N-03: handle 접두사
  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
  };

  return (
    // ✅ T-11: 시맨틱 HTML
    <section aria-label="이모지 선택" className="border rounded-lg shadow-lg bg-white">
      {/* 카테고리 탭 */}
      <nav className="flex border-b" role="tablist" aria-label="이모지 카테고리">
        {categories.map((cat, idx) => (
          <button
            key={cat.name}
            type="button"
            role="tab"
            aria-selected={idx === selectedCategoryIndex}
            onClick={() => setSelectedCategoryIndex(idx)}
            className="px-3 py-2 text-sm"
          >
            {cat.name}
          </button>
        ))}
      </nav>
      {/* 이모지 그리드 */}
      <div
        role="tabpanel"
        className="grid grid-cols-8 gap-1 p-2 max-h-48 overflow-y-auto"
      >
        {currentCategory?.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg"
            aria-label={`이모지 ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </section>
  );
}
```
