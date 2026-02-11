const DB_NAME = "codeink-docs"
const STORE_NAME = "documents"

export interface Document {
  id: string
  title: string
  customTitle?: string
  content: string
  createdAt: number
  updatedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" })
    }
  })
}

export async function getAllDocs(): Promise<Document[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const docs = (req.result as Document[]).sort(
        (a, b) => b.updatedAt - a.updatedAt
      )
      db.close()
      resolve(docs)
    }
  })
}

export async function getDoc(id: string): Promise<Document | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      db.close()
      resolve(req.result ?? null)
    }
  })
}

export async function saveDoc(doc: Document): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const req = tx.objectStore(STORE_NAME).put(doc)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      db.close()
      resolve()
    }
  })
}

export async function deleteDoc(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      db.close()
      resolve()
    }
  })
}

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : "Untitled"
}
