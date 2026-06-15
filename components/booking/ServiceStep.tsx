'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Service = {
  id: string
  name: string
  price_ars: number
  duration_minutes: number
}

function formatARS(amount: number): string {
  return '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function ServiceStep() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data: { services?: Service[]; error?: string }) => {
        if (data.error) throw new Error(data.error)
        setServices(data.services ?? [])
      })
      .catch(() => setError('No se pudieron cargar los servicios. Intentá de nuevo.'))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(id: string) {
    router.push(`/book?step=date&service=${id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">Reserva online</span>
        </div>
        <h1 className="mt-4 text-3xl font-black text-white">Elegí tu servicio</h1>
        <p className="mt-1 text-zinc-400">Seleccioná lo que querés y elegimos el horario</p>

        <div className="mt-8">
          {loading && (
            <div className="space-y-3" role="status" aria-label="Cargando servicios">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-800" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center text-sm text-zinc-400">
              No hay servicios disponibles por el momento.
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.id}>
                  <button
                    onClick={() => handleSelect(service.id)}
                    className="group flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-5 text-left transition-all hover:border-amber-400/40 hover:bg-zinc-800 active:scale-[0.98]"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {service.name}
                    </span>
                    <span className="ml-4 shrink-0 rounded-xl bg-amber-400/10 px-4 py-1.5 text-base font-black text-amber-400">
                      {formatARS(service.price_ars)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
