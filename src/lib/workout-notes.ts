// Utilitário para serializar/desserializar blocos de orientação do plano de treino
// Armazenado no campo `notes` (String?) do WorkoutPlan como JSON

export interface NoteBlock {
  id: string
  title: string    // rótulo livre: "Segunda — Empurrada", "Treino A", etc.
  content: string  // texto livre com as instruções
}

interface NotesV2 {
  v: 2
  blocks: NoteBlock[]
}

/**
 * Converte o campo `notes` (string JSON ou texto simples legado) para array de blocos.
 * - JSON { v:2, blocks: [...] }  → retorna os blocos
 * - String simples (planos antigos) → migra para 1 bloco com título "Orientações"
 * - null / vazio → retorna []
 */
export function parseNotes(raw: string | null | undefined): NoteBlock[] {
  if (!raw || !raw.trim()) return []

  try {
    const parsed = JSON.parse(raw) as NotesV2
    if (parsed.v === 2 && Array.isArray(parsed.blocks)) {
      return parsed.blocks
    }
  } catch {
    // Não é JSON válido — texto simples (plano antigo)
  }

  // Migração automática: texto plano → bloco único
  return [{ id: 'legacy_0', title: 'Orientações', content: raw.trim() }]
}

/**
 * Serializa blocos para string a ser salva no campo `notes` do banco.
 * - 0 blocos preenchidos → null
 * - 1 bloco legado (id='legacy_0') sem alteração de título → string simples
 * - 2+ blocos ou 1 bloco novo → JSON { v:2, blocks }
 */
export function serializeNotes(blocks: NoteBlock[]): string | null {
  const filled = blocks.filter(b => b.title.trim() || b.content.trim())
  if (filled.length === 0) return null
  const data: NotesV2 = { v: 2, blocks: filled }
  return JSON.stringify(data)
}

/** Cria um novo bloco vazio com ID único */
export function createNoteBlock(): NoteBlock {
  return { id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title: '', content: '' }
}
