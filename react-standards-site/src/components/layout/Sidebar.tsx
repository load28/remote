import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpen, Code2, GitBranch, Home } from 'lucide-react'

const CATEGORIES = [
  { slug: 'architecture', label: '아키텍처', count: 10 },
  { slug: 'naming-conventions', label: '네이밍', count: 8 },
  { slug: 'component-patterns', label: '컴포넌트', count: 15 },
  { slug: 'state-and-data', label: '상태 & 데이터', count: 16 },
  { slug: 'performance', label: '성능', count: 14 },
  { slug: 'testing-a11y', label: '테스트 & 타입', count: 15 },
] as const

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-gray-200 p-4 hidden md:block shrink-0">
      <nav className="space-y-1">
        <SidebarLink to="/" icon={<Home size={16} />} label="홈" />
        <div className="pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">규칙</div>
        {CATEGORIES.map((cat) => (
          <SidebarLink
            key={cat.slug}
            to={`/rules/${cat.slug}`}
            icon={<BookOpen size={16} />}
            label={`${cat.label} (${cat.count})`}
          />
        ))}
        <div className="pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase">기타</div>
        <SidebarLink to="/references" icon={<Code2 size={16} />} label="레퍼런스 코드" />
        <SidebarLink to="/protocol" icon={<GitBranch size={16} />} label="프로토콜" />
      </nav>
    </aside>
  )
}

function SidebarLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100 [&.active]:bg-blue-50 [&.active]:text-blue-700"
    >
      {icon}
      {label}
    </Link>
  )
}
