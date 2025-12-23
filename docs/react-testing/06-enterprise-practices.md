# 6. 엔터프라이즈 테스트 사례

## 실제 기업들의 테스트 전략

### Airbnb의 React Testing Library 마이그레이션

Airbnb는 2015년부터 사용하던 **Enzyme**에서 **React Testing Library(RTL)**로 전환했습니다.

#### 마이그레이션 배경

| 문제점 | 해결책 |
|--------|--------|
| Enzyme이 React 18 미지원 | RTL로 전환 |
| 구현 세부사항 테스트 | 사용자 관점 테스트로 전환 |
| 3,500개 테스트 파일 | LLM 기반 자동화 마이그레이션 |

#### Airbnb의 테스트 원칙

```tsx
// ❌ Enzyme 스타일 (구현 세부사항)
wrapper.setState({ isLoading: false });
expect(wrapper.find('.loader')).toHaveLength(0);

// ✅ RTL 스타일 (사용자 관점)
await waitFor(() => {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

**핵심 인사이트:**
- 테스트는 "컴포넌트가 어떻게 동작하는가"가 아니라 "사용자가 무엇을 보는가"를 검증
- 내부 상태 접근 대신 렌더링 결과 검증
- 1.5년 예상 작업을 6주 만에 완료 (LLM 활용)

---

### Netflix의 SafeTest 접근법

Netflix는 **SafeTest**라는 독자적인 테스트 프레임워크를 개발했습니다.

#### SafeTest의 특징

```
┌─────────────────────────────────────────────────────────┐
│                    SafeTest 아키텍처                     │
├─────────────────────────────────────────────────────────┤
│  Test Runner (Jest/Vitest)                              │
│       ↓                                                  │
│  UI Framework (React/Vue/Svelte/Angular)                │
│       ↓                                                  │
│  Browser Runner (Playwright)                            │
│       ↓                                                  │
│  Dependency Injection                                   │
└─────────────────────────────────────────────────────────┘
```

#### SafeTest vs 기존 접근법

| 항목 | Unit Test | E2E Test | SafeTest |
|------|-----------|----------|----------|
| 실제 브라우저 | ❌ | ✅ | ✅ |
| 컴포넌트 격리 | ✅ | ❌ | ✅ |
| 의존성 모킹 | ✅ | ❌ | ✅ |
| 스크린샷 | ❌ | ✅ | ✅ |
| 속도 | 빠름 | 느림 | 중간 |

#### SafeTest 사용 예시

```tsx
// Netflix SafeTest 스타일
import { describe, it, expect } from 'safetest/jest';
import { render } from 'safetest/react';

describe('LoginForm', () => {
  it('로그인 성공 시 대시보드로 이동', async () => {
    const { page } = await render(<App />, {
      // 의존성 주입으로 API 모킹
      overrides: {
        authService: {
          login: async () => ({ success: true }),
        },
      },
    });

    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 실제 브라우저에서 실행
    await expect(page).toHaveURL('/dashboard');

    // 스크린샷으로 시각적 검증
    await expect(page).toMatchScreenshot();
  });
});
```

---

### Kent C. Dodds의 Testing Trophy

#### Testing Pyramid vs Testing Trophy

```
Testing Pyramid (전통적)        Testing Trophy (현대적)

     /\                              ___
    /E2E\                           / E2E \
   /─────\                         /───────\
  / Integ \                       │         │
 /─────────\                      │ Integr- │  ← 가장 큰 비중
/   Unit    \                     │  ation  │
──────────────                    │         │
                                  └─────────┘
                                   │ Unit  │
                                   └───────┘
                                   │Static │
                                   └───────┘
```

#### Testing Trophy 원칙

1. **Static (정적 분석)**: TypeScript, ESLint
2. **Unit (단위)**: 복잡한 비즈니스 로직만
3. **Integration (통합)**: 가장 많은 투자 ⭐
4. **E2E**: 핵심 사용자 플로우만

```tsx
// Integration 테스트 예시 (Testing Trophy 스타일)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { App } from './App';

