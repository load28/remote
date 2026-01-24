/**
 * Components - 재사용 가능한 UI 컴포넌트 모음
 */

export { Button, buttonStyles } from './Button';
export type { ButtonProps } from './Button';

export { Input, inputStyles } from './Input';
export type { InputProps } from './Input';

export { Modal, modalStyles } from './Modal';
export type { ModalProps } from './Modal';

export { List, listStyles } from './List';
export type { ListProps, ListItem } from './List';

export { Card, cardStyles } from './Card';
export type { CardProps } from './Card';

/**
 * 모든 컴포넌트 스타일 통합
 */
export const allComponentStyles = `
  ${buttonStyles}
  ${inputStyles}
  ${modalStyles}
  ${listStyles}
  ${cardStyles}
`;

/**
 * 스타일을 DOM에 주입하는 헬퍼
 */
export function injectStyles(styles: string = allComponentStyles): HTMLStyleElement {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  return styleElement;
}
