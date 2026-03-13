import { createFileRoute, Link } from '@tanstack/react-router'

const CATEGORIES = [
  { slug: 'architecture', prefix: 'A', label: '아키텍처', count: 10, desc: '의존성 방향, 레이어 분리, 모듈 경계' },
  { slug: 'naming-conventions', prefix: 'N', label: '네이밍', count: 8, desc: 'PascalCase, camelCase, Boolean 접두사' },
  { slug: 'component-patterns', prefix: 'C', label: '컴포넌트', count: 15, desc: 'SRP, 합성, 훅 규칙, key 활용' },
  { slug: 'state-and-data', prefix: 'S', label: '상태 & 데이터', count: 16, desc: '함수형 setState, Context, 비동기' },
  { slug: 'performance', prefix: 'P', label: '성능', count: 14, desc: '가상화, dynamic import, 워터폴' },
  { slug: 'testing-a11y', prefix: 'T', label: '테스트 & 타입', count: 15, desc: 'Testing Library, MSW, strict TS' },
]

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <div className="page-hero">
        <h1>React Coding Standards</h1>
        <p className="subtitle">
          React/TypeScript 프로젝트를 위한 코딩 표준 문서입니다.
          기억에 의존하지 않고, 검증을 강제합니다.
        </p>
        <div className="stats">
          <div className="stat">
            <strong>78</strong> 규칙
          </div>
          <div className="stat">
            <strong>6</strong> 카테고리
          </div>
          <div className="stat">
            <strong>28</strong> 레퍼런스
          </div>
        </div>
      </div>

      <div className="category-grid">
        {CATEGORIES.map((cat) => (
          <Link key={cat.slug} to={`/rules/${cat.slug}`} className="category-card">
            <div className="prefix">{cat.prefix}</div>
            <div className="title">{cat.label}</div>
            <div className="desc">{cat.desc}</div>
            <div className="count">{cat.count}개 규칙</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
