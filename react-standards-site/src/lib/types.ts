export interface Rule {
  id: string
  title: string
  category: string
  classification: string
  why: string
  contentHtml: string
  anchor: string
}

export interface RuleCategory {
  slug: string
  label: string
  prefix: string
  rules: Rule[]
}

export interface Reference {
  slug: string
  title: string
  description: string
  tags: string[]
  rules: string[]
  contentHtml: string
}
