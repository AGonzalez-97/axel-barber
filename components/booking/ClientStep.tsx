'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ClientStepProps = {
  serviceId: string
  date: string
  time: string
}

type BookingResult = {
  booking_id: string
  status: string
  service_name: string
  starts_at: string
  client_name: string
  loyalty_label: string
}

export function ClientStep({ serviceId, date, time }: ClientStepProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          date,
          time,
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim() || undefined,
        }),
      })

      const data = (await res.json()) as BookingResult & { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Ocurrió un error. Intentá de nuevo.')
        return
      }

      const params = new URLSearchParams({
        booking_id: data.booking_id,
        service_name: data.service_name,
        starts_at: data.starts_at,
        client_name: data.client_name,
        loyalty_label: data.loyalty_label,
        status: data.status,
      })

      router.push(`/confirmation?${params.toString()}`)
    } catch {
      setError('No se pudo conectar con el servidor. Verificá tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  function formatDisplayDate(dateStr: string, timeStr: string): string {
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      const dateLabel = dt.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      return `${dateLabel} a las ${timeStr}`
    } catch {
      return `${dateStr} ${timeStr}`
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => router.push(`/book?step=date&service=${serviceId}`)}
          className="mb-8 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
          aria-label="Volver al selector de fecha"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver
        </button>

        <h1 className="text-3xl font-black text-white">Tus datos</h1>
        <p className="mt-1 capitalize text-zinc-400">{formatDisplayDate(date, time)}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="client-name" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Nombre
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="given-name"
              required
              minLength={2}
              maxLength={100}
              className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-white placeholder-zinc-600 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="client-phone" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Teléfono
            </label>
            <input
              id="client-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 3815313592"
              autoComplete="tel"
              required
              inputMode="numeric"
              className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-white placeholder-zinc-600 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <p className="mt-1 text-xs text-zinc-600">Solo el número, sin 0 ni 15</p>
          </div>

          {/* Notes (optional) */}
          <div>
            <label htmlFor="client-notes" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-300">
              Comentarios
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">Opcional</span>
            </label>
            <textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Algún estilo o preferencia en particular? Contanos acá..."
              maxLength={300}
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <p className="mt-1 text-right text-xs text-zinc-600">{notes.length}/300</p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !phone.trim()}
            className="h-14 w-full rounded-xl bg-amber-400 text-base font-bold text-zinc-900 transition-all hover:bg-amber-300 active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? 'Reservando...' : 'Confirmar turno'}
          </button>
        </form>
      </div>
    </div>
  )
}
