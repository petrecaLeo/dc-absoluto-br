import { z } from "zod"

export const comicSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  titleOriginal: z.string().max(255).optional(),
  issueNumber: z.number().int().positive().optional(),
  description: z.string().optional(),
  coverUrl: z.string().url().max(500).optional(),
  releaseDate: z.coerce.date().optional(),
  releaseDateBr: z.coerce.date().optional(),
  publisher: z.string().max(100).default("DC Comics"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createComicSchema = comicSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateComicSchema = createComicSchema.partial()

export const characterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  alias: z.string().max(255).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().max(500).optional(),
  isHero: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createCharacterSchema = characterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateCharacterSchema = createCharacterSchema.partial()

export const newsletterSubscribeSchema = z.object({
  email: z.string().email(),
})

export const characterNewsletterSubscribeSchema = z.object({
  email: z.string().email(),
  characterId: z.string().uuid(),
})

export type CharacterNewsletterSubscribe = z.infer<typeof characterNewsletterSubscribeSchema>

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type ComicInput = z.infer<typeof createComicSchema>
export type ComicUpdate = z.infer<typeof updateComicSchema>
export type CharacterInput = z.infer<typeof createCharacterSchema>
export type CharacterUpdate = z.infer<typeof updateCharacterSchema>
export type NewsletterSubscribe = z.infer<typeof newsletterSubscribeSchema>
export type Pagination = z.infer<typeof paginationSchema>
