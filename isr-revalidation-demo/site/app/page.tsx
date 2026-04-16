import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

export const revalidate = 3600

export default async function Home() {
  const posts = await getAllPosts()
  const builtAt = new Date().toISOString()

  return (
    <main>
      <h1>ISR Site</h1>
      <p>이 페이지는 <code>revalidate = 3600</code>으로 ISR 캐싱되어 있습니다.</p>
      <p style={{ color: '#888', fontSize: 13 }}>빌드/렌더 시각: {builtAt}</p>
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.id}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
