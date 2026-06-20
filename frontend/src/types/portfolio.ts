export interface Tag {
  label: string
  si?: string     // Simple Icons slug (e.g. 'php', 'vuedotjs')
  lucide?: string // Lucide component name (e.g. 'Plug', 'Database')
}

export interface PortfolioItem {
  slug: string
  title: string
  summary?: string
  tags?: Tag[]
  github?: string
  featured?: boolean
  body?: string
}
