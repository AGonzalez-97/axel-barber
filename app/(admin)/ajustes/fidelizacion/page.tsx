'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoyaltyConfig {
  id: string
  discount_at: number
  free_at: number
  discount_pct: number
  reset_on_redeem: boolean
  updated_at: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FidelizacionPage() {
  const router = useRouter()

  const [config, setConfig] = useState<LoyaltyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form state
  const [discountAt, setDiscountAt] = useState('')
  const [discountPct, setDiscountPct] = useState('')
  const [freeAt, setFreeAt] = useState('')

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/loyalty-config')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = (await res.json()) as { config?: LoyaltyConfig; error?: string }
      if (!res.ok) {
        setFetchError(json.error ?? 'Error al cargar')
      } else if (json.config) {
        setConfig(json.config)
        setDiscountAt(String(json.config.discount_at))
        setDiscountPct(String(json.config.discount_pct))
        setFreeAt(String(json.config.free_at))
      }
    } catch {
      setFetchError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    const discountAtNum = parseInt(discountAt, 10)
    const discountPctNum = parseFloat(discountPct)
    const freeAtNum = parseInt(freeAt, 10)

    if (!Number.isInteger(discountAtNum) || discountAtNum < 1) {
      setSaveError('El corte de descuento debe ser un entero mayor a 0')
      return
    }
    if (!Number.isInteger(freeAtNum) || freeAtNum < 1) {
      setSaveError('El corte gratis debe ser un entero mayor a 0')
      return
    }
    if (isNaN(discountPctNum) || discountPctNum < 1 || discountPctNum > 99) {
      setSaveError('El porcentaje debe estar entre 1 y 99')
      return
    }
    if (discountAtNum >= freeAtNum) {
      setSaveError('El corte de descuento debe ser menor al corte gratis')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/loyalty-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_at: discountAtNum,
          discount_pct: discountPctNum,
          free_at: freeAtNum,
        }),
      })
      const json = (await res.json()) as { config?: LoyaltyConfig; error?: string }
      if (!res.ok) {
        setSaveError(json.error ?? 'Error al guardar')
      } else if (json.config) {
        setConfig(json.config)
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
        <h1 className="text-xl font-bold text-gray-900">Fidelización</h1>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-400">Cargando configuración…</p>
      )}

      {fetchError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          {fetchError}
        </div>
      )}

      {!loading && !fetchError && config && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Info card */}
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
            Los cambios aplican a partir del próximo ciclo de cada cliente.
          </div>

          {/* discount_at */}
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <label htmlFor="discount-at" className="block text-sm font-semibold text-gray-700">
              Descuento en el corte N°
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              En qué corte del ciclo se aplica el descuento
            </p>
            <input
              id="discount-at"
              type="number"
              inputMode="numeric"
              min={1}
              value={discountAt}
              onChange={(e) => {
                setDiscountAt(e.target.value)
                setSaveError(null)
              }}
              className="mt-3 w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* discount_pct */}
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <label htmlFor="discount-pct" className="block text-sm font-semibold text-gray-700">
              Porcentaje de descuento (%)
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              Descuento aplicado al precio del servicio
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                id="discount-pct"
                type="number"
                inputMode="decimal"
                min={1}
                max={99}
                step={1}
                value={discountPct}
                onChange={(e) => {
                  setDiscountPct(e.target.value)
                  setSaveError(null)
                }}
                className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          {/* free_at */}
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <label htmlFor="free-at" className="block text-sm font-semibold text-gray-700">
              Corte gratis en el corte N°
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              En qué corte del ciclo el cliente recibe un corte gratuito
            </p>
            <input
              id="free-at"
              type="number"
              inputMode="numeric"
              min={2}
              value={freeAt}
              onChange={(e) => {
                setFreeAt(e.target.value)
                setSaveError(null)
              }}
              className="mt-3 w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Preview */}
          {!saveError && parseInt(discountAt, 10) > 0 && parseInt(freeAt, 10) > 0 && parseFloat(discountPct) > 0 && (
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-200">
              <p>Vista previa del ciclo:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                <li>Cortes 1–{parseInt(discountAt, 10) - 1}: precio normal</li>
                <li>Corte {discountAt}: {discountPct}% de descuento</li>
                {parseInt(freeAt, 10) > parseInt(discountAt, 10) + 1 && (
                  <li>Cortes {parseInt(discountAt, 10) + 1}–{parseInt(freeAt, 10) - 1}: precio normal</li>
                )}
                <li>Corte {freeAt}: ¡gratis! y reinicia el ciclo</li>
              </ul>
            </div>
          )}

          {saveError && (
            <p className="text-sm text-red-500">{saveError}</p>
          )}

          {saveSuccess && (
            <p className="text-sm text-green-600">Configuración guardada correctamente.</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </div>
  )
}
