'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  price_ars: number
  duration_minutes: number
  is_active: boolean
}

// ─── Service row component ─────────────────────────────────────────────────────

function ServiceRow({
  service,
  onUpdate,
}: {
  service: Service
  onUpdate: (id: string, changes: Partial<Pick<Service, 'price_ars' | 'is_active'>>) => void
}) {
  const [priceInput, setPriceInput] = useState(String(service.price_ars))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePriceSave() {
    const value = parseFloat(priceInput)
    if (isNaN(value) || value < 0) {
      setError('Precio inválido')
      return
    }
    if (value === service.price_ars) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_ars: value }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setError(json.error ?? 'Error al guardar')
      } else {
        onUpdate(service.id, { price_ars: value })
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !service.is_active }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setError(json.error ?? 'Error al guardar')
      } else {
        onUpdate(service.id, { is_active: !service.is_active })
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start gap-3">
        {/* Active toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={service.is_active}
          aria-label={`${service.is_active ? 'Desactivar' : 'Activar'} ${service.name}`}
          onClick={handleToggleActive}
          disabled={saving}
          className={[
            'relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50',
            service.is_active ? 'bg-gray-900' : 'bg-gray-200',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              service.is_active ? 'translate-x-5' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>

        {/* Name + duration */}
        <div className="min-w-0 flex-1">
          <p className={['font-semibold', service.is_active ? 'text-gray-900' : 'text-gray-400'].join(' ')}>
            {service.name}
          </p>
          <p className="text-xs text-gray-400">{service.duration_minutes} min</p>
        </div>
      </div>

      {/* Price row */}
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={`price-${service.id}`} className="text-sm font-medium text-gray-700">
          Precio
        </label>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm text-gray-500">$</span>
          <input
            id={`price-${service.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step={1}
            value={priceInput}
            onChange={(e) => {
              setPriceInput(e.target.value)
              setError(null)
            }}
            onBlur={handlePriceSave}
            disabled={saving}
            className="w-28 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handlePriceSave}
            disabled={saving}
            className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </li>
  )
}

// ─── Add service form ─────────────────────────────────────────────────────────

function AddServiceForm({ onAdded }: { onAdded: (service: Service) => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = parseFloat(price)
    const durationNum = parseInt(duration, 10)

    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Precio inválido')
      return
    }
    if (isNaN(durationNum) || durationNum < 1) {
      setError('Duración inválida')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), price_ars: priceNum, duration_minutes: durationNum }),
      })
      const json = (await res.json()) as { service?: Service; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Error al agregar')
      } else if (json.service) {
        onAdded(json.service)
        setName('')
        setPrice('')
        setDuration('30')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-3 font-semibold text-gray-900">Agregar servicio</h2>

      <div className="space-y-3">
        <div>
          <label htmlFor="new-name" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            id="new-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Corte + barba"
            maxLength={100}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="new-price" className="mb-1 block text-sm font-medium text-gray-700">
              Precio ($)
            </label>
            <input
              id="new-price"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="w-28">
            <label htmlFor="new-duration" className="mb-1 block text-sm font-medium text-gray-700">
              Duración (min)
            </label>
            <input
              id="new-duration"
              type="number"
              inputMode="numeric"
              min={1}
              max={480}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Agregar servicio'}
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      // Fetch all services (including inactive) for admin management
      const res = await fetch('/api/admin/services')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = (await res.json()) as { services?: Service[]; error?: string }
      if (!res.ok) {
        setFetchError(json.error ?? 'Error al cargar')
      } else {
        setServices(json.services ?? [])
      }
    } catch {
      setFetchError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  function handleUpdate(id: string, changes: Partial<Pick<Service, 'price_ars' | 'is_active'>>) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    )
  }

  function handleAdded(service: Service) {
    setServices((prev) => [...prev, service])
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
        <h1 className="text-xl font-bold text-gray-900">Servicios</h1>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-400">Cargando servicios…</p>
      )}

      {fetchError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          {fetchError}
        </div>
      )}

      {!loading && !fetchError && (
        <div className="space-y-3">
          {/* Active services first, then inactive */}
          <section aria-label="Lista de servicios">
            {services.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                No hay servicios. Agregá uno abajo.
              </p>
            ) : (
              <ul className="space-y-2" aria-label="Servicios">
                {[...services]
                  .sort((a, b) => Number(b.is_active) - Number(a.is_active))
                  .map((service) => (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      onUpdate={handleUpdate}
                    />
                  ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-gray-400 px-1">
            * Los precios anteriores no se modifican. Solo afectan turnos futuros.
          </p>

          {/* Add service form */}
          <AddServiceForm onAdded={handleAdded} />
        </div>
      )}
    </div>
  )
}
