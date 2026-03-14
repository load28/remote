// 레퍼런스: custom-emoji--form--mutation--zustand.md, modal--portal--focus-management--a11y.md
// C-07: SRP, S-13: controlled, T-11: 시맨틱 HTML

import { useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/Modal';
import type { CustomEmoji, CreateCustomEmojiInput } from '../types';

// ✅ T-13: named exported interface
export interface CustomEmojiManagerProps {
  isOpen: boolean;                                            // N-04
  customEmojis: CustomEmoji[];
  isCreating: boolean;                                        // N-04
  onClose: () => void;                                        // N-03
  onCreateEmoji: (input: CreateCustomEmojiInput) => void;     // N-03
  onDeleteEmoji: (id: string) => void;                        // N-03
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function CustomEmojiManager({
  isOpen,
  customEmojis,
  isCreating,
  onClose,
  onCreateEmoji,
  onDeleteEmoji,
}: CustomEmojiManagerProps) {
  // ✅ S-09: 로컬 UI 상태
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // ✅ N-03: handle 접두사
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUrl = imageUrl.trim();
    if (trimmedName.length === 0 || trimmedUrl.length === 0) return;
    onCreateEmoji({ name: trimmedName, imageUrl: trimmedUrl });
    setName('');
    setImageUrl('');
  };

  // ✅ N-04: has 접두사
  const hasValidInput = name.trim().length > 0 && imageUrl.trim().length > 0;
  const hasCustomEmojis = customEmojis.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="커스텀 이모지 관리">
      <div className="space-y-4">
        {/* 등록 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="custom-emoji-name" className="block text-sm font-medium text-gray-700 mb-1">
              이모지 이름
            </label>
            <input
              id="custom-emoji-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my_emoji"
              disabled={isCreating}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="custom-emoji-url" className="block text-sm font-medium text-gray-700 mb-1">
              이미지 URL
            </label>
            <input
              id="custom-emoji-url"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/emoji.png"
              disabled={isCreating}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          {/* 이미지 미리보기 */}
          {imageUrl.trim().length > 0 ? (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <img
                src={imageUrl}
                alt="미리보기"
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-xs text-gray-500">:{name || '이름'}:</span>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={!hasValidInput || isCreating}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? '등록 중...' : '이모지 등록'}
          </button>
        </form>

        {/* 등록된 커스텀 이모지 목록 */}
        {hasCustomEmojis ? (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">등록된 이모지</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {customEmojis.map((emoji) => (
                <li key={emoji.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={emoji.imageUrl} alt={emoji.name} className="w-6 h-6 object-contain" />
                    <span className="text-sm text-gray-700">:{emoji.name}:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteEmoji(emoji.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    aria-label={`${emoji.name} 이모지 삭제`}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">등록된 커스텀 이모지가 없습니다</p>
        )}
      </div>
    </Modal>
  );
}
