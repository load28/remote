// 레퍼런스: controlled--uncontrolled--discriminated-union.md, interactive--event-naming--a11y.md
// S-13: controlled 택일, N-03: on/handle, T-11: 시맨틱 HTML

import { useState, type FormEvent, type KeyboardEvent } from 'react';

// ✅ T-13: named exported interface
export interface MessageInputProps {
  onSendMessage: (content: string) => void; // N-03: on 접두사
  isSending: boolean; // N-04: is 접두사
}

// ✅ S-13: controlled 컴포넌트 (value + onChange)
export function MessageInput({ onSendMessage, isSending }: MessageInputProps) {
  // ✅ S-09: 로컬 UI 상태 → 사용처 가까이 useState
  const [content, setContent] = useState('');

  // ✅ N-03: 내부 핸들러 handle 접두사
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    onSendMessage(trimmed);
    setContent('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = content.trim();
      if (trimmed.length === 0) return;
      onSendMessage(trimmed);
      setContent('');
    }
  };

  const hasContent = content.trim().length > 0; // N-04: has 접두사

  return (
    // ✅ T-11: 시맨틱 HTML — form 요소
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      <div className="flex gap-2 items-end">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="메시지 입력"
          disabled={isSending}
        />
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
