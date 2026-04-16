'use client'

import { useState, useTransition } from 'react'
import { triggerRevalidate } from '@/app/actions'

type Result = { ok: boolean; status: number; data: unknown } | null

export default function RevalidateButtons({ postId }: { postId: string }) {
  const [result, setResult] = useState<Result>(null)
  const [isPending, startTransition] = useTransition()

  const callServerAction = (input: { path?: string; tag?: string }) => {
    startTransition(async () => {
      const r = await triggerRevalidate(input)
      setResult(r)
    })
  }

  const callDirectFetch = async () => {
    setResult(null)
    try {
      const res = await fetch('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': 'super-secret-token-change-me',
        },
        body: JSON.stringify({ path: `/posts/${postId}` }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, status: res.status, data })
    } catch (e) {
      setResult({ ok: false, status: 0, data: { error: String(e) } })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
      <section>
        <h3>✅ Server Action 방식 (권장)</h3>
        <p style={{ fontSize: 13, color: '#666' }}>
          admin 서버 → site의 Route Handler 호출. 시크릿이 브라우저에 노출되지 않고 CORS도 무관.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={isPending}
            onClick={() => callServerAction({ path: `/posts/${postId}` })}
          >
            이 글만 갱신 (revalidatePath)
          </button>
          <button
            disabled={isPending}
            onClick={() => callServerAction({ path: '/' })}
          >
            목록 페이지 갱신
          </button>
        </div>
      </section>

      <section>
        <h3>⚠️ 브라우저 직접 호출 (CORS 필요)</h3>
        <p style={{ fontSize: 13, color: '#666' }}>
          브라우저가 localhost:3001 → localhost:3000으로 직접 요청.
          site의 Route Handler에 CORS 허용이 설정되어 있어야 동작합니다.
          시크릿이 노출되므로 실제 운영에서는 비권장.
        </p>
        <button onClick={callDirectFetch}>브라우저에서 직접 호출</button>
      </section>

      {result && (
        <pre
          style={{
            background: result.ok ? '#e6ffed' : '#ffe6e6',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
