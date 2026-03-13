# React Standards Documentation Site — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an SSR documentation site for 78 React coding standards rules, 28 reference code files, and 3-Phase protocol using TanStack Start + Tailwind CSS v4.

**Architecture:** TanStack Start (Vite plugin) serves SSR pages. Markdown content is parsed at build time via unified/remark/rehype pipeline with Shiki code highlighting. Fuse.js provides client-side fuzzy search. Content lives in `content/` directory, copied from `.claude/skills/react-standards/`.

**Tech Stack:** TanStack Start, @tanstack/react-router, Tailwind CSS v4, unified/remark-gfm/rehype, Shiki, Fuse.js, Lucide React, Vercel

---

## Task 1: Project Scaffolding

**Files:**
- Create: `react-standards-site/package.json`
- Create: `react-standards-site/vite.config.ts`
- Create: `react-standards-site/tsconfig.json`
- Create: `react-standards-site/src/router.tsx`
- Create: `react-standards-site/src/styles/app.css`

**Step 1: Initialize project directory and package.json**

```bash
mkdir -p react-standards-site
cd react-standards-site
```

```json
// package.json
{
  "name": "react-standards-site",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "node .output/server/index.mjs"
  },
  "dependencies": {
    "@tanstack/react-router": "^1",
    "@tanstack/react-start": "^1",
    "react": "^19",
    "react-dom": "^19",
    "lucide-react": "^0.460",
    "fuse.js": "^7"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4",
    "@tailwindcss/vite": "^4",
    "tailwindcss": "^4",
    "typescript": "^5.7",
    "vite": "^6",
    "vite-tsconfig-paths": "^4"
  }
}
```

**Step 2: Install dependencies**

Run: `cd react-standards-site && npm install`

**Step 3: Create vite.config.ts**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart(),
    viteReact(),
  ],
})
```

**Step 4: Create tsconfig.json**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 5: Create router.tsx**

```tsx
// src/router.tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  return createTanStackRouter({ routeTree })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
```

**Step 6: Create base CSS with Tailwind**

```css
/* src/styles/app.css */
@import 'tailwindcss';
```

**Step 7: Verify dev server starts**

Run: `npm run dev`
Expected: Dev server starts at localhost:3000 (may show 404 — no routes yet)

**Step 8: Commit**

```bash
git add react-standards-site/
git commit -m "feat(site): scaffold TanStack Start project with Tailwind v4"
```

---

## Task 2: Root Layout + Landing Page

**Files:**
- Create: `react-standards-site/src/routes/__root.tsx`
- Create: `react-standards-site/src/routes/index.tsx`
- Create: `react-standards-site/src/components/layout/Sidebar.tsx`
- Create: `react-standards-site/src/components/layout/Header.tsx`

**Step 1: Create __root.tsx with HTML shell + layout**

```tsx
// src/routes/__root.tsx
/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import appCss from '../styles/app.css?url'

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
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 px-8 py-6 max-w-4xl">
            <Outlet />
          </main>
        </div>
      </div>
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
```

Note: `Sidebar` and `Header` will be imported from components — implement next.

**Step 2: Create Sidebar component**

```tsx
// src/components/layout/Sidebar.tsx
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
    <aside className="w-60 border-r border-gray-200 p-4 hidden md:block">
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
```

**Step 3: Create Header component**

```tsx
// src/components/layout/Header.tsx
import { Search } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-gray-200 px-8 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold">React Standards</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="search"
            placeholder="규칙 검색 (A-01, useState...)"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
```

**Step 4: Create landing page**

```tsx
// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

const STATS = { total: 78, categories: 6, references: 28 }

