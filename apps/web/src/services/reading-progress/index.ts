export interface StorageClient {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface LocalStorageClientConfig {
  prefix?: string
}

export function createLocalStorageClient(config: LocalStorageClientConfig = {}): StorageClient {
  const { prefix } = config

  const withPrefix = (key: string) => (prefix ? `${prefix}:${key}` : key)

  const getStorage = () => {
    if (typeof window === "undefined") return null

    try {
      return window.localStorage
    } catch {
      return null
    }
  }

  return {
    getItem(key) {
      const storage = getStorage()
      if (!storage) return null
      return storage.getItem(withPrefix(key))
    },
    setItem(key, value) {
      const storage = getStorage()
      if (!storage) return
      storage.setItem(withPrefix(key), value)
    },
    removeItem(key) {
      const storage = getStorage()
      if (!storage) return
      storage.removeItem(withPrefix(key))
    },
  }
}

export interface ReadingProgress {
  comicId: string
  page: number
  totalPages: number
  updatedAt: string
  userId?: string | null
}

export interface ReadingProgressService {
  getProgress: (comicId: string) => ReadingProgress | null
  setProgress: (comicId: string, page: number, totalPages: number, userId?: string | null) => void
  clearProgress: (comicId: string) => void
}

interface ReadingProgressConfig {
  namespace?: string
}

export function createReadingProgressService(
  storage: StorageClient,
  config: ReadingProgressConfig = {},
): ReadingProgressService {
  const namespace = config.namespace ?? "reading-progress"

  const buildKey = (comicId: string) => `${namespace}:${comicId}`

  return {
    getProgress(comicId) {
      const raw = storage.getItem(buildKey(comicId))
      if (!raw) return null

      try {
        const parsed = JSON.parse(raw) as ReadingProgress
        if (!parsed || typeof parsed.page !== "number") {
          return null
        }
        return parsed
      } catch {
        return null
      }
    },
    setProgress(comicId, page, totalPages, userId) {
      const payload: ReadingProgress = {
        comicId,
        page,
        totalPages,
        updatedAt: new Date().toISOString(),
        userId: userId ?? null,
      }

      storage.setItem(buildKey(comicId), JSON.stringify(payload))
    },
    clearProgress(comicId) {
      storage.removeItem(buildKey(comicId))
    },
  }
}

export const readingProgress = createReadingProgressService(
  createLocalStorageClient({ prefix: "dc-absoluto" }),
)
