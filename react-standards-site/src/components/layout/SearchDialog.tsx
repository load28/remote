import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type Fuse from 'fuse.js'
import type { SearchItem } from '~/lib/search'

export interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  searchIndex: Fuse<SearchItem> | null
}

export function SearchDialog({ isOpen, onClose, searchIndex }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = query && searchIndex
    ? searchIndex.search(query, { limit: 10 })
    : []

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        className="mx-auto mt-20 max-w-lg bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="search"
          placeholder="규칙 검색... (A-01, useState, 의존성)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
          }}
          className="w-full px-4 py-3 text-sm border-b border-gray-200 outline-none"
        />
        <div className="max-h-80 overflow-y-auto">
          {results.map(({ item }) => (
            <button
              key={item.id}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
              onClick={() => {
                navigate({ to: item.url })
                onClose()
              }}
            >
              <span className="font-mono text-blue-600 text-sm shrink-0 w-10">{item.id}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-gray-500 truncate">{item.why}</div>
              </div>
            </button>
          ))}
          {query && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              검색 결과가 없습니다
            </div>
          ) : null}
          {!query ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              규칙 ID, 키워드, 한글로 검색하세요
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
