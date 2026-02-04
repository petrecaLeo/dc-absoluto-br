export interface Comic {
  id: string
  title: string
  issueNumber?: number
  coverUrl?: string
  downloadUrl?: string
  releaseDate?: Date
  publisher?: string
  writer?: string
  artists?: string
  createdAt: Date
  updatedAt: Date
}

export interface Character {
  id: string
  slug: string
  name: string
  alias?: string | null
  rating: number
  upvotes: number
  createdAt: Date
  updatedAt: Date
}

export interface NewsletterSubscriber {
  id: string
  email: string
  subscribedAt: Date
  isActive: boolean
}

export interface CharacterNewsletterSubscriber {
  id: string
  email: string
  characterId: string
  subscribedAt: Date
  isActive: boolean
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
