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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{category.label}</h1>
        <p className="text-sm text-gray-500 mt-1">{category.rules.length}개 규칙</p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {category.rules.map((rule) => (
          <a
            key={rule.id}
            href={`#${rule.anchor}`}
            className="text-xs font-mono px-2 py-1 bg-gray-100 rounded hover:bg-blue-100"
          >
            {rule.id}
          </a>
        ))}
      </nav>

      {category.rules.map((rule) => (
        <article key={rule.id} id={rule.anchor} className="scroll-mt-20">
          <div
            className="prose prose-sm max-w-none [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_table]:text-sm"
            dangerouslySetInnerHTML={{ __html: rule.contentHtml }}
          />
          <hr className="my-6 border-gray-200" />
        </article>
      ))}
    </div>
  )
}
