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
    <div className="space-y-6">
      <div>
        <Link to="/references" className="text-sm text-blue-600 hover:underline">← 레퍼런스 목록</Link>
        <h1 className="text-2xl font-bold mt-2">{ref.title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {ref.tags.map((tag) => (
          <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      {ref.rules.length > 0 ? (
        <div className="text-sm">
          <span className="font-medium">적용 규칙: </span>
          {ref.rules.map((ruleId, i) => (
            <span key={ruleId}>
              {i > 0 ? ', ' : ''}
              <span className="font-mono text-blue-600">{ruleId}</span>
            </span>
          ))}
        </div>
      ) : null}
      <div
        className="prose prose-sm max-w-none [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded"
        dangerouslySetInnerHTML={{ __html: ref.contentHtml }}
      />
    </div>
  )
}