const server = setupServer(
  rest.get('/api/user', (req, res, ctx) => {
    return res(ctx.json({ name: 'John' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('사용자 프로필을 표시한다', async () => {
  render(<App />);

  await userEvent.click(screen.getByText('로그인'));
  await userEvent.type(screen.getByLabelText('이메일'), 'john@example.com');
  await userEvent.click(screen.getByText('제출'));

  await waitFor(() => {
    expect(screen.getByText('Welcome, John')).toBeInTheDocument();
  });
});
```

#### 2025년 Testing Trophy 재고

> "E2E 테스트가 통합 테스트만큼 저렴해지고 있다. Playwright와 Vitest Browser Mode의 발전으로 SSR 애플리케이션에서는 E2E 비중을 높이는 것을 고려할 수 있다."
> — Kent C. Dodds, 2024

---

## 엔터프라이즈 테스트 패턴

### 1. 테스트 데이터 팩토리

```tsx
// src/shared/test-utils/factories/index.ts
import { faker } from '@faker-js/faker';

export const factories = {
  user: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }),

  board: (overrides = {}) => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    ownerId: faker.string.uuid(),
    columns: [],
    ...overrides,
  }),

  card: (overrides = {}) => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(4),
    description: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    columnId: faker.string.uuid(),
    assigneeId: faker.string.uuid(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }),
};
```

### 2. 핸들러 시나리오 패턴

```tsx
// src/shared/test-utils/scenarios/auth-scenarios.ts
import { http, HttpResponse, delay } from 'msw';

export const authScenarios = {
  // 성공 시나리오
  loginSuccess: () => [
    http.post('/api/auth/login', () => {
      return HttpResponse.json({
        user: factories.user(),
        token: 'mock-token',
      });
    }),
  ],

  // 실패 시나리오
  loginFailure: (errorMessage = 'Invalid credentials') => [
    http.post('/api/auth/login', () => {
      return HttpResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }),
  ],

  // 네트워크 지연 시나리오
  loginSlow: (delayMs = 2000) => [
    http.post('/api/auth/login', async () => {
      await delay(delayMs);
      return HttpResponse.json({ user: factories.user() });
    }),
  ],

  // 세션 만료 시나리오
  sessionExpired: () => [
    http.get('/api/user', () => {
      return HttpResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }),
  ],
};
```

```tsx
// 테스트에서 사용
import { authScenarios } from '@/shared/test-utils/scenarios';

describe('LoginForm', () => {
  it('로그인 실패 시 에러 메시지를 표시한다', async () => {
    server.use(...authScenarios.loginFailure('잘못된 비밀번호'));

    render(<LoginForm />);
    // ...

    expect(screen.getByText('잘못된 비밀번호')).toBeInTheDocument();
  });

  it('느린 네트워크에서 로딩 상태를 표시한다', async () => {
    server.use(...authScenarios.loginSlow(3000));

    render(<LoginForm />);
    // ...

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### 3. Page Object Model (POM)

```tsx
// src/shared/test-utils/page-objects/LoginPage.ts
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export class LoginPage {
  private user = userEvent.setup();

  // Locators
  get emailInput() {
    return screen.getByLabelText('이메일');
  }

  get passwordInput() {
    return screen.getByLabelText('비밀번호');
  }

  get submitButton() {
    return screen.getByRole('button', { name: '로그인' });
  }

  get errorMessage() {
    return screen.queryByRole('alert');
  }

  // Actions
  async fillEmail(email: string) {
    await this.user.type(this.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.user.type(this.passwordInput, password);
  }

  async submit() {
    await this.user.click(this.submitButton);
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}
```

```tsx
// 테스트에서 사용
import { LoginPage } from '@/shared/test-utils/page-objects';

describe('LoginForm', () => {
  it('성공적으로 로그인한다', async () => {
    render(<LoginForm />);
    const loginPage = new LoginPage();

    await loginPage.login('user@example.com', 'password123');

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

### 4. 테스트 유틸리티 훅

```tsx
// src/shared/test-utils/hooks/useTestQueryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useTestQueryClient() {
  return useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
            staleTime: Infinity,
          },
          mutations: {
            retry: false,
          },
        },
        logger: {
          log: console.log,
          warn: console.warn,
          error: () => {}, // 에러 로그 억제
        },
      }),
    []
  );
}
```

---

## 권장 테스트 구조

```
src/
├── shared/
│   └── test-utils/
│       ├── index.ts              # 메인 export
│       ├── setup.ts              # 전역 설정
│       ├── render.tsx            # 커스텀 렌더
│       ├── msw-server.ts         # MSW 서버
│       ├── factories/            # 테스트 데이터 팩토리
│       │   ├── index.ts
│       │   ├── user.ts
│       │   ├── board.ts
│       │   └── card.ts
│       ├── scenarios/            # MSW 핸들러 시나리오
│       │   ├── auth.ts
│       │   ├── boards.ts
│       │   └── cards.ts
│       ├── page-objects/         # Page Object Model
│       │   ├── LoginPage.ts
│       │   └── BoardPage.ts
│       ├── matchers/             # 커스텀 매처
│       │   └── index.ts
│       └── mocks/                # 모듈 모킹
│           ├── next-navigation.ts
│           └── next-image.ts
```

---

## 핵심 요약

| 기업 | 접근법 | 핵심 인사이트 |
|------|--------|---------------|
| **Airbnb** | RTL 전환 | 사용자 관점 테스트, 구현 세부사항 배제 |
| **Netflix** | SafeTest | 단위 + E2E의 장점 결합, 의존성 주입 |
| **Kent C. Dodds** | Testing Trophy | 통합 테스트에 집중, 높은 ROI |

### 엔터프라이즈 테스트 체크리스트

- [ ] 사용자 관점으로 테스트 작성
- [ ] 통합 테스트에 가장 많은 투자
- [ ] MSW로 네트워크 레벨 모킹
- [ ] 테스트 데이터 팩토리 사용
- [ ] 시나리오 기반 핸들러 구성
- [ ] Page Object Model로 재사용성 확보

---

## 참고 자료

- [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests) - Kent C. Dodds
- [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) - Kent C. Dodds
- [Introducing SafeTest](https://netflixtechblog.com/introducing-safetest-a-novel-approach-to-front-end-testing-37f9f88c152d) - Netflix Tech Blog
- [Accelerating Large-Scale Test Migration with LLMs](https://medium.com/airbnb-engineering/accelerating-large-scale-test-migration-with-llms-9565c208023b) - Airbnb Engineering
