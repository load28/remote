import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPost } from '@/lib/posts'

export const revalidate = 3600

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  const renderedAt = new Date().toISOString()

  return (
    <main>
      <Link href="/">← 목록</Link>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <hr />
      <p style={{ color: '#888', fontSize: 13 }}>
        이 값은 캐시 생성 시점에 고정됩니다: <strong>{renderedAt}</strong>
      </p>
      <p style={{ color: '#888', fontSize: 13 }}>
        관리자 앱에서 갱신 트리거를 누르면 이 값이 새로 찍힙니다.
      </p>
    </main>
  )
}
