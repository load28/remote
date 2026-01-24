# Nova Framework - Architecture Design Document

## 개요

Nova는 현대적인 프론트엔드 프레임워크로, 다음 핵심 기술들의 장점을 통합합니다:

- **TanStack Router**: 타입 안전 라우팅
- **Preact Signals**: 세밀한 반응형 시스템
- **Class Components**: OOP 기반 컴포넌트
- **Angular Modules**: 모듈 시스템 및 의존성 주입
- **Qwik Resumability**: 재개 가능한 하이드레이션

---

## 1. 핵심 아키텍처 개념

### 1.1 설계 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│                      Nova Framework                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Router    │  │   Signal    │  │   Module System         │  │
│  │  (TanStack) │  │  (Preact)   │  │   (Angular-inspired)    │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
│                ┌─────────▼─────────┐                            │
│                │  Class Component  │                            │
│                │      (OOP)        │                            │
│                └─────────┬─────────┘                            │
│                          │                                       │
│                ┌─────────▼─────────┐                            │
│                │    Resumable      │                            │
│                │   Hydration       │                            │
│                │    (Qwik)         │                            │
│                └───────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 주요 특징

| 특징 | 설명 | 참조 소스 |
|------|------|-----------|
| Zero Hydration | 서버 상태를 클라이언트에서 그대로 재개 | Qwik |
| Fine-grained Reactivity | 컴포넌트 단위가 아닌 값 단위 반응성 | Preact Signals |
| Type-safe Routing | 완전한 타입 추론 라우팅 | TanStack Router |
| Hierarchical DI | 계층적 의존성 주입 | Angular |
| OOP Components | 클래스 기반 컴포넌트 모델 | Custom |

---

## 2. Signal 시스템 (반응형 상태 관리)

### 2.1 핵심 구조

Preact Signals의 아키텍처를 기반으로 구현합니다.

**참조**: `preact/packages/signals/src/index.ts`

```typescript
// ============================================
// 핵심 인터페이스
// ============================================

interface Signal<T> {
  value: T;
  peek(): T;
  subscribe(fn: (value: T) => void): () => void;
}

interface Computed<T> extends Signal<T> {
  readonly value: T;
}

interface Effect {
  (): void;
  dispose(): void;
}

// ============================================
// 전역 상태 추적 (Preact Signals 패턴)
// ============================================

// 현재 실행 중인 계산/이펙트 추적
let currentComputed: Computed<any> | null = null;
let batchDepth = 0;
let batchedEffects: Effect[] = [];

// 구독 관계 추적을 위한 노드 구조
interface Node {
  _source: Signal<any>;
  _prevSource: Node | null;
  _nextSource: Node | null;
  _target: Computed<any> | Effect;
  _prevTarget: Node | null;
  _nextTarget: Node | null;
  _version: number;
  _rollbackNode: Node | null;
}
```

### 2.2 Signal 구현

```typescript
// ============================================
// Signal 클래스 구현
// ============================================

const NOTSET = Symbol('NOTSET');

class SignalImpl<T> implements Signal<T> {
  _value: T;
  _version: number = 0;
  _node: Node | null = null;  // 구독자 연결 리스트 헤드
  _targets: Node | null = null;

  constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    // 현재 계산 컨텍스트가 있으면 구독 등록
    if (currentComputed) {
      this._subscribe(currentComputed);
    }
    return this._value;
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._version++;

      // 배치 모드면 지연, 아니면 즉시 알림
      if (batchDepth > 0) {
        this._queueNotify();
      } else {
        this._notify();
      }
    }
  }

  peek(): T {
    return this._value;
  }

  _subscribe(target: Computed<any> | Effect): void {
    // 이미 구독 중인지 확인
    let node = this._targets;
    while (node) {
      if (node._target === target) return;
      node = node._nextTarget;
    }

    // 새 노드 생성 및 연결
    const newNode: Node = {
      _source: this,
      _prevSource: null,
      _nextSource: target._sources,
      _target: target,
      _prevTarget: this._targets,
      _nextTarget: null,
      _version: this._version,
      _rollbackNode: null,
    };

    if (this._targets) this._targets._nextTarget = newNode;
    this._targets = newNode;

    if (target._sources) target._sources._prevSource = newNode;
    target._sources = newNode;
  }

  _notify(): void {
    let node = this._targets;
    while (node) {
      node._target._notify();
      node = node._nextTarget;
    }
  }
}

// ============================================
// Computed 구현
// ============================================

class ComputedImpl<T> implements Computed<T> {
  _fn: () => T;
  _value: T = NOTSET as T;
  _version: number = 0;
  _sources: Node | null = null;
  _flags: number = DIRTY;  // DIRTY, RUNNING, HAS_ERROR 등

  constructor(fn: () => T) {
    this._fn = fn;
  }

  get value(): T {
    // 더티 상태면 재계산
    if (this._flags & DIRTY) {
      this._refresh();
    }

    // 현재 컨텍스트에 구독 등록
    if (currentComputed) {
      this._subscribeTarget(currentComputed);
    }

    return this._value;
  }

  _refresh(): void {
    this._flags &= ~DIRTY;

    const prevComputed = currentComputed;
    currentComputed = this;

    try {
      // 이전 구독 정리
      this._cleanupSources();

      // 재계산 - 이 과정에서 새 구독이 자동 등록됨
      const newValue = this._fn();

      if (this._value !== newValue) {
        this._value = newValue;
        this._version++;
      }
    } finally {
      currentComputed = prevComputed;
    }
  }

  _notify(): void {
    // 더티로 마킹하고 의존하는 computed/effect에 전파
    if (!(this._flags & DIRTY)) {
      this._flags |= DIRTY;
      // 하위 타겟들에게 알림
    }
  }
}

// ============================================
// Effect 구현
// ============================================

class EffectImpl implements Effect {
  _fn: () => void;
  _sources: Node | null = null;
  _flags: number = DIRTY;

  constructor(fn: () => void) {
    this._fn = fn;
    this._run();
  }

  _run(): void {
    const prevComputed = currentComputed;
    currentComputed = this as any;

    try {
      this._cleanupSources();
      this._fn();
    } finally {
      currentComputed = prevComputed;
    }

    this._flags &= ~DIRTY;
  }

  _notify(): void {
    if (!(this._flags & DIRTY)) {
      this._flags |= DIRTY;

      if (batchDepth > 0) {
        batchedEffects.push(this);
      } else {
        this._run();
      }
    }
  }

  dispose(): void {
    this._cleanupSources();
    this._flags |= DISPOSED;
  }
}

// ============================================
// 배치 처리
// ============================================

function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // 모든 대기 중인 이펙트 실행
      const effects = batchedEffects;
      batchedEffects = [];
      for (const effect of effects) {
        effect._run();
      }
    }
  }
}

// ============================================
// Public API
// ============================================

function signal<T>(initialValue: T): Signal<T> {
  return new SignalImpl(initialValue);
}

function computed<T>(fn: () => T): Computed<T> {
  return new ComputedImpl(fn);
}

function effect(fn: () => void): Effect {
  return new EffectImpl(fn);
}
```

