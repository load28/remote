/**
 * Button - 재사용 가능한 버튼 컴포넌트
 */

import { Component, ComponentProps } from '../core/Component';
import { classNames } from '../utils/dom';

export interface ButtonProps extends ComponentProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  onClick?: () => void;
}

interface ButtonState {
  isPressed: boolean;
}

export class Button extends Component<ButtonProps, ButtonState> {
  constructor(props: ButtonProps) {
    super(props, { isPressed: false });
  }

  protected template(): string {
    const { text, variant = 'primary', size = 'medium', disabled, loading, icon } = this.props;

    const buttonClass = classNames(
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--disabled': disabled || false },
      { 'btn--loading': loading || false }
    );

    return `
      <button class="${buttonClass}" ${disabled ? 'disabled' : ''}>
        ${loading ? '<span class="btn__spinner"></span>' : ''}
        ${icon ? `<span class="btn__icon">${icon}</span>` : ''}
        <span class="btn__text">${text}</span>
      </button>
    `;
  }

  protected bindEvents(): void {
    this.bindEvent('button', 'click', () => {
      if (!this.props.disabled && !this.props.loading) {
        this.props.onClick?.();
        this.emit('click');
      }
    });

    this.bindEvent('button', 'mousedown', () => {
      this.setState({ isPressed: true });
    });

    this.bindEvent('button', 'mouseup', () => {
      this.setState({ isPressed: false });
    });
  }

  /**
   * 로딩 상태 설정
   */
  setLoading(loading: boolean): void {
    this.setProps({ loading });
  }

  /**
   * 버튼 비활성화
   */
  disable(): void {
    this.setProps({ disabled: true });
  }

  /**
   * 버튼 활성화
   */
  enable(): void {
    this.setProps({ disabled: false });
  }
}

/**
 * 버튼 기본 스타일
 */
export const buttonStyles = `
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    outline: none;
  }

  .btn:focus-visible {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  }

  /* Variants */
  .btn--primary {
    background-color: #3b82f6;
    color: white;
  }
  .btn--primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn--secondary {
    background-color: #e5e7eb;
    color: #374151;
  }
  .btn--secondary:hover:not(:disabled) {
    background-color: #d1d5db;
  }

  .btn--danger {
    background-color: #ef4444;
    color: white;
  }
  .btn--danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .btn--ghost {
    background-color: transparent;
    color: #374151;
  }
  .btn--ghost:hover:not(:disabled) {
    background-color: #f3f4f6;
  }

  /* Sizes */
  .btn--small {
    padding: 6px 12px;
    font-size: 12px;
  }
  .btn--medium {
    padding: 8px 16px;
    font-size: 14px;
  }
  .btn--large {
    padding: 12px 24px;
    font-size: 16px;
  }

  /* States */
  .btn--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn--loading {
    position: relative;
    pointer-events: none;
  }

  .btn__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
