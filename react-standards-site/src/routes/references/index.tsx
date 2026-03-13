import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAllReferences } from '~/lib/content'

const loadRefs = createServerFn({ method: 'GET' }).handler(async () => {
  return getAllReferences()
})

export const Route = createFileRoute('/references/')({
  component: ReferencesPage,
  loader: () => loadRefs(),
})

function ReferencesPage() {
  const references = Route.useLoaderData()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = [...new Set(references.flatMap((r) => r.tags))].sort()

  const filtered = selectedTag
    ? references.filter((r) => r.tags.includes(selectedTag))
    : references

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">레퍼런스 코드</h1>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className={`text-xs px-2 py-1 rounded ${selectedTag === null ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          전체
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`text-xs px-2 py-1 rounded ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ref) => (
          <Link
            key={ref.slug}
            to={`/references/${ref.slug}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300"
          >
            <h3 className="font-medium text-sm">{ref.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {ref.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
            {ref.rules.length > 0 ? (
              <div className="mt-2 text-xs text-gray-500">규칙: {ref.rules.join(', ')}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
