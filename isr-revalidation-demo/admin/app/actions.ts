'use server'

type RevalidateInput = { path?: string; tag?: string }

export async function triggerRevalidate(input: RevalidateInput) {
  const url = `${process.env.SITE_URL}/api/revalidate`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': process.env.REVALIDATE_SECRET!,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, status: res.status, data }
  }
  return { ok: true, status: res.status, data }
}
