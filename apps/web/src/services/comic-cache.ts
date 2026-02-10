const DB_NAME = "dc-absoluto-comics"
const DB_VERSION = 1
const STORE_NAME = "pages"

interface CachedComic {
  comicId: string
  pages: { name: string; blob: Blob; width: number; height: number; isLandscape: boolean }[]
  cachedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "comicId" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCachedComic(comicId: string): Promise<CachedComic | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(comicId)

      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCachedComic(
  comicId: string,
  pages: { name: string; blob: Blob; width: number; height: number; isLandscape: boolean }[],
): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const entry: CachedComic = { comicId, pages, cachedAt: Date.now() }
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // silencioso
  }
}
