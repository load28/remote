# React 테스트 가이드

이 문서는 React 애플리케이션의 테스트 전략과 구현 방법을 다룹니다.

## 목차

| 순서 | 문서 | 설명 |
|------|------|------|
| 1 | [개요](./01-overview.md) | 테스트 전략, 도구 선정, 테스트 피라미드 |
| 2 | [환경 설정](./02-setup.md) | Vitest, Testing Library 설정 |
| 3 | [단위 테스트](./03-unit-testing.md) | 컴포넌트, 훅, 유틸리티 테스트 |
| 4 | [통합 테스트](./04-integration-testing.md) | MSW를 활용한 API 통합 테스트 |
| 5 | [테스트 패턴](./05-testing-patterns.md) | FSD 아키텍처 기반 테스트 패턴 |
| 6 | [엔터프라이즈 사례](./06-enterprise-practices.md) | Netflix, Airbnb, Kent C. Dodds의 실제 전략 |

## 기술 스택

| 도구 | 용도 | 선정 이유 |
|------|------|----------|
| **Vitest** | 테스트 러너 | 빠른 속도, ESM 지원, Jest 호환 |
| **React Testing Library** | 컴포넌트 테스트 | 사용자 관점 테스트, 접근성 중심 |
| **MSW** | API 모킹 | 네트워크 레벨 모킹, 실제 요청과 동일한 동작 |
| **@testing-library/user-event** | 사용자 이벤트 | 실제 사용자 상호작용 시뮬레이션 |

## 빠른 시작

```bash
# 패키지 설치
pnpm add -D vitest @vitejs/plugin-react jsdom
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 테스트 실행
pnpm test

# 커버리지 확인
pnpm test:coverage
```

## 테스트 파일 위치

FSD 아키텍처에서는 테스트 파일을 소스 파일 옆에 배치합니다:

```
src/
├── entities/
│   └── Card/
│       └── ui/
│           ├── CardItem.tsx
│           └── CardItem.test.tsx  # 컴포넌트 옆에 테스트
├── features/
│   └── create-card/
│       ├── model/
│       │   ├── useCreateCard.ts
│       │   └── useCreateCard.test.ts
│       └── ui/
│           ├── CreateCardForm.tsx
│           └── CreateCardForm.test.tsx
└── shared/
    └── test-utils/               # 테스트 유틸리티
        ├── index.ts
        ├── render.tsx
        └── mocks.ts
```

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library 공식 문서](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 공식 문서](https://mswjs.io/)
- [Testing Library 가이드라인](https://testing-library.com/docs/guiding-principles)
