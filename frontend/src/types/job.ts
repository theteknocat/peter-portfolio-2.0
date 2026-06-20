import type { Tag } from '@/types/portfolio'

export interface Job {
  slug: string
  title: string
  company: string
  start: string
  end: string
  summary?: string
  skills?: Tag[]
}
