// Cache de dados — Memória (sessão) + IndexedDB (offline, cross-session, sem limite de 5MB)
// Padrão Stale-While-Revalidate: entrega dados instantâneos, atualiza em segundo plano

const memoryCache = new Map<string, { data: unknown; timestamp: number }>()

const MEMORY_TTL_MS = 15 * 60 * 1000        // 15 min — sessão ativa
const OFFLINE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias — dados offline

/** Lê do cache de memória (síncrono, mais rápido) */
export function getCachedMemory<T>(key: string): T | null {
  const item = memoryCache.get(key)
  if (item && Date.now() - item.timestamp < MEMORY_TTL_MS) {
    return item.data as T
  }
  return null
}

/** Escreve no cache de memória */
export function setCachedMemory<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() })
}

/** Salva no IndexedDB de forma assíncrona (não bloqueia UI) */
function persistToIndexedDB(key: string, data: unknown): void {
  if (typeof window === 'undefined') return
  import('./db-offline')
    .then(({ getDb }) => {
      getDb().cache.put({ key, data, timestamp: Date.now() }).catch(() => {})
    })
    .catch(() => {})
}

/** Lê do IndexedDB (async) — dados offline de sessões anteriores */
async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null
  try {
    const { getDb } = await import('./db-offline')
    const entry = await getDb().cache.get(key)
    if (entry && Date.now() - entry.timestamp < OFFLINE_TTL_MS) {
      return entry.data as T
    }
  } catch { /* IndexedDB indisponível */ }
  return null
}

/**
 * Remove do IndexedDB um conjunto de chaves por prefixo.
 * Necessário ao invalidar cache após mutations (POST/PUT/DELETE).
 */
async function clearIndexedDBByPrefix(prefix: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const { getDb } = await import('./db-offline')
    const db = getDb()
    const keys = await db.cache.where('key').startsWith(prefix).primaryKeys()
    await db.cache.bulkDelete(keys as string[])
  } catch { /* ignora */ }
}

/**
 * Fetch com cache em múltiplas camadas:
 * 1. Memória RAM (0ms — sessão atual)
 * 2. IndexedDB (ms — offline, cross-session, 7 dias)
 * 3. Rede (API Railway)
 *
 * Se offline e há dados em cache → serve silenciosamente, sem erro.
 * Se offline e sem cache → lança erro para o componente exibir fallback.
 */
export async function fetchWithCache<T>(
  url: string,
  onData: (data: T) => void,
  options?: RequestInit
): Promise<void> {
  let servedFromCache = false

  // 1. Memória RAM — instantâneo
  const memItem = getCachedMemory<T>(url)
  if (memItem !== null) {
    onData(memItem)
    servedFromCache = true
  }

  // 2. IndexedDB — se não estava na memória
  if (!servedFromCache) {
    const idbData = await getFromIndexedDB<T>(url)
    if (idbData !== null) {
      setCachedMemory(url, idbData)
      onData(idbData)
      servedFromCache = true
    }
  }

  // 3. Rede — busca dados frescos e atualiza cache
  try {
    const res = await fetch(url, options)
    if (res.ok) {
      const data: T = await res.json()
      setCachedMemory(url, data)
      persistToIndexedDB(url, data)
      onData(data)
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
  } catch (err) {
    if (servedFromCache) {
      // Offline mas com cache — não lança erro, dados já foram entregues
      console.warn(`[Offline] Dados em cache para: ${url}`)
      return
    }
    // Offline e sem cache — lança para o componente mostrar fallback
    throw err
  }
}

/**
 * Invalida o cache de memória e IndexedDB para uma chave ou prefixo.
 * Chame após mutations (POST/PUT/DELETE) para forçar revalidação.
 */
export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear()
    if (typeof window !== 'undefined') {
      import('./db-offline')
        .then(({ getDb }) => getDb().cache.clear())
        .catch(() => {})
    }
    return
  }

  // Remove da memória
  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyPrefix)) memoryCache.delete(k)
  }

  // Remove do IndexedDB (async)
  clearIndexedDBByPrefix(keyPrefix)
}

// Mantém compatibilidade com código legado que usa getCached/setCached diretamente
export const getCached = getCachedMemory
export const setCached = setCachedMemory
