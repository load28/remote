/**
 * Modal - 모달 다이얼로그 컴포넌트
 */

import { Component, ComponentProps } from '../core/Component';
import { classNames, escapeHtml } from '../utils/dom';
import { Button } from './Button';

export interface ModalProps extends ComponentProps {
  title?: string;
  content?: string;
  isOpen?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

interface ModalState {
  isOpen: boolean;
  isClosing: boolean;
}

export class Modal extends Component<ModalProps, ModalState> {
  private confirmButton: Button | null = null;
  private cancelButton: Button | null = null;

  constructor(props: ModalProps) {
    super(props, {
      isOpen: props.isOpen ?? false,
      isClosing: false
    });
  }

  protected template(): string {
    const {
      title,
      content,
      size = 'medium',
      closable = true,
      showFooter = true,
      confirmText = '확인',
      cancelText = '취소'
    } = this.props;
    const { isOpen, isClosing } = this.state.state;

    if (!isOpen) {
      return '<div class="modal-placeholder"></div>';
    }

    const overlayClass = classNames(
      'modal-overlay',
      { 'modal-overlay--closing': isClosing }
    );

    const modalClass = classNames(
      'modal',
      `modal--${size}`,
      { 'modal--closing': isClosing }
    );

    return `
      <div class="${overlayClass}">
        <div class="${modalClass}" role="dialog" aria-modal="true">
          ${title ? `
            <div class="modal-header">
              <h2 class="modal-title">${escapeHtml(title)}</h2>
              ${closable ? '<button class="modal-close" aria-label="Close">&times;</button>' : ''}
            </div>
          ` : ''}
          <div class="modal-body">
            ${content ? `<p>${escapeHtml(content)}</p>` : ''}
            <div data-child="content"></div>
          </div>
          ${showFooter ? `
            <div class="modal-footer">
              <div data-child="cancelButton"></div>
              <div data-child="confirmButton"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  protected afterMount(): void {
    if (this.state.state.isOpen && this.props.showFooter) {
      this.mountButtons();
    }
  }

  protected afterUpdate(): void {
    if (this.state.state.isOpen && this.props.showFooter) {
      this.mountButtons();
    }
  }

  private mountButtons(): void {
    const { confirmText = '확인', cancelText = '취소' } = this.props;

    // 확인 버튼
    const confirmContainer = this.$('[data-child="confirmButton"]');
    if (confirmContainer && !this.confirmButton) {
      this.confirmButton = new Button({
        text: confirmText,
        variant: 'primary',
        onClick: () => {
          this.props.onConfirm?.();
          this.emit('confirm');
        }
      });
      this.confirmButton.mount(confirmContainer);
    }

    // 취소 버튼
    const cancelContainer = this.$('[data-child="cancelButton"]');
    if (cancelContainer && !this.cancelButton) {
      this.cancelButton = new Button({
        text: cancelText,
        variant: 'secondary',
        onClick: () => {
          this.props.onCancel?.();
          this.close();
        }
      });
      this.cancelButton.mount(cancelContainer);
    }
  }

  protected bindEvents(): void {
    // 닫기 버튼
    this.bindEvent('.modal-close', 'click', () => {
      this.close();
    });

    // 오버레이 클릭으로 닫기
    this.bindEvent('.modal-overlay', 'click', (e) => {
      if ((e.target as HTMLElement).classList.contains('modal-overlay') && this.props.closable !== false) {
        this.close();
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.state.state.isOpen && this.props.closable !== false) {
      this.close();
    }
  };

  /**
   * 모달 열기
   */
  open(): void {
    this.setState({ isOpen: true, isClosing: false });
    document.body.style.overflow = 'hidden';
    this.emit('open');
  }

  /**
   * 모달 닫기 (애니메이션 포함)
   */
  close(): void {
    this.setState({ isClosing: true });

    setTimeout(() => {
      this.setState({ isOpen: false, isClosing: false });
      document.body.style.overflow = '';
      this.props.onClose?.();
      this.emit('close');
    }, 200);
  }

  /**
   * 모달 토글
   */
  toggle(): void {
    if (this.state.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  protected beforeUnmount(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';
    this.confirmButton?.unmount();
    this.cancelButton?.unmount();
  }
}

/**
 * Modal 기본 스타일
 */
export const modalStyles = `
  .modal-placeholder {
    display: none;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-overlay--closing {
    animation: fadeOut 0.2s ease forwards;
  }

  .modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.2s ease;
  }

  .modal--closing {
    animation: slideOut 0.2s ease forwards;
  }

  /* Sizes */
  .modal--small { width: 320px; }
  .modal--medium { width: 480px; }
  .modal--large { width: 640px; }
  .modal--fullscreen {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    transition: color 0.2s ease;
  }

  .modal-close:hover {
    color: #111827;
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .modal-body p {
    margin: 0;
    color: #374151;
    line-height: 1.5;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
  }
`;
