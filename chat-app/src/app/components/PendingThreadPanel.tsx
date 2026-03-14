// C-07: SRP — 새 스레드 생성 패널
// C-10: 파일당 1 exported 컴포넌트, T-11: 시맨틱 HTML

// ✅ T-13: named exported interface
export interface PendingThreadPanelProps {
  messageContent: string;
  authorName: string;
  isCreating: boolean;
  onReply: (content: string) => void;
  onClose: () => void;
}

export function PendingThreadPanel({
  messageContent,
  authorName,
  isCreating,
  onReply,
  onClose,
}: PendingThreadPanelProps) {
  return (
    <aside className="w-96 border-l border-gray-200 flex flex-col bg-white" aria-label="새 스레드">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm">새 스레드</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="스레드 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </header>
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">{authorName}</p>
        <p className="text-sm text-gray-800">{messageContent}</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">첫 번째 답장을 입력하여 스레드를 시작하세요.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('reply') as HTMLTextAreaElement;
          const trimmed = input.value.trim();
          if (trimmed.length === 0) return;
          onReply(trimmed);
          input.value = '';
        }}
        className="border-t border-gray-200 p-3"
      >
        <div className="flex gap-2 items-end">
          <textarea
            name="reply"
            placeholder="답장을 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="첫 답장 입력"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={isCreating}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isCreating ? '생성 중...' : '스레드 시작'}
          </button>
        </div>
      </form>
    </aside>
  );
}
