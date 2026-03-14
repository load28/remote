import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAllRules } from '~/lib/content'

const loadAllRules = createServerFn({ method: 'GET' }).handler(async () => {
  return getAllRules()
})

export const Route = createFileRoute('/rules/')({
  component: RulesIndexPage,
  loader: () => loadAllRules(),
})

function RulesIndexPage() {
  const rules = Route.useLoaderData()
  const [query, setQuery] = useState('')

  const filtered = query
    ? rules.filter((r) =>
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.title.includes(query) ||
        r.why.includes(query)
      )
    : rules

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">전체 규칙</h1>
      <input
        type="search"
        placeholder="규칙 ID 또는 키워드 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
      <div className="space-y-2">
        {filtered.map((rule) => (
          <Link
            key={rule.id}
            to={`/rules/${rule.category}`}
            hash={rule.anchor}
            className="block p-3 border border-gray-200 rounded hover:border-blue-300"
          >
            <span className="font-mono text-blue-600 text-sm">{rule.id}</span>
            <span className="ml-2 font-medium">{rule.title}</span>
            <span className="ml-2 text-xs text-gray-500">{rule.classification}</span>
          </Link>
        ))}
      </div>
      <p className="text-sm text-gray-500">{filtered.length}개 규칙</p>
    </div>
  )
}
