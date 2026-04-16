const ALLOWED_ORIGINS = [
  'http://localhost:3001',
]

export function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-revalidate-secret',
    'Vary': 'Origin',
  }
}