const CATEGORIES = [
  { slug: 'architecture', prefix: 'A', label: '아키텍처', count: 10, desc: '의존성 방향, 레이어 분리, 모듈 경계' },
  { slug: 'naming-conventions', prefix: 'N', label: '네이밍', count: 8, desc: 'PascalCase, camelCase, Boolean 접두사' },
  { slug: 'component-patterns', prefix: 'C', label: '컴포넌트', count: 15, desc: 'SRP, 합성, 훅 규칙, key 활용' },
  { slug: 'state-and-data', prefix: 'S', label: '상태 & 데이터', count: 16, desc: '함수형 setState, Context, 비동기' },
  { slug: 'performance', prefix: 'P', label: '성능', count: 14, desc: '가상화, dynamic import, 워터폴' },
  { slug: 'testing-a11y', prefix: 'T', label: '테스트 & 타입', count: 15, desc: 'Testing Library, MSW, strict TS' },
]

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">React Coding Standards</h1>
        <p className="mt-2 text-gray-600">
          {STATS.total}개 규칙 · {STATS.categories}개 카테고리 · {STATS.references}개 레퍼런스 코드
        </p>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/rules/${cat.slug}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
          >
            <div className="text-xs font-mono text-blue-600">{cat.prefix}</div>
            <h3 className="font-semibold mt-1">{cat.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
            <p className="text-xs text-gray-400 mt-2">{cat.count}개 규칙</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
```

**Step 5: Verify dev server renders landing page**

Run: `npm run dev`
Expected: Landing page with 6 category cards at localhost:3000

**Step 6: Commit**

```bash
git add react-standards-site/src/
git commit -m "feat(site): add root layout, sidebar, header, and landing page"
```

---

## Task 3: Content Pipeline (Markdown + Shiki)

**Files:**
- Create: `react-standards-site/src/lib/content.ts`
- Create: `react-standards-site/src/lib/types.ts`
- Copy content to: `react-standards-site/content/rules/*.md`
- Copy content to: `react-standards-site/content/references/*.md`
- Copy content to: `react-standards-site/content/protocol.md`

**Step 1: Install markdown/shiki dependencies**

Run: `cd react-standards-site && npm install unified remark-parse remark-gfm remark-rehype rehype-stringify shiki gray-matter`
Run: `npm install -D @types/hast`

**Step 2: Create types**

```ts
// src/lib/types.ts
export interface Rule {
  id: string         // "A-01"
  title: string      // "단방향 의존성"
  category: string   // "architecture"
  classification: string  // "NEVER" | "ALWAYS" | etc
  why: string
  contentHtml: string  // full rendered HTML of this rule section
  anchor: string     // "a-01"
}

export interface RuleCategory {
  slug: string
  label: string
  prefix: string
  rules: Rule[]
}

export interface Reference {
  slug: string           // filename without .md
  title: string
  description: string
  tags: string[]
  rules: string[]        // ["S-06", "P-13"]
  contentHtml: string
}
```

**Step 3: Create content parsing library**

```ts
// src/lib/content.ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { createHighlighter } from 'shiki'
import type { Rule, RuleCategory, Reference } from './types'

const CONTENT_DIR = path.resolve(process.cwd(), 'content')

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['tsx', 'typescript', 'json', 'bash', 'css'],
    })
  }
  return highlighterPromise
}

async function renderMarkdown(md: string): Promise<string> {
  const highlighter = await getHighlighter()
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md)

  // Post-process: replace <code> blocks with Shiki-highlighted HTML
  let html = String(result)
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
  html = html.replace(codeBlockRegex, (_, lang, code) => {
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
    try {
      return highlighter.codeToHtml(decoded, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
      })
    } catch {
      return `<pre><code>${code}</code></pre>`
    }
  })
  return html
}

// --- Rule Parsing ---

const CATEGORY_MAP: Record<string, { label: string; prefix: string }> = {
  'architecture': { label: '아키텍처', prefix: 'A' },
  'naming-conventions': { label: '네이밍', prefix: 'N' },
  'component-patterns': { label: '컴포넌트', prefix: 'C' },
  'state-and-data': { label: '상태 & 데이터', prefix: 'S' },
  'performance': { label: '성능', prefix: 'P' },
  'testing-a11y': { label: '테스트 & 타입', prefix: 'T' },
}

function parseRulesFromMarkdown(markdown: string, category: string): Rule[] {
  // Split by ## headings (rule sections)
  const sections = markdown.split(/(?=^## )/m).filter(Boolean)
  const rules: Rule[] = []

  for (const section of sections) {
    const headingMatch = section.match(/^## (.+?):\s*(.+)$/m)
    if (!headingMatch) continue
    const id = headingMatch[1].trim()     // "A-01"
    const title = headingMatch[2].trim()  // "단방향 의존성"

    const classMatch = section.match(/\*\*분류:\*\*\s*(.+)/m)
    const whyMatch = section.match(/\*\*WHY:\*\*\s*(.+)/m)

    rules.push({
      id,
      title,
      category,
      classification: classMatch?.[1]?.trim() ?? '',
      why: whyMatch?.[1]?.trim() ?? '',
      contentHtml: '', // filled async later
      anchor: id.toLowerCase().replace('-', '-'),
    })
  }
  return rules
}

export async function getRuleCategory(slug: string): Promise<RuleCategory | null> {
  const info = CATEGORY_MAP[slug]
  if (!info) return null

  const filePath = path.join(CONTENT_DIR, 'rules', `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const rules = parseRulesFromMarkdown(raw, slug)

  // Render each rule section to HTML
  const sections = raw.split(/(?=^## )/m).filter(Boolean)
  for (let i = 0; i < rules.length && i < sections.length; i++) {
    // Skip the first section if it's an H1 heading
    const sectionIndex = sections.findIndex((s) => s.startsWith(`## ${rules[i].id}`))
    if (sectionIndex >= 0) {
      rules[i].contentHtml = await renderMarkdown(sections[sectionIndex])
    }
  }

  return { slug, ...info, rules }
}

export async function getAllRules(): Promise<Rule[]> {
  const allRules: Rule[] = []
  for (const slug of Object.keys(CATEGORY_MAP)) {
    const cat = await getRuleCategory(slug)
    if (cat) allRules.push(...cat.rules)
  }
  return allRules
}

export function getAllCategorySlugs(): string[] {
  return Object.keys(CATEGORY_MAP)
}

// --- Reference Parsing ---

export async function getReference(slug: string): Promise<Reference | null> {
  const refsDir = path.join(CONTENT_DIR, 'references')
  // References may be in subdirectories
  const files = findMarkdownFiles(refsDir)
  const file = files.find((f) => toSlug(f) === slug)
  if (!file) return null

  const raw = fs.readFileSync(file, 'utf-8')
  const { data, content } = matter(raw)
  const contentHtml = await renderMarkdown(content)

  return {
    slug,
    title: data.description ?? slug,
    description: data.description ?? '',
    tags: data.tags ?? [],
    rules: data.rules ?? [],
    contentHtml,
  }
}

export async function getAllReferences(): Promise<Reference[]> {
  const refsDir = path.join(CONTENT_DIR, 'references')
  if (!fs.existsSync(refsDir)) return []

  const files = findMarkdownFiles(refsDir)
  const refs: Reference[] = []

  for (const file of files) {
    if (path.basename(file) === '_tags.md') continue
    const raw = fs.readFileSync(file, 'utf-8')
    const { data } = matter(raw)
    const slug = toSlug(file)
    refs.push({
      slug,
      title: data.description ?? slug,
      description: data.description ?? '',
      tags: data.tags ?? [],
      rules: data.rules ?? [],
      contentHtml: '', // only fill on detail page
    })
  }
  return refs
}

// --- Protocol ---

export async function getProtocolHtml(): Promise<string> {
  const filePath = path.join(CONTENT_DIR, 'protocol.md')
  if (!fs.existsSync(filePath)) return ''
  const raw = fs.readFileSync(filePath, 'utf-8')
  return renderMarkdown(raw)
}

// --- Helpers ---

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(full))
    } else if (entry.name.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

function toSlug(filePath: string): string {
  const refsDir = path.join(CONTENT_DIR, 'references')
  return path
    .relative(refsDir, filePath)
    .replace(/\.md$/, '')
    .replace(/\//g, '--')
}
```

**Step 4: Copy content from skill files**

```bash
# From repo root
mkdir -p react-standards-site/content/rules
mkdir -p react-standards-site/content/references

# Copy rule files
cp .claude/skills/react-standards/architecture.md react-standards-site/content/rules/
cp .claude/skills/react-standards/naming-conventions.md react-standards-site/content/rules/
cp .claude/skills/react-standards/component-patterns.md react-standards-site/content/rules/
cp .claude/skills/react-standards/state-and-data.md react-standards-site/content/rules/
cp .claude/skills/react-standards/performance.md react-standards-site/content/rules/
cp .claude/skills/react-standards/testing-a11y.md react-standards-site/content/rules/

# Copy reference code files (flatten directory structure)
cp -r .claude/skills/react-standards/reference-code/* react-standards-site/content/references/

# Create protocol.md from SKILL.md Phase section
# (extract the 3-Phase protocol content from SKILL.md)
```

**Step 5: Create protocol.md** (extract from SKILL.md)

Create `react-standards-site/content/protocol.md` with the 3-Phase protocol content extracted from SKILL.md (Phase 1 → Phase 2 → Phase 3 sections).

**Step 6: Verify content loads**

Create a quick test — import `getAllRules` in index.tsx loader and log the count. Expected: 78 rules parsed.

**Step 7: Commit**

```bash
git add react-standards-site/content/ react-standards-site/src/lib/
git commit -m "feat(site): add content pipeline with markdown parsing and Shiki highlighting"
```

---

## Task 4: Rules Routes

**Files:**
- Create: `react-standards-site/src/routes/rules/index.tsx`
- Create: `react-standards-site/src/routes/rules/$category.tsx`
- Create: `react-standards-site/src/components/rules/RuleCard.tsx`

**Step 1: Create rules index page (search/filter)**

```tsx
// src/routes/rules/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAllRules } from '~/lib/content'
import type { Rule } from '~/lib/types'

const loadAllRules = createServerFn({ method: 'GET' }).handler(async () => {
  return getAllRules()
})

export const Route = createFileRoute('/rules/')({
  component: RulesIndexPage,
  loader: () => loadAllRules(),
})

function RulesIndexPage() {
  const rules = Route.useLoaderData()
  // Client-side filter state
  const [query, setQuery] = useState('')

  const filtered = query
    ? rules.filter((r) =>
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.title.includes(query) ||
        r.why.includes(query)
      )
    : rules

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">전체 규칙</h1>
      <input
        type="search"
        placeholder="규칙 ID 또는 키워드 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
      <div className="space-y-2">
        {filtered.map((rule) => (
          <Link
            key={rule.id}
            to={`/rules/${rule.category}`}
            hash={rule.anchor}
            className="block p-3 border border-gray-200 rounded hover:border-blue-300"
          >
            <span className="font-mono text-blue-600 text-sm">{rule.id}</span>
            <span className="ml-2 font-medium">{rule.title}</span>
            <span className="ml-2 text-xs text-gray-500">{rule.classification}</span>
          </Link>
        ))}
      </div>
      <p className="text-sm text-gray-500">{filtered.length}개 규칙</p>
    </div>
  )
}
```

Note: Add `import { useState } from 'react'` at top.

**Step 2: Create category detail page**

```tsx
// src/routes/rules/$category.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRuleCategory } from '~/lib/content'

const loadCategory = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getRuleCategory(slug)
  })

export const Route = createFileRoute('/rules/$category')({
  component: CategoryPage,
  loader: ({ params }) => loadCategory({ data: params.category }),
})

function CategoryPage() {
  const category = Route.useLoaderData()
  if (!category) return <div>카테고리를 찾을 수 없습니다.</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{category.label}</h1>
        <p className="text-sm text-gray-500 mt-1">{category.rules.length}개 규칙</p>
      </div>

      {/* Anchor navigation */}
      <nav className="flex flex-wrap gap-2">
        {category.rules.map((rule) => (
          <a
            key={rule.id}
            href={`#${rule.anchor}`}
            className="text-xs font-mono px-2 py-1 bg-gray-100 rounded hover:bg-blue-100"
          >
            {rule.id}
          </a>
        ))}
      </nav>

      {/* Rule sections */}
      {category.rules.map((rule) => (
        <article key={rule.id} id={rule.anchor} className="scroll-mt-20">
          <div
            className="prose prose-sm max-w-none
              [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto
              [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded
              [&_table]:text-sm"
            dangerouslySetInnerHTML={{ __html: rule.contentHtml }}
          />
          <hr className="my-6 border-gray-200" />
        </article>
      ))}
    </div>
  )
}
```

**Step 3: Verify rules pages render**

Run: `npm run dev`
Navigate to: `localhost:3000/rules` — should show all 78 rules
Navigate to: `localhost:3000/rules/architecture` — should show A-01 through A-10 with code blocks

**Step 4: Commit**

```bash
git add react-standards-site/src/routes/rules/
git commit -m "feat(site): add rules index and category detail pages"
```

---

## Task 5: References Routes

**Files:**
- Create: `react-standards-site/src/routes/references/index.tsx`
- Create: `react-standards-site/src/routes/references/$slug.tsx`

**Step 1: Create references gallery page**

```tsx
// src/routes/references/index.tsx
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAllReferences } from '~/lib/content'

