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
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">React Coding Standards</h1>
        <p className="mt-2 text-gray-600">
          78개 규칙 · 6개 카테고리 · 28개 레퍼런스 코드
        </p>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/rules/${cat.slug}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
          >
            <div className="text-xs font-mono text-blue-600">{cat.prefix}</div>
            <h3 className="font-semibold mt-1">{cat.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
            <p className="text-xs text-gray-400 mt-2">{cat.count}개 규칙</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