### 2.3 Qwik 직렬화 통합

Signal을 Resumable하게 만들기 위한 직렬화 지원:

```typescript
// ============================================
// Signal 직렬화 (Qwik 패턴)
// ============================================

const SignalSerializer = {
  $prefix$: '\u0012',

  $test$: (v: unknown): v is Signal<any> => {
    return v instanceof SignalImpl;
  },

  $collect$: (signal: Signal<any>, collector: Collector) => {
    // Signal 값 수집
    collector.collect(signal.peek());
    // 구독 정보 수집
    collector.collectSubscriptions(signal);
  },

  $serialize$: (signal: Signal<any>, getObjId: GetObjId): string => {
    return getObjId(signal.peek());
  },

  $prepare$: (data: string, containerState: ContainerState): Signal<any> => {
    // 빈 시그널 생성 (값은 나중에 채움)
    return new SignalImpl(undefined);
  },

  $fill$: (signal: SignalImpl<any>, getObject: GetObject, data: string) => {
    // 역직렬화된 값으로 채움
    signal._value = getObject(data);
  },

  $subs$: (signal: SignalImpl<any>, subs: Subscription[]) => {
    // 구독 관계 복원
    for (const sub of subs) {
      restoreSubscription(signal, sub);
    }
  }
};
```

---

## 3. 모듈 시스템 (의존성 주입)

### 3.1 핵심 구조

Angular의 모듈 시스템을 기반으로 구현합니다.

**참조**: `angular/packages/core/src/di/r3_injector.ts`

```typescript
// ============================================
// 핵심 타입 정의
// ============================================

// 주입 토큰
class InjectionToken<T> {
  constructor(
    public readonly description: string,
    public readonly options?: {
      providedIn?: 'root' | 'module' | null;
      factory?: () => T;
    }
  ) {}
}

// Provider 타입들
type Provider =
  | TypeProvider
  | ValueProvider
  | ClassProvider
  | FactoryProvider
  | ExistingProvider;

interface TypeProvider {
  new (...args: any[]): any;
}

interface ValueProvider {
  provide: any;
  useValue: any;
}

interface ClassProvider {
  provide: any;
  useClass: Type<any>;
  deps?: any[];
}

interface FactoryProvider {
  provide: any;
  useFactory: (...args: any[]) => any;
  deps?: any[];
}

interface ExistingProvider {
  provide: any;
  useExisting: any;
}

// Multi Provider 지원
interface MultiProvider {
  provide: any;
  multi: true;
  useClass?: Type<any>;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
}
```

### 3.2 Module 데코레이터

```typescript
// ============================================
// Module 정의
// ============================================

interface ModuleMetadata {
  // 이 모듈에 속한 컴포넌트, 디렉티브, 파이프
  declarations?: Type<any>[];

  // 가져올 다른 모듈들
  imports?: (Type<any> | ModuleWithProviders<any>)[];

  // 외부에 공개할 선언들
  exports?: Type<any>[];

  // 의존성 주입 프로바이더
  providers?: Provider[];

  // 부트스트랩할 컴포넌트 (루트 모듈용)
  bootstrap?: Type<any>[];
}

// Module 데코레이터
function Module(metadata: ModuleMetadata): ClassDecorator {
  return function(target: Function) {
    // 모듈 정의 저장
    Reflect.defineMetadata('module:metadata', metadata, target);

    // 컴파일된 모듈 정의 생성
    const moduleDef: ModuleDef = {
      type: target as Type<any>,
      bootstrap: metadata.bootstrap || [],
      declarations: metadata.declarations || [],
      imports: metadata.imports || [],
      exports: metadata.exports || [],
      providers: metadata.providers || [],
      transitiveScopes: null,  // 지연 계산
    };

    Object.defineProperty(target, '__moduleDef__', {
      get: () => moduleDef
    });
  };
}

// ModuleWithProviders 패턴 (Angular)
interface ModuleWithProviders<T> {
  ngModule: Type<T>;
  providers?: Provider[];
}
```

### 3.3 Injector 구현

```typescript
// ============================================
// Injector 구현 (Angular R3Injector 패턴)
// ============================================

// 레코드 상태 마커
const NOT_YET = {};
const CIRCULAR = {};

interface Record<T> {
  factory: (() => T) | undefined;
  value: T | typeof NOT_YET;
  multi: any[] | undefined;
}

class Injector {
  private records = new Map<any, Record<any>>();
  private _destroyed = false;

  constructor(
    providers: Provider[],
    private parent: Injector | null = null,
    private source: string = ''
  ) {
    // Injector 자체를 제공
    this.records.set(Injector, {
      factory: undefined,
      value: this,
      multi: undefined
    });

    // 프로바이더 처리
    for (const provider of providers) {
      this.processProvider(provider);
    }
  }

  private processProvider(provider: Provider): void {
    let token: any;
    let record: Record<any>;

    if (typeof provider === 'function') {
      // TypeProvider
      token = provider;
      record = {
        factory: () => this.instantiate(provider),
        value: NOT_YET,
        multi: undefined
      };
    } else if ('useValue' in provider) {
      // ValueProvider
      token = provider.provide;
      record = {
        factory: undefined,
        value: provider.useValue,
        multi: undefined
      };
    } else if ('useClass' in provider) {
      // ClassProvider
      token = provider.provide;
      record = {
        factory: () => this.instantiate(provider.useClass, provider.deps),
        value: NOT_YET,
        multi: undefined
      };
    } else if ('useFactory' in provider) {
      // FactoryProvider
      token = provider.provide;
      record = {
        factory: () => {
          const deps = (provider.deps || []).map(d => this.get(d));
          return provider.useFactory(...deps);
        },
        value: NOT_YET,
        multi: undefined
      };
    } else if ('useExisting' in provider) {
      // ExistingProvider (별칭)
      token = provider.provide;
      record = {
        factory: () => this.get(provider.useExisting),
        value: NOT_YET,
        multi: undefined
      };
    }

    // Multi provider 처리
    if ((provider as any).multi) {
      let multiRecord = this.records.get(token);
      if (!multiRecord) {
        multiRecord = {
          factory: () => multiRecord!.multi!.map(p => this.hydrate(p)),
          value: NOT_YET,
          multi: []
        };
        this.records.set(token, multiRecord);
      }
      multiRecord.multi!.push(record);
    } else {
      this.records.set(token, record!);
    }
  }

  get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T): T {
    // 1. 현재 인젝터에서 찾기
    const record = this.records.get(token);
    if (record) {
      return this.hydrate(record);
    }

    // 2. 부모 인젝터에서 찾기
    if (this.parent) {
      return this.parent.get(token, notFoundValue);
    }

    // 3. 토큰에 기본 팩토리가 있는지 확인
    if (token instanceof InjectionToken && token.options?.factory) {
      return token.options.factory();
    }

    // 4. Not found
    if (notFoundValue !== undefined) {
      return notFoundValue;
    }

    throw new Error(`No provider for ${token}`);
  }

  private hydrate<T>(record: Record<T>): T {
    if (record.value === CIRCULAR) {
      throw new Error('Circular dependency detected');
    }

    if (record.value === NOT_YET) {
      record.value = CIRCULAR;  // 순환 감지
      record.value = record.factory!();
    }

    return record.value as T;
  }

  private instantiate<T>(type: Type<T>, explicitDeps?: any[]): T {
    // 의존성 메타데이터 가져오기
    const deps = explicitDeps || this.getDependencies(type);
    const resolvedDeps = deps.map(dep => this.get(dep));
    return new type(...resolvedDeps);
  }

  private getDependencies(type: Type<any>): any[] {
    // 데코레이터에서 의존성 정보 추출
    return Reflect.getMetadata('design:paramtypes', type) || [];
  }

  destroy(): void {
    this._destroyed = true;
    this.records.forEach((record, token) => {
      if (record.value !== NOT_YET && typeof record.value?.onDestroy === 'function') {
        record.value.onDestroy();
      }
    });
    this.records.clear();
  }
}
```

