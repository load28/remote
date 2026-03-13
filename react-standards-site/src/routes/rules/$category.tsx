import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRuleCategory } from '~/lib/content'

const loadCategory = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getRuleCategory(slug)
  })

export const Route = createFileRoute('/rules/$category')({
  component: CategoryPage,
  loader: ({ params }) => loadCategory({ data: params.category }),
})

function CategoryPage() {
  const category = Route.useLoaderData()
  if (!category) return <div>카테고리를 찾을 수 없습니다.</div>

  return (
    <div>
      <div className="page-hero">
        <h1>{category.label}</h1>
        <p className="subtitle">{category.rules.length}개 규칙</p>
      </div>

      <nav className="rule-anchor-nav">
        {category.rules.map((rule) => (
          <a key={rule.id} href={`#${rule.anchor}`} className="rule-anchor-link">
            {rule.id}
          </a>
        ))}
      </nav>

      <div className="space-y-3">
        {category.rules.map((rule) => (
          <article key={rule.id} id={rule.anchor} className="rule-card">
            <div className="rule-header">
              <span className="rule-id">{rule.id}</span>
              <span className="rule-title">{rule.title}</span>
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: rule.contentHtml }}
            />
          </article>
        ))}
      </div>
    </div>
  )
}
