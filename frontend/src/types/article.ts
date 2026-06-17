export interface Article {
  slug: string
  title: string
  date?: string
  summary?: string
  tags?: string[]
  featured?: boolean
  body?: string
}