### 3.4 모듈 스코프 계산

```typescript
// ============================================
// Transitive Scope 계산 (Angular 패턴)
// ============================================

interface TransitiveScopes {
  compilation: {
    directives: Set<Type<any>>;
    pipes: Set<Type<any>>;
  };
  exported: {
    directives: Set<Type<any>>;
    pipes: Set<Type<any>>;
  };
}

function computeTransitiveScopes(moduleType: Type<any>): TransitiveScopes {
  const def = getModuleDef(moduleType);

  if (def.transitiveScopes) {
    return def.transitiveScopes;  // 캐시된 결과
  }

  const scopes: TransitiveScopes = {
    compilation: { directives: new Set(), pipes: new Set() },
    exported: { directives: new Set(), pipes: new Set() }
  };

  // 1. imports 처리 - 가져온 모듈의 exported 항목을 compilation에 추가
  for (const imported of def.imports) {
    const importedModule = unwrapModuleWithProviders(imported);
    const importedScopes = computeTransitiveScopes(importedModule);

    importedScopes.exported.directives.forEach(d =>
      scopes.compilation.directives.add(d));
    importedScopes.exported.pipes.forEach(p =>
      scopes.compilation.pipes.add(p));
  }

  // 2. declarations 처리 - 선언된 항목을 compilation에 추가
  for (const declared of def.declarations) {
    if (isDirective(declared) || isComponent(declared)) {
      scopes.compilation.directives.add(declared);
    } else if (isPipe(declared)) {
      scopes.compilation.pipes.add(declared);
    }
  }

  // 3. exports 처리
  for (const exported of def.exports) {
    if (isModule(exported)) {
      // 모듈 재수출 - 그 모듈의 exported 항목들을 모두 포함
      const exportedScopes = computeTransitiveScopes(exported);
      exportedScopes.exported.directives.forEach(d => {
        scopes.compilation.directives.add(d);
        scopes.exported.directives.add(d);
      });
      exportedScopes.exported.pipes.forEach(p => {
        scopes.compilation.pipes.add(p);
        scopes.exported.pipes.add(p);
      });
    } else if (isPipe(exported)) {
      scopes.exported.pipes.add(exported);
    } else {
      scopes.exported.directives.add(exported);
    }
  }

  def.transitiveScopes = scopes;  // 캐시
  return scopes;
}
```

---

## 4. 클래스 컴포넌트 (OOP)

### 4.1 컴포넌트 기본 클래스

```typescript
// ============================================
// 컴포넌트 기본 클래스
// ============================================

abstract class Component<P = {}, S = {}> {
  // 프로퍼티
  protected props: Readonly<P>;
  protected state: S;

  // Signal 기반 상태 (자동 추적)
  private _stateSignal: Signal<S>;

  // 라이프사이클 상태
  private _mounted: boolean = false;
  private _destroyed: boolean = false;

  // DOM 참조
  protected element: HTMLElement | null = null;

  // 의존성 주입
  protected injector: Injector;

  constructor(props: P, injector: Injector) {
    this.props = props;
    this.injector = injector;
    this.state = this.getInitialState();
    this._stateSignal = signal(this.state);
  }

  // ============================================
  // 추상 메서드
  // ============================================

  abstract render(): VNode;

  protected getInitialState(): S {
    return {} as S;
  }

  // ============================================
  // 상태 관리
  // ============================================

  protected setState(partial: Partial<S> | ((prev: S) => Partial<S>)): void {
    const update = typeof partial === 'function'
      ? partial(this.state)
      : partial;

    this.state = { ...this.state, ...update };
    this._stateSignal.value = this.state;
  }

  // Signal 기반 computed 상태
  protected computed<T>(fn: () => T): Computed<T> {
    return computed(fn);
  }

  // ============================================
  // 라이프사이클 훅
  // ============================================

  // 마운트 전 (SSR에서도 호출)
  protected onInit(): void {}

  // 마운트 후 (클라이언트에서만)
  protected onMount(): void {}

  // 업데이트 전
  protected onBeforeUpdate(prevProps: P, prevState: S): void {}

  // 업데이트 후
  protected onAfterUpdate(prevProps: P, prevState: S): void {}

  // 언마운트 시
  protected onDestroy(): void {}

  // 에러 발생 시
  protected onError(error: Error): VNode | void {}

  // ============================================
  // 유틸리티
  // ============================================

  // 의존성 주입
  protected inject<T>(token: Type<T> | InjectionToken<T>): T {
    return this.injector.get(token);
  }

  // 이펙트 등록 (자동 정리)
  protected effect(fn: () => void | (() => void)): void {
    const cleanup = effect(() => {
      const result = fn();
      return result;
    });

    // 컴포넌트 파괴 시 자동 정리
    this._effects.push(cleanup);
  }

  private _effects: Effect[] = [];
}
```

