'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantSettings {
  start_hour?: number
  end_hour?: number
  [key: string]: unknown
}

interface Tenant {
  id: string
  booking_mode: 'request' | 'slots'
  available_days: number
  settings: TenantSettings
}

// ─── Day bitmask helpers ───────────────────────────────────────────────────────

const DAYS = [
  { label: 'Lunes', bit: 1 },
  { label: 'Martes', bit: 2 },
  { label: 'Miércoles', bit: 4 },
  { label: 'Jueves', bit: 8 },
  { label: 'Viernes', bit: 16 },
  { label: 'Sábado', bit: 32 },
] as const

function isDayEnabled(bitmask: number, bit: number): boolean {
  return (bitmask & bit) !== 0
}

function toggleDay(bitmask: number, bit: number): number {
  return bitmask ^ bit
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HorariosPage() {
  const router = useRouter()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [availableDays, setAvailableDays] = useState(62) // Mon–Sat default
  const [startHour, setStartHour] = useState('9')
  const [endHour, setEndHour] = useState('19')

  const loadTenant = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/tenant')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = (await res.json()) as { tenant?: Tenant; error?: string }
      if (!res.ok) {
        setFetchError(json.error ?? 'Error al cargar')
      } else if (json.tenant) {
        setTenant(json.tenant)
        setAvailableDays(json.tenant.available_days)
        setStartHour(String(json.tenant.settings.start_hour ?? 9))
        setEndHour(String(json.tenant.settings.end_hour ?? 19))
      }
    } catch {
      setFetchError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadTenant()
  }, [loadTenant])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    const startNum = parseInt(startHour, 10)
    const endNum = parseInt(endHour, 10)

    if (!Number.isInteger(startNum) || startNum < 0 || startNum > 23) {
      setSaveError('Hora de inicio inválida (0-23)')
      return
    }
    if (!Number.isInteger(endNum) || endNum < 0 || endNum > 23) {
      setSaveError('Hora de cierre inválida (0-23)')
      return
    }
    if (startNum >= endNum) {
      setSaveError('La hora de inicio debe ser menor a la de cierre')
      return
    }
    if (availableDays === 0) {
      setSaveError('Seleccioná al menos un día disponible')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          available_days: availableDays,
          settings: { start_hour: startNum, end_hour: endNum },
        }),
      })
      const json = (await res.json()) as { tenant?: Tenant; error?: string }
      if (!res.ok) {
        setSaveError(json.error ?? 'Error al guardar')
      } else if (json.tenant) {
        setTenant(json.tenant)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setSaveError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Horarios</h1>
          {tenant && tenant.booking_mode !== 'slots' && (
            <p className="text-xs text-amber-600">
              Activo solo en modo Turnos fijos
            </p>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-400">Cargando horarios…</p>
      )}

      {fetchError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          {fetchError}
        </div>
      )}

      {!loading && !fetchError && tenant && (
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          {/* Days */}
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <p className="mb-3 text-sm font-semibold text-gray-700">Días disponibles</p>
            <div className="grid grid-cols-3 gap-2">
              {DAYS.map(({ label, bit }) => {
                const enabled = isDayEnabled(availableDays, bit)
                return (
                  <button
                    key={bit}
                    type="button"
                    role="checkbox"
                    aria-checked={enabled}
                    onClick={() => {
                      setAvailableDays((prev) => toggleDay(prev, bit))
                      setSaveError(null)
                    }}
                    className={[
                      'rounded-xl py-2.5 text-sm font-medium transition-colors',
                      enabled
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hours */}
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <p className="mb-3 text-sm font-semibold text-gray-700">Horario de atención</p>
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="start-hour" className="mb-1 block text-xs text-gray-500">
                  Apertura
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="start-hour"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={22}
                    value={startHour}
                    onChange={(e) => {
                      setStartHour(e.target.value)
                      setSaveError(null)
                    }}
                    className="w-16 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                  />
                  <span className="text-sm text-gray-500">:00</span>
                </div>
              </div>

              <span className="text-gray-400">—</span>

              <div>
                <label htmlFor="end-hour" className="mb-1 block text-xs text-gray-500">
                  Cierre
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="end-hour"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={23}
                    value={endHour}
                    onChange={(e) => {
                      setEndHour(e.target.value)
                      setSaveError(null)
                    }}
                    className="w-16 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                  />
                  <span className="text-sm text-gray-500">:00</span>
                </div>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-red-500">{saveError}</p>
          )}

          {saveSuccess && (
            <p className="text-sm text-green-600">Horarios guardados correctamente.</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar horarios'}
          </button>
        </form>
      )}
    </div>
  )
}
