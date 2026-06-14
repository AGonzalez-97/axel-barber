'use client'

import { useState } from 'react'

type BookingMode = 'request' | 'slots'

interface Props {
  initialMode: BookingMode
}

/**
 * BookingModeToggle
 *
 * Lets Leo switch between "Solicitudes" (request mode — manual confirmation)
 * and "Turnos fijos" (slots mode — clients book instantly from available slots).
 *
 * Persists the choice via PATCH /api/admin/tenant.
 */
export default function BookingModeToggle({ initialMode }: Props) {
  const [mode, setMode] = useState<BookingMode>(initialMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(selected: BookingMode) {
    if (selected === mode || saving) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_mode: selected }),
      })
      const json = (await res.json()) as { tenant?: { booking_mode: BookingMode }; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Error al guardar')
      } else if (json.tenant) {
        setMode(json.tenant.booking_mode)
        // Refresh the page so conditional links (horarios) update
        window.location.reload()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Modo de reserva">
        {/* Solicitudes */}
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'request'}
          onClick={() => handleSelect('request')}
          disabled={saving}
          className={[
            'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-colors disabled:opacity-60',
            mode === 'request'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div>
            <p className="text-sm font-semibold">Solicitudes</p>
            <p className={['mt-0.5 text-xs', mode === 'request' ? 'text-gray-300' : 'text-gray-400'].join(' ')}>
              Clientes piden, vos confirmás
            </p>
          </div>
          {mode === 'request' && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
              Activo
            </span>
          )}
        </button>

        {/* Turnos fijos */}
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'slots'}
          onClick={() => handleSelect('slots')}
          disabled={saving}
          className={[
            'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-colors disabled:opacity-60',
            mode === 'slots'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <p className="text-sm font-semibold">Turnos fijos</p>
            <p className={['mt-0.5 text-xs', mode === 'slots' ? 'text-gray-300' : 'text-gray-400'].join(' ')}>
              Clientes eligen y reservan solo
            </p>
          </div>
          {mode === 'slots' && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
              Activo
            </span>
          )}
        </button>
      </div>

      {saving && (
        <p className="mt-2 text-center text-xs text-gray-400">Guardando…</p>
      )}
      {error && (
        <p className="mt-2 text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