### 4.2 컴포넌트 데코레이터

```typescript
// ============================================
// 컴포넌트 데코레이터
// ============================================

interface ComponentMetadata {
  selector: string;
  template?: string;
  styles?: string[];
  providers?: Provider[];
  // Resumable 옵션
  resumable?: boolean;
}

function ComponentDecorator(metadata: ComponentMetadata): ClassDecorator {
  return function(target: Function) {
    const componentDef: ComponentDef = {
      type: target as Type<any>,
      selector: metadata.selector,
      template: metadata.template,
      styles: metadata.styles || [],
      providers: metadata.providers || [],
      resumable: metadata.resumable ?? true,

      // 컴파일된 팩토리
      factory: (props: any, injector: Injector) => {
        // 컴포넌트용 자식 인젝터 생성
        const componentInjector = new Injector(
          metadata.providers || [],
          injector,
          metadata.selector
        );
        return new (target as any)(props, componentInjector);
      }
    };

    Object.defineProperty(target, '__componentDef__', {
      get: () => componentDef
    });

    // QRL 생성 (Resumable용)
    if (metadata.resumable) {
      generateComponentQRL(target, componentDef);
    }
  };
}

// ============================================
// 프로퍼티 데코레이터들
// ============================================

// Input (부모로부터 받는 props)
function Input(options?: { required?: boolean }): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    const inputs = Reflect.getMetadata('component:inputs', target.constructor) || [];
    inputs.push({ key: propertyKey, ...options });
    Reflect.defineMetadata('component:inputs', inputs, target.constructor);
  };
}

// Output (이벤트 에미터)
function Output(): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    const outputs = Reflect.getMetadata('component:outputs', target.constructor) || [];
    outputs.push(propertyKey);
    Reflect.defineMetadata('component:outputs', outputs, target.constructor);
  };
}

// ViewChild (자식 컴포넌트/요소 참조)
function ViewChild(selector: string | Type<any>): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    const queries = Reflect.getMetadata('component:viewChildren', target.constructor) || [];
    queries.push({ key: propertyKey, selector, first: true });
    Reflect.defineMetadata('component:viewChildren', queries, target.constructor);
  };
}
```

### 4.3 컴포넌트 예제

```typescript
// ============================================
// 사용 예제
// ============================================

@Component({
  selector: 'app-counter',
  template: `
    <div class="counter">
      <span>Count: {{ count }}</span>
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
    </div>
  `,
  styles: [`
    .counter { display: flex; gap: 8px; }
  `],
  providers: [CounterService]
})
class CounterComponent extends Component<CounterProps, CounterState> {
  @Input({ required: true })
  initialCount!: number;

  @Output()
  countChange = new EventEmitter<number>();

  // 의존성 주입
  private counterService = this.inject(CounterService);

  protected getInitialState(): CounterState {
    return { count: this.initialCount };
  }

  // Computed 값
  get doubleCount() {
    return this.computed(() => this.state.count * 2);
  }

  protected onMount(): void {
    // 이펙트: count 변경 시 서비스에 알림
    this.effect(() => {
      this.counterService.recordCount(this.state.count);
    });
  }

  increment = () => {
    this.setState(prev => ({ count: prev.count + 1 }));
    this.countChange.emit(this.state.count);
  };

  decrement = () => {
    this.setState(prev => ({ count: prev.count - 1 }));
    this.countChange.emit(this.state.count);
  };

  render(): VNode {
    return (
      <div class="counter">
        <span>Count: {this.state.count}</span>
        <span>Double: {this.doubleCount.value}</span>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    );
  }
}
```

---

## 5. 라우터 시스템

### 5.1 핵심 구조

TanStack Router의 타입 안전 라우팅을 기반으로 구현합니다.

**참조**: `tanstack-router/packages/router-core/src/`

```typescript
// ============================================
// 라우트 정의
// ============================================

interface RouteConfig<
  TPath extends string = string,
  TParams = unknown,
  TSearch = unknown,
  TLoader = unknown
> {
  path: TPath;

  // 파라미터 파싱/검증
  parseParams?: (raw: Record<string, string>) => TParams;
  stringifyParams?: (params: TParams) => Record<string, string>;

  // 검색 파라미터
  validateSearch?: (search: Record<string, unknown>) => TSearch;

  // 데이터 로딩
  loader?: (ctx: LoaderContext<TParams, TSearch>) => Promise<TLoader>;

  // 컴포넌트
  component?: Type<Component>;
  pendingComponent?: Type<Component>;
  errorComponent?: Type<Component>;

  // 중첩 라우트
  children?: RouteConfig[];

  // 가드
  beforeLoad?: (ctx: BeforeLoadContext) => Promise<void | Redirect>;
}

// ============================================
// 타입 안전 라우트 빌더
// ============================================

class Route<
  TPath extends string,
  TParams,
  TSearch,
  TLoader
> {
  constructor(public options: RouteConfig<TPath, TParams, TSearch, TLoader>) {}

  // 자식 라우트 추가 (타입 체인)
  addChildren<TChildren extends Route<any, any, any, any>[]>(
    children: TChildren
  ): Route<TPath, TParams, TSearch, TLoader> & { children: TChildren } {
    return Object.assign(
      new Route({ ...this.options, children: children.map(c => c.options) }),
      { children }
    ) as any;
  }
}

// 루트 라우트 생성
function createRootRoute<TLoader = unknown>(
  options?: Omit<RouteConfig<'/', {}, {}, TLoader>, 'path'>
): Route<'/', {}, {}, TLoader> {
  return new Route({ path: '/', ...options });
}

// 자식 라우트 생성
function createRoute<
  TPath extends string,
  TParams = ExtractParams<TPath>,
  TSearch = {},
  TLoader = unknown
>(
  options: RouteConfig<TPath, TParams, TSearch, TLoader>
): Route<TPath, TParams, TSearch, TLoader> {
  return new Route(options);
}

// 경로에서 파라미터 타입 추출
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};
```

### 5.2 Router 구현

