export type Post = {
  id: string
  title: string
  body: string
}

const store = new Map<string, Post>([
  ['1', { id: '1', title: '첫 번째 글', body: 'ISR 캐시가 걸린 페이지입니다.' }],
  ['2', { id: '2', title: '두 번째 글', body: '관리자 앱에서 갱신을 트리거할 수 있습니다.' }],
])

export async function getPost(id: string): Promise<Post | null> {
  await new Promise((r) => setTimeout(r, 200))
  return store.get(id) ?? null
}

export async function getAllPosts(): Promise<Post[]> {
  await new Promise((r) => setTimeout(r, 200))
  return [...store.values()]
}
