import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function MobileSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-1.5 rounded hover:bg-[var(--color-bg-muted)]"
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 shadow-xl">
            <div className="flex justify-end p-2 bg-white border-b border-[var(--color-border)]">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-[var(--color-bg-muted)]"
                aria-label="메뉴 닫기"
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      ) : null}
    </>
  )
}
