import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getProtocolHtml } from '~/lib/content'

const loadProtocol = createServerFn({ method: 'GET' }).handler(async () => {
  return getProtocolHtml()
})

export const Route = createFileRoute('/protocol')({
  component: ProtocolPage,
  loader: () => loadProtocol(),
})

function ProtocolPage() {
  const html = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">3-Phase 프로토콜</h1>
      <div
        className="prose prose-sm max-w-none [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_table]:text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
