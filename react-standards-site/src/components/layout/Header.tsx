import { Search } from 'lucide-react'
import { MobileSidebarToggle } from './MobileSidebar'

export interface HeaderProps {
  onSearchClick: () => void
}

export function Header({ onSearchClick }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <MobileSidebarToggle />
        <h1 className="text-lg font-bold">React Standards</h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onSearchClick}
          className="relative flex items-center"
        >
          <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
          <span className="pl-8 pr-12 py-1.5 text-sm border border-gray-300 rounded-md w-64 text-left text-gray-400">
            검색 (⌘K)
          </span>
          <kbd className="absolute right-2 text-xs text-gray-400 border border-gray-200 rounded px-1">⌘K</kbd>
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          GitHub
        </a>
      </div>
    </header>
  )
}