const loadRefs = createServerFn({ method: 'GET' }).handler(async () => {
  return getAllReferences()
})

export const Route = createFileRoute('/references/')({
  component: ReferencesPage,
  loader: () => loadRefs(),
})

function ReferencesPage() {
  const references = Route.useLoaderData()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Collect all unique tags
  const allTags = [...new Set(references.flatMap((r) => r.tags))].sort()

  const filtered = selectedTag
    ? references.filter((r) => r.tags.includes(selectedTag))
    : references

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">레퍼런스 코드</h1>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className={`text-xs px-2 py-1 rounded ${
            selectedTag === null ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`text-xs px-2 py-1 rounded ${
              selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Reference cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ref) => (
          <Link
            key={ref.slug}
            to={`/references/${ref.slug}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300"
          >
            <h3 className="font-medium text-sm">{ref.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {ref.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
            {ref.rules.length > 0 ? (
              <div className="mt-2 text-xs text-gray-500">
                규칙: {ref.rules.join(', ')}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create reference detail page**

```tsx
// src/routes/references/$slug.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getReference } from '~/lib/content'

const loadRef = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getReference(slug)
  })

export const Route = createFileRoute('/references/$slug')({
  component: ReferenceDetailPage,
  loader: ({ params }) => loadRef({ data: params.slug }),
})

function ReferenceDetailPage() {
  const ref = Route.useLoaderData()
  if (!ref) return <div>레퍼런스를 찾을 수 없습니다.</div>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/references" className="text-sm text-blue-600 hover:underline">
          ← 레퍼런스 목록
        </Link>
        <h1 className="text-2xl font-bold mt-2">{ref.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {ref.tags.map((tag) => (
          <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>

      {ref.rules.length > 0 ? (
        <div className="text-sm">
          <span className="font-medium">적용 규칙: </span>
          {ref.rules.map((ruleId, i) => (
            <span key={ruleId}>
              {i > 0 ? ', ' : ''}
              <span className="font-mono text-blue-600">{ruleId}</span>
            </span>
          ))}
        </div>
      ) : null}

      <div
        className="prose prose-sm max-w-none
          [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto
          [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded"
        dangerouslySetInnerHTML={{ __html: ref.contentHtml }}
      />
    </div>
  )
}
```

**Step 3: Verify references pages**

Run: `npm run dev`
Navigate to: `localhost:3000/references` — should show reference cards with tags
Click a card — should show detail page with highlighted code

**Step 4: Commit**

```bash
git add react-standards-site/src/routes/references/
git commit -m "feat(site): add references gallery and detail pages"
```

---

## Task 6: Protocol Page

**Files:**
- Create: `react-standards-site/src/routes/protocol.tsx`

**Step 1: Create protocol page**

```tsx
// src/routes/protocol.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getProtocolHtml } from '~/lib/content'

const loadProtocol = createServerFn({ method: 'GET' }).handler(async () => {
  return getProtocolHtml()
})

export const Route = createFileRoute('/protocol')({
  component: ProtocolPage,
  loader: () => loadProtocol(),
})

function ProtocolPage() {
  const html = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">3-Phase 프로토콜</h1>
      <div
        className="prose prose-sm max-w-none
          [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto
          [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded
          [&_table]:text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
```

**Step 2: Verify protocol page**

Run: `npm run dev`
Navigate to: `localhost:3000/protocol`
Expected: 3-Phase protocol rendered with code blocks

**Step 3: Commit**

```bash
git add react-standards-site/src/routes/protocol.tsx
git commit -m "feat(site): add protocol guide page"
```

---

## Task 7: Search with Fuse.js

**Files:**
- Create: `react-standards-site/src/lib/search.ts`
- Modify: `react-standards-site/src/components/layout/Header.tsx`
- Create: `react-standards-site/src/components/layout/SearchDialog.tsx`

**Step 1: Create search index builder**

```ts
// src/lib/search.ts
import Fuse from 'fuse.js'
import type { Rule } from './types'

export interface SearchItem {
  id: string
  title: string
  category: string
  classification: string
  why: string
  url: string
}

export function createSearchIndex(rules: Rule[]): Fuse<SearchItem> {
  const items: SearchItem[] = rules.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    classification: r.classification,
    why: r.why,
    url: `/rules/${r.category}#${r.anchor}`,
  }))

  return new Fuse(items, {
    keys: [
      { name: 'id', weight: 3 },
      { name: 'title', weight: 2 },
      { name: 'why', weight: 1 },
    ],
    threshold: 0.3,
    includeScore: true,
  })
}
```

**Step 2: Create SearchDialog component**

```tsx
// src/components/layout/SearchDialog.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import Fuse from 'fuse.js'
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

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        isOpen ? onClose() : /* parent handles open */null
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        className="mx-auto mt-20 max-w-lg bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="search"
          placeholder="규칙 검색... (A-01, useState, 의존성)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 text-sm border-b border-gray-200 rounded-t-lg outline-none"
        />
        <div className="max-h-80 overflow-y-auto">
          {results.map(({ item }) => (
            <button
              key={item.id}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
              onClick={() => {
                navigate({ to: item.url })
                onClose()
              }}
            >
              <span className="font-mono text-blue-600 text-sm w-10">{item.id}</span>
              <div>
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
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Wire search into Header**

Update `Header.tsx` to open `SearchDialog` on input focus or Cmd+K. Pass search index from root layout (loaded via server function).

**Step 4: Wire search index into root layout**

In `__root.tsx`, load all rules via server function in the root loader, build search index on client, and pass to Header/SearchDialog via context or props.

**Step 5: Verify search**

Run: `npm run dev`
Press Cmd+K → search dialog opens
Type "A-01" → first result shows 단방향 의존성
Type "useState" → relevant rules appear

**Step 6: Commit**

```bash
git add react-standards-site/src/lib/search.ts react-standards-site/src/components/
git commit -m "feat(site): add Fuse.js search with Cmd+K dialog"
```

---

## Task 8: Styling Polish

**Files:**
- Modify: `react-standards-site/src/styles/app.css`
- Modify: Various component files for responsive design

**Step 1: Add typography and prose styles**

Update `app.css` with:
- Custom prose styles for code blocks (light/dark Shiki themes)
- BAD/GOOD pattern styling (red/green borders for code blocks containing markers)
- Table styling for rule tables
- Mobile responsive sidebar (hamburger toggle)
- Smooth scroll behavior
- Anchor offset for fixed header

**Step 2: Add mobile sidebar toggle**

Update `__root.tsx` and `Sidebar.tsx`:
- Add hamburger button visible on `md:hidden`
- Sidebar slides in as overlay on mobile
- Close on route change

**Step 3: Add dark mode support (optional, Tailwind v4)**

Add `@media (prefers-color-scheme: dark)` base styles. Shiki dual theme already provides light/dark code blocks.

**Step 4: Visual review**

Run: `npm run dev`
Check all pages at desktop and mobile widths.
Verify code blocks render with Shiki syntax highlighting.

**Step 5: Commit**

```bash
git add react-standards-site/
git commit -m "feat(site): polish styles, responsive design, and code block theming"
```

---

## Task 9: Vercel Deployment

**Files:**
- Create: `react-standards-site/vercel.json` (if needed)
- Modify: `react-standards-site/package.json` (verify build script)

**Step 1: Verify production build**

Run: `cd react-standards-site && npm run build`
Expected: Build succeeds, output in `.output/`

Run: `npm run start`
Expected: Production server runs at localhost:3000

**Step 2: Create Vercel config (if needed)**

TanStack Start with Vinxi should auto-detect on Vercel. If not:

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output"
}
```

**Step 3: Deploy to Vercel**

```bash
cd react-standards-site
npx vercel --prod
```

Follow prompts to link project and deploy.

**Step 4: Verify deployed site**

Visit the Vercel URL. Check:
- Landing page loads with SSR
- Rules pages render with syntax highlighting
- Search works
- References load
- Protocol page renders

**Step 5: Commit deployment config**

```bash
git add react-standards-site/vercel.json
git commit -m "feat(site): add Vercel deployment configuration"
```

---

## Task Summary

| Task | Description | Est. Files |
|------|-------------|-----------|
| 1 | Project scaffolding | 5 |
| 2 | Root layout + landing page | 4 |
| 3 | Content pipeline (markdown + Shiki) | 3 + content |
| 4 | Rules routes | 2 |
| 5 | References routes | 2 |
| 6 | Protocol page | 1 |
| 7 | Search (Fuse.js) | 3 |
| 8 | Styling polish | ~5 |
| 9 | Vercel deployment | 1-2 |

Total: ~9 commits, incremental delivery.
