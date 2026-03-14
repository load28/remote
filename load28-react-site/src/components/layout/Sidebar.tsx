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

const REFERENCE_GROUPS = [
  { hash: 'authentication', label: 'Authentication' },
  { hash: 'crud', label: 'CRUD' },
  { hash: 'list-filtering', label: 'List Filtering' },
  { hash: 'search', label: 'Search' },
  { hash: 'general', label: '일반' },
] as const

export function Sidebar() {
  return (
    <aside className="sidebar hidden md:block">
      <div className="sidebar-brand">
        <h2>load28 React</h2>
        <p>78 Rules · 6 Categories</p>
      </div>

      <nav>
        <div className="sidebar-section">
          <SidebarLink to="/" icon={<Home size={15} />} label="홈" />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">규칙</div>
          {CATEGORIES.map((cat) => (
            <SidebarLink
              key={cat.slug}
              to={`/rules/${cat.slug}`}
              icon={<BookOpen size={15} />}
              label={cat.label}
              badge={String(cat.count)}
            />
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">레퍼런스</div>
          {REFERENCE_GROUPS.map((group) => (
            <SidebarLink
              key={group.hash}
              to="/references"
              hash={group.hash}
              icon={<Code2 size={15} />}
              label={group.label}
            />
          ))}
        </div>

        <div className="sidebar-section" style={{ paddingBottom: '1rem' }}>
          <div className="sidebar-section-title">기타</div>
          <SidebarLink to="/protocol" icon={<GitBranch size={15} />} label="프로토콜" />
        </div>
      </nav>
    </aside>
  )
}

function SidebarLink({
  to,
  hash,
  icon,
  label,
  badge,
}: {
  to: string
  hash?: string
  icon: ReactNode
  label: string
  badge?: string
}) {
  if (hash) {
    return (
      <a href={`${to}#${hash}`} className="sidebar-link">
        <span className="icon">{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
      </a>
    )
  }
  return (
    <Link
      to={to}
      className="sidebar-link [&.active]:bg-[var(--color-primary-light)] [&.active]:text-[var(--color-primary)] [&.active]:font-medium"
    >
      <span className="icon">{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge ? (
        <span className="text-[0.6875rem] text-[var(--color-text-muted)] font-medium tabular-nums">{badge}</span>
      ) : null}
    </Link>
  )
}
