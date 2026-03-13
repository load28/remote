---
tags: [modal, portal, focus-management, a11y, interactive, event-listener, keyboard-navigation]
rules: [C-07, C-10, T-11, T-13, N-03, N-04, S-16, P-08]
description: Modal 다이얼로그 — dialog 시맨틱 HTML + 키보드/포커스 관리 + cleanup
---

```tsx
// shared/components/Modal.tsx
// ✅ C-07: 단일 책임 (모달 표시/닫기만 담당)
// ✅ T-11: 시맨틱 HTML — <dialog> 요소

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

  // ✅ S-16: ESC 키 처리 cleanup
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
      className="backdrop:bg-black/50 rounded-lg p-0 max-w-md w-full"
      aria-labelledby="modal-title"
    >
      <div className="p-6">
        <header className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            &times;
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
```
