/**
 * Component - OOP 기반 UI 컴포넌트의 기본 클래스
 * 라이프사이클 메서드, 상태 관리, DOM 렌더링을 제공
 */

import { EventEmitter } from './EventEmitter';
import { State } from './State';

export interface ComponentProps {
  [key: string]: unknown;
}

export interface ComponentChild {
  component: Component<ComponentProps>;
  container: string | HTMLElement;
}

export abstract class Component<P extends ComponentProps = ComponentProps, S extends object = object> extends EventEmitter {
  protected props: P;
  protected state: State<S>;
  protected element: HTMLElement | null = null;
  protected container: HTMLElement | null = null;
  protected children: Map<string, Component<ComponentProps>> = new Map();
  private mounted: boolean = false;
  private unsubscribers: Array<() => void> = [];

  constructor(props: P, initialState: S) {
    super();
    this.props = props;
    this.state = new State(initialState);

    // 상태 변경 시 자동 리렌더링
    this.unsubscribers.push(
      this.state.subscribe(() => {
        if (this.mounted) {
          this.update();
        }
      })
    );
  }

  /**
   * 컴포넌트를 DOM에 마운트
   */
  mount(container: HTMLElement | string): void {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!this.container) {
      throw new Error(`Container not found: ${container}`);
    }

    this.beforeMount();
    this.render();
    this.mounted = true;
    this.afterMount();
  }

  /**
   * 컴포넌트 언마운트
   */
  unmount(): void {
    this.beforeUnmount();

    // 자식 컴포넌트 언마운트
    this.children.forEach((child) => child.unmount());
    this.children.clear();

    // 구독 해제
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // DOM에서 제거
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.container = null;
    this.mounted = false;

    this.afterUnmount();
  }

  /**
   * 컴포넌트 렌더링
   */
  private render(): void {
    const html = this.template();
    const newElement = this.createElementFromHTML(html);

    if (this.element && this.container) {
      // 기존 요소 교체
      this.container.replaceChild(newElement, this.element);
    } else if (this.container) {
      // 새 요소 추가
      this.container.appendChild(newElement);
    }

    this.element = newElement;
    this.bindEvents();
    this.mountChildren();
  }

  /**
   * 컴포넌트 업데이트 (상태 변경 시)
   */
  protected update(): void {
    if (!this.mounted || !this.container) return;

    this.beforeUpdate();
    this.render();
    this.afterUpdate();
  }

  /**
   * HTML 문자열에서 Element 생성
   */
  private createElementFromHTML(html: string): HTMLElement {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild as HTMLElement;
  }

  /**
   * Props 업데이트
   */
  setProps(newProps: Partial<P>): void {
    const oldProps = { ...this.props };
    this.props = { ...this.props, ...newProps };

    if (this.shouldUpdate(this.props, oldProps)) {
      this.update();
    }
  }

  /**
   * 상태 업데이트
   */
  protected setState(partial: Partial<S> | ((prev: S) => Partial<S>)): void {
    this.state.setState(partial);
  }

  /**
   * 자식 컴포넌트 추가
   */
  protected addChild<CP extends ComponentProps>(
    key: string,
    ChildClass: new (props: CP) => Component<CP>,
    props: CP,
    container: string | HTMLElement
  ): Component<CP> {
    // 기존 자식 컴포넌트 제거
    if (this.children.has(key)) {
      this.children.get(key)!.unmount();
    }

    const child = new ChildClass(props);
    this.children.set(key, child as unknown as Component<ComponentProps>);

    if (this.mounted) {
      const childContainer =
        typeof container === 'string'
          ? this.element?.querySelector(container)
          : container;

      if (childContainer) {
        child.mount(childContainer as HTMLElement);
      }
    }

    return child;
  }

  /**
   * 자식 컴포넌트 가져오기
   */
  protected getChild<C extends Component<ComponentProps>>(key: string): C | undefined {
    return this.children.get(key) as C | undefined;
  }

  /**
   * 자식 컴포넌트 제거
   */
  protected removeChild(key: string): void {
    const child = this.children.get(key);
    if (child) {
      child.unmount();
      this.children.delete(key);
    }
  }

  /**
   * 자식 컴포넌트들 마운트
   */
  private mountChildren(): void {
    this.children.forEach((child, key) => {
      const container = this.element?.querySelector(`[data-child="${key}"]`);
      if (container) {
        child.mount(container as HTMLElement);
      }
    });
  }

  /**
   * DOM 요소 선택
   */
  protected $(selector: string): HTMLElement | null {
    return this.element?.querySelector(selector) ?? null;
  }

  /**
   * DOM 요소 모두 선택
   */
  protected $$(selector: string): NodeListOf<HTMLElement> {
    return this.element?.querySelectorAll(selector) ?? document.querySelectorAll('.__never__');
  }

  /**
   * 이벤트 바인딩 헬퍼
   */
  protected bindEvent<K extends keyof HTMLElementEventMap>(
    selector: string,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void
  ): void {
    const element = this.$(selector);
    if (element) {
      element.addEventListener(event, handler as EventListener);
    }
  }

  /**
   * 여러 요소에 이벤트 바인딩
   */
  protected bindEvents<K extends keyof HTMLElementEventMap>(
    selector: string,
    event: K,
    handler: (e: HTMLElementEventMap[K], index: number) => void
  ): void {
    const elements = this.$$(selector);
    elements.forEach((element, index) => {
      element.addEventListener(event, (e) => handler(e as HTMLElementEventMap[K], index));
    });
  }

  // ========== 라이프사이클 메서드 (오버라이드 가능) ==========

  /**
   * 마운트 직전에 호출
   */
  protected beforeMount(): void {}

  /**
   * 마운트 직후에 호출
   */
  protected afterMount(): void {}

  /**
   * 업데이트 직전에 호출
   */
  protected beforeUpdate(): void {}

  /**
   * 업데이트 직후에 호출
   */
  protected afterUpdate(): void {}

  /**
   * 언마운트 직전에 호출
   */
  protected beforeUnmount(): void {}

  /**
   * 언마운트 직후에 호출
   */
  protected afterUnmount(): void {}

  /**
   * Props 변경 시 업데이트 여부 결정
   */
  protected shouldUpdate(newProps: P, oldProps: P): boolean {
    return JSON.stringify(newProps) !== JSON.stringify(oldProps);
  }

  /**
   * 이벤트 바인딩 (서브클래스에서 오버라이드)
   */
  protected bindEvents(): void {}

  // ========== 추상 메서드 ==========

  /**
   * 컴포넌트의 HTML 템플릿 반환
   */
  protected abstract template(): string;
}

/**
 * 함수형 컴포넌트를 위한 래퍼
 */
export function createComponent<P extends ComponentProps>(
  templateFn: (props: P, state: object) => string,
  options?: {
    initialState?: object;
    bindEvents?: (component: Component<P>) => void;
    afterMount?: () => void;
  }
): new (props: P) => Component<P> {
  return class extends Component<P> {
    constructor(props: P) {
      super(props, options?.initialState ?? {});
    }

    protected template(): string {
      return templateFn(this.props, this.state.state);
    }

    protected bindEvents(): void {
      options?.bindEvents?.(this);
    }

    protected afterMount(): void {
      options?.afterMount?.();
    }
  };
}
