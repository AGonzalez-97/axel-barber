'use client'

import { useState } from 'react'

interface EditAliasFormProps {
  initialAlias: string
}

export default function EditAliasForm({ initialAlias }: EditAliasFormProps) {
  const [alias, setAlias] = useState(initialAlias)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialAlias)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!draft.trim() || draft.trim() === alias) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_alias: draft.trim() }),
      })
      const body = await res.json() as { tenant?: { payment_alias: string }; error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Error al guardar')
      setAlias(body.tenant?.payment_alias ?? draft.trim())
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        <span className="flex-1 font-mono text-sm font-semibold text-gray-800">{alias}</span>
        <button
          onClick={() => { setDraft(alias); setEditing(true) }}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
        >
          Editar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Alias de Mercado Pago / transferencia"
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 font-mono text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="flex-1 rounded-xl bg-gray-900 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
