import Link from 'next/link'

export default function AdminHome() {
  return (
    <main>
      <h1>관리자 앱</h1>
      <p>ISR 갱신을 트리거할 수 있습니다.</p>
      <ul>
        <li><Link href="/posts/1">글 1 관리</Link></li>
        <li><Link href="/posts/2">글 2 관리</Link></li>
      </ul>
      <hr />
      <p style={{ color: '#888', fontSize: 13 }}>
        site: <a href="http://localhost:3000" target="_blank">http://localhost:3000</a>
      </p>
    </main>
  )
}
