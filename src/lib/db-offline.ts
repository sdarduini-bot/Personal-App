// Banco IndexedDB local do Trainer Pro — substitui localStorage, sem limite de 5MB
// Dexie.js: wrapper moderno e tipado para IndexedDB

import Dexie, { type Table } from 'dexie'

/** Entrada de cache de API (substituindo localStorage) */
export interface CacheEntry {
  key: string        // URL da API, ex: "/api/students"
  data: unknown
  timestamp: number  // ms desde epoch
}

/** Item na fila de sincronização (ações feitas offline) */
export interface SyncQueueItem {
  id?: number                     // auto-increment PK
  url: string                     // ex: "/api/payments"
  method: string                  // POST, PUT, PATCH, DELETE
  body: string | null             // JSON.stringify do payload
  headers: Record<string, string>
  timestamp: number
  retries: number                 // tentativas de sync feitas
  description: string             // ex: "Pagamento R$380 – João Silva Set/26"
}

class TrainerProDB extends Dexie {
  cache!: Table<CacheEntry>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('trainer_pro_v1')
    this.version(1).stores({
      cache: 'key, timestamp',
      syncQueue: '++id, timestamp',
    })
  }
}

// Singleton — criado apenas no cliente
let _db: TrainerProDB | null = null

export function getDb(): TrainerProDB {
  if (typeof window === 'undefined') {
    throw new Error('getDb() só pode ser chamado no cliente (browser)')
  }
  if (!_db) {
    _db = new TrainerProDB()
  }
  return _db
}
