import Link from 'next/link'
import RevalidateButtons from './revalidate-buttons'

export default async function AdminPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <main>
      <Link href="/">← 목록</Link>
      <h1>글 {id} 관리</h1>
      <p>아래 버튼으로 site 앱의 ISR 캐시를 무효화합니다.</p>

      <RevalidateButtons postId={id} />

      <hr />
      <p style={{ color: '#888', fontSize: 13 }}>
        갱신 후 <a href={`http://localhost:3000/posts/${id}`} target="_blank">
          http://localhost:3000/posts/{id}
        </a>
        {' '}을 새로고침하면 렌더링 시각이 바뀐 것을 확인할 수 있습니다.
      </p>
    </main>
  )
}
