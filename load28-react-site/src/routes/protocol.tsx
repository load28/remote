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
    <div>
      <div className="page-hero">
        <h1>3-Phase 프로토콜</h1>
        <p className="subtitle">
          레퍼런스 참조 → 최종 검증 → 보고. 기억에 의존하지 않는 코드 작성 프로세스입니다.
        </p>
      </div>
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
