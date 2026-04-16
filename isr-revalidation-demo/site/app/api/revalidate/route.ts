import { revalidatePath, revalidateTag } from 'next/cache'
import { corsHeaders } from '@/lib/cors'

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  const secret = req.headers.get('x-revalidate-secret')
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  }

  const { path, tag } = (await req.json().catch(() => ({}))) as {
    path?: string
    tag?: string
  }

  if (!path && !tag) {
    return Response.json(
      { error: 'path 또는 tag 중 하나는 필요합니다' },
      { status: 400, headers },
    )
  }

  if (path) revalidatePath(path)
  if (tag) revalidateTag(tag)

  return Response.json(
    { revalidated: true, path: path ?? null, tag: tag ?? null, now: Date.now() },
    { headers },
  )
}
