// 레퍼런스: modal--portal--focus-management--a11y.md
// C-07: SRP, T-11: 시맨틱 HTML — <dialog>, S-16: cleanup

import { useEffect, useRef, type ReactNode } from 'react';

// ✅ T-13: named exported interface
export interface ModalProps {
  isOpen: boolean;                // N-04: Boolean is 접두사
  onClose: () => void;           // N-03: on 접두사
  title: string;
  children: ReactNode;           // C-08: children 합성
}

// ✅ C-10: 파일당 1 exported 컴포넌트
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ✅ S-16: useEffect cleanup
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // ✅ S-16: ESC 키 cancel 이벤트 cleanup
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // ✅ N-03: 내부 핸들러 handle 접두사
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/50 rounded-lg p-0 max-w-md w-full shadow-xl"
      aria-labelledby="modal-title"
    >
      <div className="p-6">
        <header className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="닫기"
          >
            &times;
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