```typescript
// ============================================
// Router 클래스
// ============================================

interface RouterState<TRouteTree> {
  location: Location;
  matches: RouteMatch[];
  pendingMatches: RouteMatch[] | null;
  status: 'idle' | 'pending' | 'error';
  error: Error | null;
}

class Router<TRouteTree extends Route<any, any, any, any>> {
  // 상태를 Signal로 관리 (반응형)
  private _state: Signal<RouterState<TRouteTree>>;

  // 라우트 매칭 캐시
  private _matchCache = new Map<string, RouteMatch[]>();

  constructor(
    private routeTree: TRouteTree,
    private options: RouterOptions = {}
  ) {
    this._state = signal({
      location: this.parseLocation(window.location),
      matches: [],
      pendingMatches: null,
      status: 'idle',
      error: null
    });

    // 초기 매칭
    this.navigate(window.location.pathname + window.location.search, {
      replace: true
    });

    // popstate 이벤트 리스닝
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState);
    }
  }

  // 현재 상태 (반응형)
  get state(): RouterState<TRouteTree> {
    return this._state.value;
  }

  // 현재 매치된 라우트들
  get matches(): RouteMatch[] {
    return this._state.value.matches;
  }

  // 네비게이션
  async navigate(
    to: string | NavigateOptions,
    options: NavigateOptions = {}
  ): Promise<void> {
    const href = typeof to === 'string' ? to : to.to;
    const location = this.parseLocation(href);

    // 매칭
    const matches = this.matchRoutes(location);

    if (!matches.length) {
      throw new Error(`No route matched: ${href}`);
    }

    // pending 상태로 전환
    this._state.value = {
      ...this._state.value,
      pendingMatches: matches,
      status: 'pending'
    };

    try {
      // beforeLoad 가드 실행
      for (const match of matches) {
        if (match.route.beforeLoad) {
          const result = await match.route.beforeLoad({
            params: match.params,
            search: match.search,
            location
          });

          if (result instanceof Redirect) {
            return this.navigate(result.to, { replace: true });
          }
        }
      }

      // 데이터 로딩 (병렬)
      await Promise.all(
        matches.map(async (match) => {
          if (match.route.loader) {
            match.loaderData = await match.route.loader({
              params: match.params,
              search: match.search
            });
          }
        })
      );

      // URL 업데이트
      if (options.replace) {
        history.replaceState(null, '', href);
      } else {
        history.pushState(null, '', href);
      }

      // 상태 완료
      this._state.value = {
        location,
        matches,
        pendingMatches: null,
        status: 'idle',
        error: null
      };
    } catch (error) {
      this._state.value = {
        ...this._state.value,
        pendingMatches: null,
        status: 'error',
        error: error as Error
      };
    }
  }

  // 라우트 매칭
  private matchRoutes(location: Location): RouteMatch[] {
    const cacheKey = location.pathname + location.search;

    if (this._matchCache.has(cacheKey)) {
      return this._matchCache.get(cacheKey)!;
    }

    const matches: RouteMatch[] = [];
    this.matchRoute(this.routeTree.options, location.pathname, matches);

    this._matchCache.set(cacheKey, matches);
    return matches;
  }

  private matchRoute(
    route: RouteConfig,
    pathname: string,
    matches: RouteMatch[],
    parentPath: string = ''
  ): boolean {
    const fullPath = parentPath + route.path;
    const pattern = this.pathToRegexp(fullPath);
    const match = pathname.match(pattern);

    if (!match) return false;

    // 파라미터 추출
    const params = route.parseParams
      ? route.parseParams(this.extractParams(fullPath, match))
      : this.extractParams(fullPath, match);

    matches.push({
      route,
      params,
      search: this.parseSearch(location.search),
      loaderData: null
    });

    // 자식 라우트 매칭
    if (route.children) {
      for (const child of route.children) {
        if (this.matchRoute(child, pathname, matches, fullPath)) {
          return true;
        }
      }
    }

    return true;
  }
}
```

### 5.3 라우터 통합 컴포넌트

```typescript
// ============================================
// Router Outlet 컴포넌트
// ============================================

@Component({
  selector: 'router-outlet',
  template: '',
  resumable: true
})
class RouterOutlet extends Component {
  private router = this.inject(Router);

  // 현재 깊이의 매치 (중첩 라우팅용)
  @Input() depth: number = 0;

  render(): VNode {
    const matches = this.router.matches;
    const match = matches[this.depth];

    if (!match) return null;

    const RouteComponent = match.route.component;

    if (this.router.state.status === 'pending') {
      const PendingComponent = match.route.pendingComponent;
      if (PendingComponent) {
        return <PendingComponent />;
      }
    }

    if (this.router.state.status === 'error') {
      const ErrorComponent = match.route.errorComponent;
      if (ErrorComponent) {
        return <ErrorComponent error={this.router.state.error} />;
      }
    }

    return RouteComponent ? (
      <RouteComponent
        params={match.params}
        search={match.search}
        loaderData={match.loaderData}
      >
        {/* 중첩 라우트 */}
        {matches.length > this.depth + 1 && (
          <RouterOutlet depth={this.depth + 1} />
        )}
      </RouteComponent>
    ) : null;
  }
}

// ============================================
// Link 컴포넌트
// ============================================

@Component({
  selector: 'nova-link',
  resumable: true
})
class Link extends Component<LinkProps> {
  private router = this.inject(Router);

  @Input({ required: true })
  to!: string;

  @Input()
  replace?: boolean;

  handleClick = (e: MouseEvent) => {
    e.preventDefault();
    this.router.navigate(this.to, { replace: this.replace });
  };

  render(): VNode {
    return (
      <a
        href={this.to}
        onClick={this.handleClick}
        class={this.isActive ? 'active' : ''}
      >
        <slot />
      </a>
    );
  }

  get isActive(): boolean {
    return this.router.state.location.pathname.startsWith(this.to);
  }
}
```

---

## 6. Resumable Hydration

### 6.1 핵심 개념

Qwik의 재개 가능한 하이드레이션을 구현합니다.

**참조**: `qwik/packages/qwik/src/core/container/`

```
┌─────────────────────────────────────────────────────────────────┐
│                    Traditional Hydration                         │
├─────────────────────────────────────────────────────────────────┤
│  Server: Render → HTML                                          │
│  Client: Download JS → Parse → Execute → Re-render → Attach     │
│                        ↑                                        │
│                   Hydration Gap (느림)                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Resumable (Nova)                              │
├─────────────────────────────────────────────────────────────────┤
│  Server: Render → HTML + Serialized State                       │
│  Client: Resume (즉시 인터랙티브) → Lazy Load on Event          │
│          ↑                                                      │
│     No Re-rendering!                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 QRL (Qwik Resource Locator) 시스템

```typescript
// ============================================
// QRL 정의
// ============================================

interface QRL<T = any> {
  // 청크 정보
  $chunk$: string | null;      // 'chunk-abc.js'
  $symbol$: string;            // 'onClick_abc'
  $hash$: string;              // 프리로드 힌트용

  // 캡처된 변수
  $capture$: string[] | null;      // 직렬화된 ID들
  $captureRef$: unknown[] | null;  // 실제 값들

