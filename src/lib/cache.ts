// Cache leve em memória no cliente para navegação instantânea estilo App (0ms de latência percebida)

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30 * 1000; // 30 segundos de dados frescos

export function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  return item.data as T;
}

export function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k);
    }
  }
}

/**
 * Fetch com suporte a cache imediato (Stale While Revalidate)
 */
export async function fetchWithCache<T>(
  url: string,
  onData: (data: T) => void,
  options?: RequestInit
): Promise<void> {
  const cached = getCached<T>(url);
  if (cached) {
    // Entrega imediata para UI não piscar ou ficar travada
    onData(cached);
  }

  try {
    const res = await fetch(url, options);
    if (res.ok) {
      const data = await res.json();
      setCached(url, data);
      onData(data);
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.error(`Erro ao atualizar dados de ${url}:`, err);
    throw err;
  }
}
