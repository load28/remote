/**
 * Input - 재사용 가능한 입력 컴포넌트
 */

import { Component, ComponentProps } from '../core/Component';
import { classNames, escapeHtml, debounce } from '../utils/dom';

export interface InputProps extends ComponentProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
  value?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  debounceMs?: number;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: (value: string) => void;
}

interface InputState {
  value: string;
  isFocused: boolean;
  isDirty: boolean;
}

export class Input extends Component<InputProps, InputState> {
  private debouncedOnChange?: (value: string) => void;

  constructor(props: InputProps) {
    super(props, {
      value: props.value || '',
      isFocused: false,
      isDirty: false
    });

    if (props.onChange && props.debounceMs) {
      this.debouncedOnChange = debounce(props.onChange, props.debounceMs);
    }
  }

  protected template(): string {
    const {
      type = 'text',
      placeholder = '',
      label,
      error,
      hint,
      disabled,
      required,
      maxLength,
      pattern
    } = this.props;
    const { value, isFocused, isDirty } = this.state.state;

    const wrapperClass = classNames(
      'input-wrapper',
      { 'input-wrapper--focused': isFocused },
      { 'input-wrapper--error': error && isDirty },
      { 'input-wrapper--disabled': disabled || false }
    );

    return `
      <div class="${wrapperClass}">
        ${label ? `<label class="input-label">${escapeHtml(label)}${required ? ' <span class="input-required">*</span>' : ''}</label>` : ''}
        <input
          type="${type}"
          class="input-field"
          value="${escapeHtml(value)}"
          placeholder="${escapeHtml(placeholder)}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          ${maxLength ? `maxlength="${maxLength}"` : ''}
          ${pattern ? `pattern="${pattern}"` : ''}
        />
        ${error && isDirty ? `<span class="input-error">${escapeHtml(error)}</span>` : ''}
        ${hint && !error ? `<span class="input-hint">${escapeHtml(hint)}</span>` : ''}
      </div>
    `;
  }

  protected bindEvents(): void {
    const input = this.$('.input-field') as HTMLInputElement;
    if (!input) return;

    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.setState({ value, isDirty: true });

      if (this.debouncedOnChange) {
        this.debouncedOnChange(value);
      } else {
        this.props.onChange?.(value);
      }

      this.emit('change', value);
    });

    input.addEventListener('focus', () => {
      this.setState({ isFocused: true });
      this.props.onFocus?.();
      this.emit('focus');
    });

    input.addEventListener('blur', () => {
      this.setState({ isFocused: false });
      this.props.onBlur?.();
      this.emit('blur');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.props.onEnter?.(this.state.state.value);
        this.emit('enter', this.state.state.value);
      }
    });
  }

  /**
   * 입력값 가져오기
   */
  getValue(): string {
    return this.state.state.value;
  }

  /**
   * 입력값 설정
   */
  setValue(value: string): void {
    this.setState({ value });
  }

  /**
   * 입력 초기화
   */
  clear(): void {
    this.setState({ value: '', isDirty: false });
  }

  /**
   * 입력 필드에 포커스
   */
  focus(): void {
    const input = this.$('.input-field') as HTMLInputElement;
    input?.focus();
  }

  /**
   * 유효성 검증
   */
  validate(): boolean {
    const input = this.$('.input-field') as HTMLInputElement;
    return input?.checkValidity() ?? false;
  }
}

/**
 * Input 기본 스타일
 */
export const inputStyles = `
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .input-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .input-required {
    color: #ef4444;
  }

  .input-field {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-field:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .input-field::placeholder {
    color: #9ca3af;
  }

  .input-wrapper--focused .input-field {
    border-color: #3b82f6;
  }

  .input-wrapper--error .input-field {
    border-color: #ef4444;
  }

  .input-wrapper--error .input-field:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .input-wrapper--disabled .input-field {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  .input-error {
    font-size: 12px;
    color: #ef4444;
  }

  .input-hint {
    font-size: 12px;
    color: #6b7280;
  }
`;
