// Cache ultra-rápido no cliente (Memória + LocalStorage) para navegação instantânea estilo App Nativo (0ms de latência percebida)

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const LOCAL_STORAGE_PREFIX = "app_cache_";
const MAX_CACHE_AGE_MS = 15 * 60 * 1000; // 15 minutos para renderização instantânea / offline

export function getCached<T>(key: string): T | null {
  // 1. Memória RAM da sessão ativa
  const item = memoryCache.get(key);
  if (item) return item.data as T;

  // 2. LocalStorage (persiste quando o aplicativo é fechado e reaberto no celular)
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < MAX_CACHE_AGE_MS) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
      }
    } catch {}
  }

  return null;
}

export function setCached<T>(key: string, data: T): void {
  const item = { data, timestamp: Date.now() };
  memoryCache.set(key, item);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(item));
    } catch {}
  }
}

export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
            localStorage.removeItem(key);
          }
        }
      } catch {}
    }
    return;
  }

  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const targetPrefix = LOCAL_STORAGE_PREFIX + keyPrefix;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(targetPrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
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
    // Entrega imediata para a UI pintar em 0ms sem tela preta ou spinners
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
