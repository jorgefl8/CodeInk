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

function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest,
  transform?: (result: unknown) => T,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const req = operation(tx.objectStore(STORE_NAME))
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
        req.onsuccess = () => {
          db.close()
          resolve(transform ? transform(req.result) : (req.result as T))
        }
      }),
  )
}

export function getAllDocs(): Promise<Document[]> {
  return withStore("readonly", (store) => store.getAll(), (result) =>
    (result as Document[]).sort((a, b) => b.updatedAt - a.updatedAt),
  )
}

export function getDoc(id: string): Promise<Document | null> {
  return withStore("readonly", (store) => store.get(id), (result) =>
    (result as Document | undefined) ?? null,
  )
}

export function saveDoc(doc: Document): Promise<void> {
  return withStore("readwrite", (store) => store.put(doc))
}

export function deleteDoc(id: string): Promise<void> {
  return withStore("readwrite", (store) => store.delete(id))
}


