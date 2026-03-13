/// <reference types="vite/client" />
import { type ReactNode, useState, useEffect, useMemo } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { SearchDialog } from '../components/layout/SearchDialog'
import { buildSearchItems, createSearchIndex } from '../lib/search'
import { getAllRules } from '../lib/content'
import appCss from '../styles/app.css?url'

const loadRulesForSearch = createServerFn({ method: 'GET' }).handler(async () => {
  const rules = await getAllRules()
  return rules.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    classification: r.classification,
    why: r.why,
    anchor: r.anchor,
  }))
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'React Standards' },
      { name: 'description', content: 'React/TypeScript 코딩 표준 78개 규칙 문서' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: () => loadRulesForSearch(),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-300">404</h1>
        <p className="mt-2 text-gray-500">페이지를 찾을 수 없습니다.</p>
        <a href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">홈으로 돌아가기</a>
      </div>
    </div>
  )
}

function RootComponent() {
  const rules = Route.useLoaderData()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const searchIndex = useMemo(() => {
    if (!rules) return null
    const items = buildSearchItems(rules)
    return createSearchIndex(items)
  }, [rules])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <RootDocument>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onSearchClick={() => setIsSearchOpen(true)} />
          <main className="flex-1 px-4 md:px-8 py-6 max-w-4xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchIndex={searchIndex}
      />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
