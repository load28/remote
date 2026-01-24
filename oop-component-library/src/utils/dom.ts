/**
 * DOM 유틸리티 함수들
 */

/**
 * 요소 생성 헬퍼
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  children?: (string | HTMLElement)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        (element as Record<string, unknown>)[key] = value;
      }
    });
  }

  if (children) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  return element;
}

/**
 * HTML 이스케이프 (XSS 방지)
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 클래스명 조합 헬퍼
 */
export function classNames(
  ...args: (string | Record<string, boolean> | undefined | null | false)[]
): string {
  const classes: string[] = [];

  args.forEach(arg => {
    if (!arg) return;

    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (typeof arg === 'object') {
      Object.entries(arg).forEach(([key, value]) => {
        if (value) classes.push(key);
      });
    }
  });

  return classes.join(' ');
}

/**
 * 스타일 문자열 생성
 */
export function style(styles: Record<string, string | number>): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${typeof value === 'number' ? `${value}px` : value}`;
    })
    .join('; ');
}

/**
 * 이벤트 위임 헬퍼
 */
export function delegate<K extends keyof HTMLElementEventMap>(
  container: HTMLElement,
  selector: string,
  event: K,
  handler: (e: HTMLElementEventMap[K], target: HTMLElement) => void
): () => void {
  const listener = (e: Event) => {
    const target = (e.target as HTMLElement).closest(selector) as HTMLElement | null;
    if (target && container.contains(target)) {
      handler(e as HTMLElementEventMap[K], target);
    }
  };

  container.addEventListener(event, listener);

  return () => container.removeEventListener(event, listener);
}

/**
 * 디바운스
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 쓰로틀
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 템플릿 리터럴 헬퍼 (HTML 하이라이팅 지원)
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    let stringValue = '';

    if (value === null || value === undefined) {
      stringValue = '';
    } else if (Array.isArray(value)) {
      stringValue = value.join('');
    } else {
      stringValue = String(value);
    }

    return result + str + stringValue;
  }, '');
}
