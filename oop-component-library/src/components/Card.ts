/**
 * Card - 재사용 가능한 카드 컴포넌트
 */

import { Component, ComponentProps } from '../core/Component';
import { classNames, escapeHtml } from '../utils/dom';

export interface CardProps extends ComponentProps {
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  variant?: 'elevated' | 'outlined' | 'flat';
  clickable?: boolean;
  actions?: Array<{
    text: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: () => void;
  }>;
  onClick?: () => void;
}

interface CardState {
  isHovered: boolean;
}

export class Card extends Component<CardProps, CardState> {
  constructor(props: CardProps) {
    super(props, { isHovered: false });
  }

  protected template(): string {
    const {
      title,
      subtitle,
      content,
      imageUrl,
      imageAlt = '',
      variant = 'elevated',
      clickable,
      actions
    } = this.props;
    const { isHovered } = this.state.state;

    const cardClass = classNames(
      'card',
      `card--${variant}`,
      { 'card--clickable': clickable || false },
      { 'card--hovered': isHovered }
    );

    return `
      <article class="${cardClass}">
        ${imageUrl ? `
          <div class="card__image-wrapper">
            <img class="card__image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" loading="lazy" />
          </div>
        ` : ''}

        <div class="card__content">
          ${title ? `<h3 class="card__title">${escapeHtml(title)}</h3>` : ''}
          ${subtitle ? `<p class="card__subtitle">${escapeHtml(subtitle)}</p>` : ''}
          ${content ? `<p class="card__text">${escapeHtml(content)}</p>` : ''}
          <div data-child="body"></div>
        </div>

        ${actions && actions.length > 0 ? `
          <div class="card__actions">
            ${actions.map((action, index) => `
              <button
                class="card__action card__action--${action.variant || 'secondary'}"
                data-action-index="${index}"
              >
                ${escapeHtml(action.text)}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </article>
    `;
  }

  protected bindEvents(): void {
    const { clickable, actions } = this.props;

    if (clickable) {
      this.bindEvent('.card', 'click', (e) => {
        // 액션 버튼 클릭은 제외
        if ((e.target as HTMLElement).closest('.card__actions')) {
          return;
        }
        this.props.onClick?.();
        this.emit('click');
      });

      this.bindEvent('.card', 'mouseenter', () => {
        this.setState({ isHovered: true });
      });

      this.bindEvent('.card', 'mouseleave', () => {
        this.setState({ isHovered: false });
      });
    }

    // 액션 버튼 이벤트
    if (actions) {
      this.bindEvents('.card__action', 'click', (e, index) => {
        e.stopPropagation();
        actions[index]?.onClick?.();
        this.emit('action', { action: actions[index], index });
      });
    }
  }
}

/**
 * Card 기본 스타일
 */
export const cardStyles = `
  .card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Variants */
  .card--elevated {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }

  .card--outlined {
    border: 1px solid #e5e7eb;
  }

  .card--flat {
    background: #f9fafb;
  }

  .card--clickable {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .card--clickable:hover {
    transform: translateY(-2px);
  }

  .card--elevated.card--clickable:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  }

  .card__image-wrapper {
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .card__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .card--clickable:hover .card__image {
    transform: scale(1.05);
  }

  .card__content {
    padding: 16px;
    flex: 1;
  }

  .card__title {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .card__subtitle {
    margin: 0 0 12px;
    font-size: 14px;
    color: #6b7280;
  }

  .card__text {
    margin: 0;
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
  }

  .card__actions {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
  }

  .card__action {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .card__action--primary {
    background-color: #3b82f6;
    color: white;
  }

  .card__action--primary:hover {
    background-color: #2563eb;
  }

  .card__action--secondary {
    background-color: #e5e7eb;
    color: #374151;
  }

  .card__action--secondary:hover {
    background-color: #d1d5db;
  }

  .card__action--danger {
    background-color: #fee2e2;
    color: #dc2626;
  }

  .card__action--danger:hover {
    background-color: #fecaca;
  }
`;
