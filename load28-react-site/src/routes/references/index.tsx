import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getReferenceGroups } from '~/lib/content'

const loadGroups = createServerFn({ method: 'GET' }).handler(async () => {
  return getReferenceGroups()
})

export const Route = createFileRoute('/references/')({
  component: ReferencesIndexPage,
  loader: () => loadGroups(),
})

function ReferencesIndexPage() {
  const groups = Route.useLoaderData()

  return (
    <div>
      <div className="page-hero">
        <h1>레퍼런스 코드</h1>
        <p className="subtitle">카테고리별 레퍼런스 코드 모음입니다. 각 레퍼런스는 규칙 검증을 통과한 패턴 코드입니다.</p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.tag} id={group.tag}>
            <h2 className="ref-group-title">{group.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.references.map((ref) => (
                <Link key={ref.slug} to={`/references/${ref.slug}`} className="ref-card">
                  <div className="title">{ref.title}</div>
                  <div className="tags">
                    {ref.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="ref-tag">{tag}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
