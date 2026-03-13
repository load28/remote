import Fuse from 'fuse.js'

export interface SearchItem {
  id: string
  title: string
  category: string
  classification: string
  why: string
  url: string
}

export function buildSearchItems(rules: Array<{
  id: string
  title: string
  category: string
  classification: string
  why: string
  anchor: string
}>): SearchItem[] {
  return rules.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    classification: r.classification,
    why: r.why,
    url: `/rules/${r.category}#${r.anchor}`,
  }))
}

export function createSearchIndex(items: SearchItem[]): Fuse<SearchItem> {
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