  // 해결된 함수
  resolved: T | undefined;

  // 메서드
  resolve(): Promise<T>;
  invoke(...args: any[]): Promise<any>;
}

// ============================================
// QRL 생성 (빌드 타임)
// ============================================

function qrl<T>(
  chunkLoader: () => Promise<any>,
  symbol: string,
  capture?: unknown[]
): QRL<T> {
  const qrl: QRL<T> = {
    $chunk$: extractChunkName(chunkLoader),
    $symbol$: symbol,
    $hash$: generateHash(symbol),
    $capture$: null,
    $captureRef$: capture || null,
    resolved: undefined,

    async resolve(): Promise<T> {
      if (this.resolved) return this.resolved;

      const module = await chunkLoader();
      this.resolved = module[symbol];
      return this.resolved;
    },

    async invoke(...args: any[]): Promise<any> {
      const fn = await this.resolve();

      // 캡처된 변수를 컨텍스트에 바인딩
      if (this.$captureRef$) {
        return fn.call({ captured: this.$captureRef$ }, ...args);
      }

      return fn(...args);
    }
  };

  return qrl;
}

// ============================================
// QRL 직렬화
// ============================================

function serializeQRL(qrl: QRL, getObjId: (obj: any) => string): string {
  let result = '';

  if (qrl.$chunk$) {
    result += qrl.$chunk$;
  }

  result += '#' + qrl.$symbol$;

  // 캡처된 변수들의 ID
  if (qrl.$captureRef$?.length) {
    result += ' ' + qrl.$captureRef$.map(getObjId).join(' ');
  }

  return result;
}

// 예: "./chunk-abc.js#onClick_123 0 1 2"
//      청크          심볼       캡처된 객체 ID들

function parseQRL(str: string, getObject: (id: string) => any): QRL {
  const [chunkSymbol, ...captureIds] = str.split(' ');
  const [chunk, symbol] = chunkSymbol.split('#');

  return {
    $chunk$: chunk || null,
    $symbol$: symbol,
    $hash$: generateHash(symbol),
    $capture$: captureIds.length ? captureIds : null,
    $captureRef$: captureIds.length ? captureIds.map(getObject) : null,
    resolved: undefined,
    resolve: () => import(chunk).then(m => m[symbol]),
    invoke: async (...args) => {
      const fn = await import(chunk).then(m => m[symbol]);
      return fn(...args);
    }
  };
}
```

### 6.3 Container Pause (서버)

```typescript
// ============================================
// 컨테이너 일시정지 (서버 렌더링 후)
// ============================================

interface SnapshotState {
  // 컴포넌트 메타데이터
  ctx: Record<string, SnapshotMeta>;

  // 객체 배열 (모든 직렬화된 값)
  objs: any[];

  // 구독 정보
  subs: string[][];

  // 참조 맵
  refs: Record<string, string>;
}

async function pauseContainer(container: Element): Promise<SnapshotState> {
  const collector = createCollector();

  // 1. 모든 컴포넌트 컨텍스트 수집
  const contexts = collectContexts(container);

  for (const ctx of contexts) {
    // 상태 수집
    if (ctx.state) {
      collector.collect(ctx.state);
    }

    // 이벤트 핸들러 QRL 수집
    for (const listener of ctx.listeners) {
      collector.collect(listener.qrl);
    }

    // Signal 구독 수집
    for (const signal of ctx.signals) {
      collector.collectSubscriptions(signal);
    }
  }

  // 2. 객체 직렬화
  const objs: any[] = [];
  const objToId = new Map<any, string>();

  for (const obj of collector.objects) {
    const id = objs.length.toString(36);  // base-36 인코딩
    objToId.set(obj, id);
    objs.push(serializeObject(obj, objToId));
  }

  // 3. 구독 직렬화
  const subs: string[][] = [];
  for (const [obj, subscriptions] of collector.subscriptions) {
    const objId = objToId.get(obj)!;
    subs[parseInt(objId, 36)] = subscriptions.map(sub =>
      serializeSubscription(sub, objToId)
    );
  }

  // 4. 컨텍스트 메타데이터
  const ctx: Record<string, SnapshotMeta> = {};
  for (const context of contexts) {
    ctx[context.id] = {
      w: context.tasks?.map(t => objToId.get(t)).join(' '),
      s: context.seq?.map(s => objToId.get(s)).join(' '),
      h: context.host ? objToId.get(context.host) : undefined,
      c: context.contexts?.map(c => objToId.get(c)).join(' ')
    };
  }

  return { ctx, objs, subs, refs: {} };
}

// HTML에 삽입
function injectPausedState(container: Element, state: SnapshotState): void {
  // 컨테이너 마킹
  container.setAttribute('q:container', 'paused');

  // 상태 JSON 삽입
  const script = document.createElement('script');
  script.type = 'qwik/json';
  script.textContent = JSON.stringify(state);
  container.appendChild(script);

  // 이벤트 핸들러 QRL을 DOM 속성으로
  for (const el of container.querySelectorAll('[q\\:id]')) {
    const ctx = getContext(el);
    for (const [event, qrl] of ctx.listeners) {
      el.setAttribute(`on:${event}`, serializeQRL(qrl, id => state.objToId.get(id)));
    }
  }
}
```

### 6.4 Container Resume (클라이언트)

```typescript
// ============================================
// 컨테이너 재개 (클라이언트)
// ============================================

function resumeContainer(container: Element): void {
  // 이미 재개됨?
  if (container.getAttribute('q:container') === 'resumed') {
    return;
  }

  // 1. 직렬화된 상태 추출
  const script = container.querySelector('script[type="qwik/json"]');
  if (!script) return;

  const state: SnapshotState = JSON.parse(script.textContent!);

  // 2. 객체 역직렬화
  const objs: any[] = new Array(state.objs.length);

  // Phase 1: 빈 객체 생성
  for (let i = 0; i < state.objs.length; i++) {
    objs[i] = prepareObject(state.objs[i]);
  }

  const getObject = (id: string) => objs[parseInt(id, 36)];

  // Phase 2: 참조 연결
  for (let i = 0; i < state.objs.length; i++) {
    fillObject(objs[i], state.objs[i], getObject);
  }

  // 3. 구독 복원
  for (let i = 0; i < state.subs.length; i++) {
    if (state.subs[i]) {
      const obj = objs[i];
      const subs = state.subs[i].map(s => parseSubscription(s, getObject));
      restoreSubscriptions(obj, subs);
    }
  }

  // 4. 컨텍스트 복원
  for (const [id, meta] of Object.entries(state.ctx)) {
    const el = container.querySelector(`[q\\:id="${id}"]`);
    if (!el) continue;

    const ctx = getOrCreateContext(el);

    if (meta.s) {
      ctx.seq = meta.s.split(' ').map(getObject);
    }
    if (meta.h) {
      ctx.host = getObject(meta.h);
    }
  }

  // 5. 완료 마킹
  container.setAttribute('q:container', 'resumed');
}
```

### 6.5 지연 이벤트 핸들링

```typescript
// ============================================
// 이벤트 위임 (Lazy Loading)
// ============================================

