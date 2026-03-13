import { Search } from 'lucide-react'
import { MobileSidebarToggle } from './MobileSidebar'

export interface HeaderProps {
  onSearchClick: () => void
}

export function Header({ onSearchClick }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="flex items-center gap-3 md:hidden">
        <MobileSidebarToggle />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onSearchClick} className="search-trigger">
          <Search size={14} />
          <span>검색...</span>
          <kbd>⌘K</kbd>
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  )
}
