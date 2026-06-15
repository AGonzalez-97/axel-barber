'use client'

import { useEffect, useState } from 'react'
import { getDemoPeriodStats } from '@/lib/demo-data'

type PeriodData = { cuts: number; revenue: number; label: string }

function formatARS(v: number): string {
  return '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function PeriodSection({ type, demo }: { type: 'week' | 'month'; demo: boolean }) {
  const [offset, setOffset] = useState(0)
  const [liveData, setLiveData] = useState<PeriodData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (demo) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/admin/stats/period?type=${type}&offset=${offset}`)
      .then((r) => r.json())
      .then((d) => { setLiveData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [type, offset, demo])

  const data: PeriodData | null = demo
    ? getDemoPeriodStats(type, offset)
    : liveData

  const fallbackLabel = type === 'week' ? 'Esta semana' : 'Este mes'

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {loading || !data ? fallbackLabel : data.label}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            aria-label="Período anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Período siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cortes</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {loading && !demo ? '—' : String(data?.cuts ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ingresos</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {loading && !demo ? '—' : formatARS(data?.revenue ?? 0)}
          </p>
        </div>
      </div>
    </section>
  )
}

export default function PeriodStats({ demo }: { demo: boolean }) {
  return (
    <div className="space-y-4">
      <PeriodSection type="week" demo={demo} />
      <PeriodSection type="month" demo={demo} />
    </div>
  )
}