function setupEventDelegation(container: Element): void {
  // 모든 이벤트를 컨테이너에서 위임 처리
  const events = ['click', 'input', 'change', 'submit', 'keydown', 'keyup'];

  for (const eventName of events) {
    container.addEventListener(eventName, async (event) => {
      // 이벤트 타겟에서 핸들러 찾기
      let target = event.target as Element | null;

      while (target && target !== container) {
        const qrlStr = target.getAttribute(`on:${eventName}`);

        if (qrlStr) {
          // QRL 파싱
          const qrl = parseQRL(qrlStr, getObject);

          // 청크 로드 & 실행
          await qrl.invoke(event);

          if (event.defaultPrevented) break;
        }

        target = target.parentElement;
      }
    });
  }
}

// ============================================
// 프리로드 전략
// ============================================

interface PreloadConfig {
  // 최대 동시 프리로드
  maxIdlePreloads: number;

  // 프리로드 확률 임계값
  probabilityThreshold: number;
}

class PreloadQueue {
  private queue: BundleImport[] = [];
  private loading = 0;

  constructor(private config: PreloadConfig) {}

  // 번들 프리로드 요청
  preload(chunk: string, probability: number): void {
    if (probability < this.config.probabilityThreshold) return;

    this.queue.push({
      name: chunk,
      probability,
      state: 'queued'
    });

    this.processQueue();
  }

  private processQueue(): void {
    // 확률순 정렬
    this.queue.sort((a, b) => b.probability - a.probability);

    while (
      this.queue.length > 0 &&
      this.loading < this.config.maxIdlePreloads
    ) {
      const bundle = this.queue.shift()!;
      this.loadBundle(bundle);
    }
  }

  private loadBundle(bundle: BundleImport): void {
    this.loading++;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = bundle.name;

    link.onload = link.onerror = () => {
      this.loading--;
      this.processQueue();
    };

    document.head.appendChild(link);
  }
}
```

---

## 7. 직렬화 시스템

### 7.1 플러그형 직렬화

```typescript
// ============================================
// Serializer 인터페이스
// ============================================

interface Serializer<T> {
  // 고유 접두사 (1바이트)
  $prefix$: string;

  // 타입 체크
  $test$: (value: unknown) => value is T;

  // 의존성 수집 (선택)
  $collect$?: (value: T, collector: Collector) => void;

  // 문자열로 직렬화
  $serialize$: (value: T, getObjId: GetObjId) => string;

  // 빈 객체 생성 (Phase 1)
  $prepare$: (data: string, container: ContainerState) => T;

  // 참조 연결 (Phase 2)
  $fill$?: (value: T, getObject: GetObject, data: string) => void;

  // 구독 복원 (Phase 3)
  $subs$?: (value: T, subs: Subscription[]) => void;
}

// ============================================
// 기본 직렬화기들
// ============================================

