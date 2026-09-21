// Motor de sincronização offline — processa fila de ações pendentes
// quando a conexão é restaurada

import { getDb } from './db-offline'

/** Adiciona uma ação à fila de sync (usado quando offline) */
export async function queueSync(
  url: string,
  method: string,
  body: unknown,
  description: string
): Promise<void> {
  if (typeof window === 'undefined') return
  const db = getDb()
  await db.syncQueue.add({
    url,
    method,
    body: body != null ? JSON.stringify(body) : null,
    headers: { 'Content-Type': 'application/json' },
    timestamp: Date.now(),
    retries: 0,
    description,
  })
  window.dispatchEvent(new CustomEvent('sync-queue-changed'))
}

/** Retorna quantas ações estão pendentes de sync */
export async function getSyncQueueCount(): Promise<number> {
  if (typeof window === 'undefined') return 0
  try {
    const db = getDb()
    return await db.syncQueue.count()
  } catch {
    return 0
  }
}

/** Processa todos os itens da fila de sync */
export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  if (typeof window === 'undefined') return { success: 0, failed: 0 }

  const db = getDb()
  const items = await db.syncQueue.orderBy('timestamp').toArray()

  let success = 0
  let failed = 0

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })

      if (res.ok) {
        await db.syncQueue.delete(item.id!)
        success++
      } else {
        // Erro do servidor — incrementa tentativas
        const newRetries = item.retries + 1
        if (newRetries >= 5) {
          // Desiste após 5 tentativas — remove da fila
          await db.syncQueue.delete(item.id!)
        } else {
          await db.syncQueue.update(item.id!, { retries: newRetries })
        }
        failed++
      }
    } catch {
      // Erro de rede — mantém na fila para próxima tentativa
      failed++
    }
  }

  window.dispatchEvent(new CustomEvent('sync-queue-changed'))
  return { success, failed }
}

/**
 * Wrapper para requisições que suporta offline:
 * - Online: faz a requisição normalmente
 * - Offline: enfileira e retorna resposta fake de sucesso (200)
 *
 * Uso: substitua `fetch(url, opts)` por `offlineAwareFetch(url, opts, "Descrição")`
 * nas páginas para ações que devem funcionar offline.
 */
export async function offlineAwareFetch(
  url: string,
  options: RequestInit,
  description: string
): Promise<Response> {
  if (navigator.onLine) {
    return fetch(url, options)
  }

  // Offline: enfileira para sync posterior
  let body: unknown = null
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
    } catch {
      body = options.body
    }
  }

  await queueSync(url, options.method || 'POST', body, description)

  // Retorna resposta fake para não quebrar o fluxo do componente
  return new Response(
    JSON.stringify({ queued: true, offline: true, description }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

/** Inicializa o listener de reconexão — chame uma vez no layout */
export function initOfflineSync(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('online', async () => {
    const count = await getSyncQueueCount()
    if (count > 0) {
      console.log(`[Sync] Online. Sincronizando ${count} ação(ões) pendente(s)...`)
      await processSyncQueue()
    }
  })
}
