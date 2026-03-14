// 레퍼런스: controlled--uncontrolled--discriminated-union.md, interactive--event-naming--a11y.md
// S-13: controlled 택일, N-03: on/handle, T-11: 시맨틱 HTML

import { useRef, useEffect, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';

// ✅ T-13: named exported interface
export interface MessageInputProps {
  content: string;                                  // S-13: controlled
  onChangeContent: (content: string) => void;       // S-13: controlled
  onSendMessage: (content: string) => void;         // N-03: on 접두사
  isSending: boolean;                               // N-04: is 접두사
  isEmojiPickerOpen: boolean;                       // N-04
  onToggleEmojiPicker: () => void;                  // N-03
  emojiPicker?: ReactNode;                          // C-08: 합성
}

// ✅ S-13: controlled 컴포넌트 (value + onChange)
// ✅ C-10: 파일당 1 exported 컴포넌트
export function MessageInput({
  content,
  onChangeContent,
  onSendMessage,
  isSending,
  isEmojiPickerOpen,
  onToggleEmojiPicker,
  emojiPicker,
}: MessageInputProps) {
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // ✅ S-16: 외부 클릭 시 이모지 피커 닫기 cleanup
  useEffect(() => {
    if (!isEmojiPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target)
      ) {
        onToggleEmojiPicker();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen, onToggleEmojiPicker]);

  // ✅ N-03: 내부 핸들러 handle 접두사
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    onSendMessage(trimmed);
    onChangeContent('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = content.trim();
      if (trimmed.length === 0) return;
      onSendMessage(trimmed);
      onChangeContent('');
    }
  };

  const hasContent = content.trim().length > 0; // N-04: has 접두사

  return (
    // ✅ T-11: 시맨틱 HTML — form 요소
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          <textarea
            value={content}
            onChange={(e) => onChangeContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="메시지 입력"
            disabled={isSending}
          />
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={onToggleEmojiPicker}
            className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="이모지 선택"
            title="이모지"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
            </svg>
          </button>
          {isEmojiPickerOpen ? (
            <div ref={emojiPickerRef}>
              {emojiPicker}
            </div>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!hasContent || isSending}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? '전송 중...' : '전송'}
        </button>
      </div>
    </form>
  );
}
