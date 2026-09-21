'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getSyncQueueCount, processSyncQueue, initOfflineSync } from '@/lib/offline-sync'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  const refreshCount = async () => {
    const count = await getSyncQueueCount()
    setPendingCount(count)
  }

  useEffect(() => {
    // Estado inicial
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    refreshCount()

    // Inicializa listener de reconexão
    initOfflineSync()

    const handleOnline = async () => {
      setIsOnline(true)
      const count = await getSyncQueueCount()
      if (count > 0) {
        setSyncing(true)
        const result = await processSyncQueue()
        setSyncing(false)
        await refreshCount()
        if (result.success > 0) {
          setJustSynced(true)
          setTimeout(() => setJustSynced(false), 3000)
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustSynced(false)
    }

    const handleQueueChanged = () => refreshCount()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('sync-queue-changed', handleQueueChanged as EventListener)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('sync-queue-changed', handleQueueChanged as EventListener)
    }
  }, [])

  // Tela limpa — não exibe nada quando online e sem pendências
  if (isOnline && pendingCount === 0 && !syncing && !justSynced) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-medium transition-all duration-300
        ${syncing
          ? 'bg-blue-600 text-white'
          : justSynced
          ? 'bg-emerald-600 text-white'
          : isOnline && pendingCount > 0
          ? 'bg-amber-500 text-zinc-900'
          : 'bg-zinc-800/95 text-zinc-200 backdrop-blur-sm'
        }`}
    >
      {syncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>Sincronizando {pendingCount} ação{pendingCount !== 1 ? 'ões' : ''} salva{pendingCount !== 1 ? 's' : ''} offline…</span>
        </>
      ) : justSynced ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Sincronização concluída!</span>
        </>
      ) : isOnline && pendingCount > 0 ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>{pendingCount} ação{pendingCount !== 1 ? 'ões' : ''} offline aguardando sincronização</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline — visualizando dados em cache</span>
        </>
      )}
    </div>
  )
}
