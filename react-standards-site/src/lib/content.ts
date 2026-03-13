import fs from 'node:fs'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { createHighlighter, type Highlighter } from 'shiki'
import matter from 'gray-matter'
import type { Rule, RuleCategory, Reference } from './types'

const CONTENT_DIR = path.resolve(process.cwd(), 'content')

const CATEGORY_MAP: Record<string, { label: string; prefix: string }> = {
  'architecture': { label: '아키텍처', prefix: 'A' },
  'naming-conventions': { label: '네이밍', prefix: 'N' },
  'component-patterns': { label: '컴포넌트', prefix: 'C' },
  'state-and-data': { label: '상태 & 데이터', prefix: 'S' },
  'performance': { label: '성능', prefix: 'P' },
  'testing-a11y': { label: '테스트 & 타입', prefix: 'T' },
}

// --- Shiki highlighter (singleton) ---

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['tsx', 'typescript', 'json', 'bash', 'css', 'text'],
    })
  }
  return highlighterPromise
}

// --- Markdown rendering ---

function htmlDecode(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
}

export async function renderMarkdown(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md)

  let html = String(result)

  // Post-process code blocks with Shiki
  const highlighter = await getHighlighter()
  const codeBlockRegex =
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g

  html = html.replace(codeBlockRegex, (_match, lang: string, code: string) => {
    const decoded = htmlDecode(code)
    try {
      return highlighter.codeToHtml(decoded, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
      })
    } catch {
      // If the language is not supported, fall back to text
      return highlighter.codeToHtml(decoded, {
        lang: 'text',
        themes: { light: 'github-light', dark: 'github-dark' },
      })
    }
  })

  return html
}

// --- Rule parsing ---

export function parseRulesFromMarkdown(
  markdown: string,
  category: string,
): { id: string; title: string; classification: string; why: string; raw: string }[] {
  const lines = markdown.split('\n')
  const rules: { id: string; title: string; classification: string; why: string; raw: string }[] = []

  let current: { id: string; title: string; classification: string; why: string; lines: string[] } | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^## ([A-Z]-\d{2}):\s*(.+)/)
    if (headingMatch) {
      if (current) {
        rules.push({
          id: current.id,
          title: current.title,
          classification: current.classification,
          why: current.why,
          raw: current.lines.join('\n'),
        })
      }
      current = {
        id: headingMatch[1],
        title: headingMatch[2].trim(),
        classification: '',
        why: '',
        lines: [],
      }
      continue
    }

    if (current) {
      current.lines.push(line)

      const classMatch = line.match(/\*\*분류:\*\*\s*(.+)/)
      if (classMatch) {
        current.classification = classMatch[1].trim()
      }

      const whyMatch = line.match(/\*\*WHY:\*\*\s*(.+)/)
      if (whyMatch) {
        current.why = whyMatch[1].trim()
      }
    }
  }

  // Push the last rule
  if (current) {
    rules.push({
      id: current.id,
      title: current.title,
      classification: current.classification,
      why: current.why,
      raw: current.lines.join('\n'),
    })
  }

  return rules
}

// --- Public API ---

export async function getRuleCategory(slug: string): Promise<RuleCategory | null> {
  const meta = CATEGORY_MAP[slug]
  if (!meta) return null

  const filePath = path.join(CONTENT_DIR, 'rules', `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const markdown = fs.readFileSync(filePath, 'utf-8')
  const parsed = parseRulesFromMarkdown(markdown, slug)

  const rules: Rule[] = await Promise.all(
    parsed.map(async (r) => ({
      id: r.id,
      title: r.title,
      category: slug,
      classification: r.classification,
      why: r.why,
      contentHtml: await renderMarkdown(r.raw),
      anchor: r.id.toLowerCase(),
    })),
  )

  return {
    slug,
    label: meta.label,
    prefix: meta.prefix,
    rules,
  }
}

export async function getAllRules(): Promise<Rule[]> {
  const allRules: Rule[] = []
  for (const slug of Object.keys(CATEGORY_MAP)) {
    const cat = await getRuleCategory(slug)
    if (cat) {
      allRules.push(...cat.rules)
    }
  }
  return allRules
}

export function getAllCategorySlugs(): string[] {
  return Object.keys(CATEGORY_MAP)
}

export async function getReference(slug: string): Promise<Reference | null> {
  const filePath = path.join(CONTENT_DIR, 'references', slug.replace(/--/g, '/') + '.md')
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title: (data.title as string) || slug,
    description: (data.description as string) || '',
    tags: (data.tags as string[]) || [],
    rules: (data.rules as string[]) || [],
    contentHtml: await renderMarkdown(content),
  }
}

export async function getAllReferences(): Promise<Reference[]> {
  const refsDir = path.join(CONTENT_DIR, 'references')
  if (!fs.existsSync(refsDir)) return []

  const references: Reference[] = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.endsWith('.md') && entry.name !== '_tags.md') {
        const relPath = path.relative(refsDir, fullPath)
        const slug = relPath.replace(/\//g, '--').replace(/\.md$/, '')
        references.push({ slug, fullPath } as any)
      }
    }
  }

  walk(refsDir)

  const results: Reference[] = []
  for (const ref of references) {
    const fullPath = (ref as any).fullPath
    const raw = fs.readFileSync(fullPath, 'utf-8')
    const { data, content } = matter(raw)
    results.push({
      slug: ref.slug,
      title: (data.title as string) || ref.slug,
      description: (data.description as string) || '',
      tags: (data.tags as string[]) || [],
      rules: (data.rules as string[]) || [],
      contentHtml: await renderMarkdown(content),
    })
  }

  return results
}

export async function getProtocolHtml(): Promise<string> {
  const filePath = path.join(CONTENT_DIR, 'protocol.md')
  if (!fs.existsSync(filePath)) return ''

  const markdown = fs.readFileSync(filePath, 'utf-8')
  return renderMarkdown(markdown)
}
