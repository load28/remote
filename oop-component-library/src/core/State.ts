/**
 * State - 반응형 상태 관리 시스템
 * Proxy를 사용하여 상태 변경 감지
 */

type StateListener<T> = (newState: T, oldState: T) => void;
type StateSelector<T, R> = (state: T) => R;

export class State<T extends object> {
  private _state: T;
  private _proxy: T;
  private listeners: Set<StateListener<T>> = new Set();
  private selectorListeners: Map<StateSelector<T, unknown>, Set<(value: unknown) => void>> = new Map();

  constructor(initialState: T) {
    this._state = { ...initialState };
    this._proxy = this.createProxy(this._state);
  }

  /**
   * Proxy 생성 - 상태 변경 감지
   */
  private createProxy(target: T): T {
    return new Proxy(target, {
      set: (obj, prop, value) => {
        const oldState = { ...this._state };
        (obj as Record<string | symbol, unknown>)[prop] = value;
        this.notifyListeners(this._state, oldState);
        return true;
      },
      get: (obj, prop) => {
        const value = (obj as Record<string | symbol, unknown>)[prop];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return this.createNestedProxy(value as object, prop as string);
        }
        return value;
      }
    });
  }

  /**
   * 중첩 객체를 위한 Proxy 생성
   */
  private createNestedProxy(target: object, parentKey: string): object {
    return new Proxy(target, {
      set: (obj, prop, value) => {
        const oldState = { ...this._state };
        (obj as Record<string | symbol, unknown>)[prop] = value;
        this.notifyListeners(this._state, oldState);
        return true;
      }
    });
  }

  /**
   * 현재 상태 반환 (읽기 전용)
   */
  get state(): Readonly<T> {
    return this._state;
  }

  /**
   * 상태 직접 접근 (수정 가능)
   */
  get value(): T {
    return this._proxy;
  }

  /**
   * 상태 업데이트
   */
  setState(partial: Partial<T> | ((prev: T) => Partial<T>)): void {
    const oldState = { ...this._state };
    const updates = typeof partial === 'function' ? partial(this._state) : partial;

    Object.assign(this._state, updates);
    this.notifyListeners(this._state, oldState);
  }

  /**
   * 상태 리스너 등록
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 선택적 구독 - 특정 값이 변경될 때만 알림
   */
  select<R>(selector: StateSelector<T, R>, listener: (value: R) => void): () => void {
    if (!this.selectorListeners.has(selector)) {
      this.selectorListeners.set(selector, new Set());
    }
    this.selectorListeners.get(selector)!.add(listener as (value: unknown) => void);

    return () => {
      const listeners = this.selectorListeners.get(selector);
      if (listeners) {
        listeners.delete(listener as (value: unknown) => void);
        if (listeners.size === 0) {
          this.selectorListeners.delete(selector);
        }
      }
    };
  }

  /**
   * 리스너들에게 상태 변경 알림
   */
  private notifyListeners(newState: T, oldState: T): void {
    // 일반 리스너 알림
    this.listeners.forEach(listener => {
      try {
        listener(newState, oldState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });

    // 셀렉터 리스너 알림
    this.selectorListeners.forEach((listeners, selector) => {
      const newValue = selector(newState);
      const oldValue = selector(oldState);

      if (!this.isEqual(newValue, oldValue)) {
        listeners.forEach(listener => {
          try {
            listener(newValue);
          } catch (error) {
            console.error('Error in selector listener:', error);
          }
        });
      }
    });
  }

  /**
   * 간단한 동등성 비교
   */
  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }

  /**
   * 상태 초기화
   */
  reset(initialState: T): void {
    const oldState = { ...this._state };
    this._state = { ...initialState };
    this._proxy = this.createProxy(this._state);
    this.notifyListeners(this._state, oldState);
  }
}

/**
 * Store - 전역 상태 관리 (Flux 패턴)
 */
export type Action<T = unknown> = {
  type: string;
  payload?: T;
};

export type Reducer<S, A extends Action> = (state: S, action: A) => S;

export class Store<S extends object, A extends Action = Action> {
  private state: State<S>;
  private reducer: Reducer<S, A>;
  private middlewares: Array<(action: A, next: () => void) => void> = [];

  constructor(reducer: Reducer<S, A>, initialState: S) {
    this.reducer = reducer;
    this.state = new State(initialState);
  }

  /**
   * 현재 상태 반환
   */
  getState(): Readonly<S> {
    return this.state.state;
  }

  /**
   * 액션 디스패치
   */
  dispatch(action: A): void {
    const runMiddlewares = (index: number) => {
      if (index < this.middlewares.length) {
        this.middlewares[index](action, () => runMiddlewares(index + 1));
      } else {
        const newState = this.reducer(this.state.state as S, action);
        this.state.setState(newState);
      }
    };
    runMiddlewares(0);
  }

  /**
   * 상태 변경 구독
   */
  subscribe(listener: StateListener<S>): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * 미들웨어 추가
   */
  use(middleware: (action: A, next: () => void) => void): void {
    this.middlewares.push(middleware);
  }
}
