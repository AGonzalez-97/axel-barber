'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  price_ars: number
  is_active: boolean
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={[
        'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-50',
        checked ? 'bg-amber-400' : 'bg-gray-200',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
          checked ? 'left-[26px]' : 'left-1',
        ].join(' ')}
      />
    </button>
  )
}

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
    if (isNaN(value) || value < 0) { setError('Precio inválido'); return }
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
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  async function handleToggle() {
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
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  return (
    <li className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-center gap-3">
        <Toggle
          checked={service.is_active}
          onChange={handleToggle}
          disabled={saving}
          label={`${service.is_active ? 'Desactivar' : 'Activar'} ${service.name}`}
        />
        <p className={['flex-1 font-semibold', service.is_active ? 'text-gray-900' : 'text-gray-400'].join(' ')}>
          {service.name}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={`price-${service.id}`} className="text-sm font-medium text-gray-700">
          Precio
        </label>
        <span className="text-sm text-gray-500">$</span>
        <input
          id={`price-${service.id}`}
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={priceInput}
          onChange={(e) => { setPriceInput(e.target.value); setError(null) }}
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

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </li>
  )
}

function AddServiceForm({ onAdded }: { onAdded: (service: Service) => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = parseFloat(price)
    if (!name.trim()) { setError('El nombre es requerido'); return }
    if (isNaN(priceNum) || priceNum < 0) { setError('Precio inválido'); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), price_ars: priceNum, duration_minutes: 30 }),
      })
      const json = (await res.json()) as { service?: Service; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Error al agregar')
      } else if (json.service) {
        onAdded(json.service)
        setName('')
        setPrice('')
      }
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
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

        <div>
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

export default function ServiciosPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/services')
      if (res.status === 401) { router.push('/login'); return }
      const json = (await res.json()) as { services?: Service[]; error?: string }
      if (!res.ok) { setFetchError(json.error ?? 'Error al cargar') }
      else { setServices(json.services ?? []) }
    } catch { setFetchError('Error de conexión') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { void loadServices() }, [loadServices])

  function handleUpdate(id: string, changes: Partial<Pick<Service, 'price_ars' | 'is_active'>>) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
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

      {loading && <p className="text-center text-sm text-gray-400">Cargando servicios…</p>}
      {fetchError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{fetchError}</div>
      )}

      {!loading && !fetchError && (
        <div className="space-y-3">
          <ul className="space-y-2">
            {services.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No hay servicios. Agregá uno abajo.</p>
            ) : (
              [...services]
                .sort((a, b) => Number(b.is_active) - Number(a.is_active))
                .map((s) => <ServiceRow key={s.id} service={s} onUpdate={handleUpdate} />)
            )}
          </ul>

          <p className="px-1 text-xs text-gray-400">* Los precios anteriores no se modifican. Solo afectan turnos futuros.</p>

          <AddServiceForm onAdded={(s) => setServices((prev) => [...prev, s])} />
        </div>
      )}
    </div>
  )
}
