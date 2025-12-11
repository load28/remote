# Feature-Sliced Design (FSD) Architecture Guide

> Next.js App Router 프로젝트를 위한 FSD 아키텍처 가이드

## 목차

1. [개요](./01-overview.md) - FSD 아키텍처 소개 및 핵심 개념
2. [계층 (Layers)](./02-layers.md) - 각 계층별 상세 설명 및 분류 기준
3. [슬라이스와 세그먼트](./03-slices-segments.md) - Slices와 Segments 구조
4. [Public API](./04-public-api.md) - 모듈 공개 인터페이스 설계
5. [Next.js App Router 통합](./05-nextjs-integration.md) - Next.js 프로젝트 적용 가이드
6. [실전 예시](./06-examples.md) - 코드 예시 및 베스트 프랙티스

## 빠른 시작

### 프로젝트 구조 (Next.js App Router + FSD)

```
my-nextjs-project/
├── app/                    # Next.js App Router (라우팅 전용)
│   ├── layout.tsx
│   ├── page.tsx
│   └── (routes)/
├── pages/                  # 빈 폴더 (필수 - 빌드 에러 방지)
│   └── README.md
├── src/
│   ├── app/               # FSD app 계층
│   │   ├── providers/
│   │   ├── styles/
│   │   └── index.ts
│   ├── widgets/           # 위젯 계층
│   ├── features/          # 기능 계층
│   ├── entities/          # 엔티티 계층
│   └── shared/            # 공유 계층
├── tsconfig.json
└── package.json
```

### 핵심 원칙

1. **단방향 의존성**: 상위 계층은 하위 계층만 참조 가능
2. **슬라이스 격리**: 같은 계층의 슬라이스끼리는 서로 참조 불가
3. **Public API**: 모든 모듈은 index.ts를 통해서만 외부에 노출

## 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [FSD GitHub](https://github.com/feature-sliced)
- [Next.js와 FSD 통합 가이드](https://feature-sliced.design/docs/guides/tech/with-nextjs)

---

*이 문서는 팀 내 프론트엔드 아키텍처 표준으로 사용됩니다.*