const serializers: Serializer<any>[] = [
  // QRL
  {
    $prefix$: '\u0002',
    $test$: isQRL,
    $collect$: (qrl, collector) => {
      if (qrl.$captureRef$) {
        qrl.$captureRef$.forEach(v => collector.collect(v));
      }
    },
    $serialize$: (qrl, getObjId) => serializeQRL(qrl, getObjId),
    $prepare$: (data, container) => parseQRL(data, () => undefined),
    $fill$: (qrl, getObject, data) => {
      const parsed = parseQRL(data, getObject);
      qrl.$captureRef$ = parsed.$captureRef$;
    }
  },

  // Signal
  {
    $prefix$: '\u0012',
    $test$: isSignal,
    $collect$: (signal, collector) => {
      collector.collect(signal.peek());
      collector.collectSubscriptions(signal);
    },
    $serialize$: (signal, getObjId) => getObjId(signal.peek()),
    $prepare$: () => signal(undefined),
    $fill$: (signal, getObject, data) => {
      signal._value = getObject(data);
    },
    $subs$: (signal, subs) => {
      restoreSignalSubscriptions(signal, subs);
    }
  },

  // Component 상태
  {
    $prefix$: '\u0020',
    $test$: isComponentState,
    $collect$: (state, collector) => {
      Object.values(state).forEach(v => collector.collect(v));
    },
    $serialize$: (state, getObjId) => {
      return JSON.stringify(
        Object.fromEntries(
          Object.entries(state).map(([k, v]) => [k, getObjId(v)])
        )
      );
    },
    $prepare$: () => ({}),
    $fill$: (state, getObject, data) => {
      const parsed = JSON.parse(data);
      for (const [k, v] of Object.entries(parsed)) {
        state[k] = getObject(v as string);
      }
    }
  },

  // Date
  {
    $prefix$: '\u0003',
    $test$: (v): v is Date => v instanceof Date,
    $serialize$: (date) => date.toISOString(),
    $prepare$: (data) => new Date(data)
  },

  // Map
  {
    $prefix$: '\u0004',
    $test$: (v): v is Map<any, any> => v instanceof Map,
    $collect$: (map, collector) => {
      map.forEach((v, k) => {
        collector.collect(k);
        collector.collect(v);
      });
    },
    $serialize$: (map, getObjId) => {
      const entries = Array.from(map.entries())
        .map(([k, v]) => `${getObjId(k)} ${getObjId(v)}`);
      return entries.join('\n');
    },
    $prepare$: () => new Map(),
    $fill$: (map, getObject, data) => {
      data.split('\n').forEach(line => {
        const [k, v] = line.split(' ');
        map.set(getObject(k), getObject(v));
      });
    }
  },

  // Set
  {
    $prefix$: '\u0005',
    $test$: (v): v is Set<any> => v instanceof Set,
    $collect$: (set, collector) => {
      set.forEach(v => collector.collect(v));
    },
    $serialize$: (set, getObjId) => {
      return Array.from(set).map(getObjId).join(' ');
    },
    $prepare$: () => new Set(),
    $fill$: (set, getObject, data) => {
      data.split(' ').forEach(id => set.add(getObject(id)));
    }
  }
];
```

---

## 8. 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Nova Framework                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Application Layer                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   @Module({                     @Component({                        │   │
│  │     imports: [RouterModule],      selector: 'app-root',             │   │
│  │     declarations: [AppComp],      template: '...'                   │   │
│  │     providers: [AppService]     })                                  │   │
│  │   })                            class AppComponent                   │   │
│  │   class AppModule                 extends Component {}              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Core Layer                                   │   │
│  ├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤   │
│  │   Signal    │    DI       │   Router    │  Component  │   QRL       │   │
│  │   System    │   System    │   System    │   System    │   System    │   │
│  ├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤   │
│  │ • signal()  │ • Injector  │ • Router    │ • Component │ • qrl()     │   │
│  │ • computed()│ • Provider  │ • Route     │ • @Input    │ • serialize │   │
│  │ • effect()  │ • @Inject   │ • Link      │ • @Output   │ • resolve   │   │
│  │ • batch()   │ • Module    │ • Outlet    │ • Lifecycle │ • preload   │   │
│  └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Resumable Layer                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   Server                              Client                        │   │
│  │   ┌─────────────────┐                ┌─────────────────┐           │   │
│  │   │  renderToHTML() │                │  resume()       │           │   │
│  │   │       ↓         │                │       ↓         │           │   │
│  │   │  pauseContainer │  ──────────▶   │  parseState()   │           │   │
│  │   │       ↓         │   HTML +       │       ↓         │           │   │
│  │   │  serializeState │   JSON         │  restoreObjs()  │           │   │
│  │   │       ↓         │                │       ↓         │           │   │
│  │   │  injectQRLs     │                │  setupEvents()  │           │   │
│  │   └─────────────────┘                └─────────────────┘           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Platform Layer                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   Browser Platform              Server Platform                     │   │
│  │   • DOM manipulation            • Node.js runtime                   │   │
│  │   • Event handling              • Stream rendering                  │   │
│  │   • Dynamic import              • Static generation                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. 파일 구조

```
nova/
├── packages/
│   ├── core/                      # 핵심 패키지
│   │   ├── src/
│   │   │   ├── signal/           # 반응형 시스템
│   │   │   │   ├── signal.ts
│   │   │   │   ├── computed.ts
│   │   │   │   ├── effect.ts
│   │   │   │   └── batch.ts
│   │   │   │
│   │   │   ├── di/               # 의존성 주입
│   │   │   │   ├── injector.ts
│   │   │   │   ├── provider.ts
│   │   │   │   ├── token.ts
│   │   │   │   └── decorators.ts
│   │   │   │
│   │   │   ├── component/        # 컴포넌트 시스템
│   │   │   │   ├── component.ts
│   │   │   │   ├── decorators.ts
│   │   │   │   ├── lifecycle.ts
│   │   │   │   └── render.ts
│   │   │   │
│   │   │   ├── module/           # 모듈 시스템
│   │   │   │   ├── module.ts
│   │   │   │   ├── scope.ts
│   │   │   │   └── bootstrap.ts
│   │   │   │
│   │   │   ├── qrl/              # QRL 시스템
│   │   │   │   ├── qrl.ts
│   │   │   │   ├── serialize.ts
│   │   │   │   └── preload.ts
│   │   │   │
│   │   │   ├── container/        # Resumable 컨테이너
│   │   │   │   ├── pause.ts
│   │   │   │   ├── resume.ts
│   │   │   │   ├── serializers.ts
│   │   │   │   └── state.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── router/                    # 라우터 패키지
│   │   ├── src/
│   │   │   ├── router.ts
│   │   │   ├── route.ts
│   │   │   ├── match.ts
│   │   │   ├── link.ts
│   │   │   ├── outlet.ts
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── platform-browser/          # 브라우저 플랫폼
│   │   ├── src/
│   │   │   ├── bootstrap.ts
│   │   │   ├── dom.ts
│   │   │   └── events.ts
│   │   │
│   │   └── package.json
│   │
│   ├── platform-server/           # 서버 플랫폼
│   │   ├── src/
│   │   │   ├── render.ts
│   │   │   ├── stream.ts
│   │   │   └── static.ts
│   │   │
│   │   └── package.json
│   │
│   └── compiler/                  # 빌드 도구
│       ├── src/
│       │   ├── transform.ts       # QRL 변환
│       │   ├── optimizer.ts       # 코드 분할
│       │   └── plugin.ts          # Vite/Rollup 플러그인
│       │
│       └── package.json
│
├── docs/
│   └── ARCHITECTURE.md            # 이 문서
│
└── examples/
    └── counter/                   # 예제 앱
```

---

## 10. 참조 소스 코드

| 기능 | 참조 프로젝트 | 핵심 파일 |
|------|--------------|-----------|
| Signal | Preact Signals | `packages/signals/src/index.ts` |
| DI/Module | Angular | `packages/core/src/di/r3_injector.ts` |
| Router | TanStack Router | `packages/router-core/src/router.ts` |
| Resumable | Qwik | `packages/qwik/src/core/container/pause.ts` |
| QRL | Qwik | `packages/qwik/src/core/qrl/qrl-class.ts` |

---

## 11. 구현 우선순위

### Phase 1: 핵심 반응형 시스템
1. Signal 구현
2. Computed 구현
3. Effect 구현
4. Batch 처리

### Phase 2: 컴포넌트 시스템
1. Component 기본 클래스
2. 데코레이터 시스템
3. 라이프사이클 훅
4. JSX 렌더링

### Phase 3: 모듈/DI 시스템
1. Injector 구현
2. Provider 처리
3. Module 데코레이터
4. Scope 계산

### Phase 4: 라우터
1. Route 정의
2. Router 코어
3. 매칭 알고리즘
4. Link/Outlet 컴포넌트

### Phase 5: Resumable
1. QRL 시스템
2. Serializers
3. Pause/Resume
4. Event delegation

### Phase 6: 빌드 도구
1. QRL 변환 플러그인
2. 코드 분할 최적화
3. 번들 그래프 생성

---

## 12. 결론

Nova Framework는 현대 프론트엔드의 최고 기술들을 통합합니다:

- **Preact Signals**의 세밀한 반응성으로 효율적 업데이트
- **Angular**의 강력한 DI/모듈 시스템으로 확장 가능한 아키텍처
- **TanStack Router**의 타입 안전 라우팅으로 개발자 경험 향상
- **Qwik**의 재개 가능한 하이드레이션으로 즉각적인 인터랙티비티
- **클래스 컴포넌트**로 익숙한 OOP 패턴 지원

이 조합은 대규모 애플리케이션에서 성능과 개발자 경험 모두를 만족시키는 프레임워크를 목표로 합니다.
