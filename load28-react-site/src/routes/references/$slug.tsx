import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getReference } from '~/lib/content'

const loadRef = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getReference(slug)
  })

export const Route = createFileRoute('/references/$slug')({
  component: ReferenceDetailPage,
  loader: ({ params }) => loadRef({ data: params.slug }),
})

function ReferenceDetailPage() {
  const ref = Route.useLoaderData()
  if (!ref) return <div>레퍼런스를 찾을 수 없습니다.</div>

  return (
    <div>
      <Link to="/references" className="back-link">
        ← 레퍼런스 목록
      </Link>

      <div className="page-hero">
        <h1>{ref.title}</h1>
        {ref.tags.length > 0 ? (
          <div className="detail-tags">
            {ref.tags.map((tag) => (
              <span key={tag} className="detail-tag">{tag}</span>
            ))}
          </div>
        ) : null}
        {ref.rules.length > 0 ? (
          <div className="detail-rules" style={{ marginTop: '0.75rem' }}>
            <span className="text-xs text-[var(--color-text-muted)]" style={{ marginRight: '0.375rem' }}>적용 규칙</span>
            {ref.rules.map((ruleId) => (
              <span key={ruleId} className="detail-rule-badge">{ruleId}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: ref.contentHtml }}
      />
    </div>
  )
}
