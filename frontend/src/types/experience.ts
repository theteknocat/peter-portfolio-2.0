import type { Tag } from '@/types/portfolio'

export interface ExperienceEntry {
  slug: string
  title: string
  company: string
  start: string
  end: string
  period: string
  summary?: string
  skills?: Tag[]
}
