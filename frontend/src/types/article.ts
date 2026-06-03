export interface Article {
  slug: string
  title: string
  date: string
  featured: boolean
  summary: string
  body?: string
  tags: string[]
}
