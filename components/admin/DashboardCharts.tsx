'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { generateDemoDailyData } from '@/lib/demo-data'

type DailyPoint = { date: string; label: string; cuts: number; revenue: number }
type ServiceCount = { name: string; count: number }

type HistoryData = {
  daily: DailyPoint[]
  services: ServiceCount[]
  totalCuts: number
  totalRevenue: number
  avgPerCut: number
}

const PERIODS = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
]

function formatARS(v: number): string {
  return '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// biome-ignore lint: recharts formatter type is loose
// eslint-disable-next-line
function fmtRevenue(value: unknown) {
  return [formatARS(Number(value ?? 0)), 'Ingresos'] as [string, string]
}

// biome-ignore lint: recharts formatter type is loose
// eslint-disable-next-line
function fmtCuts(value: unknown) {
  return [String(value ?? 0), 'Cortes'] as [string, string]
}

// biome-ignore lint: recharts formatter type is loose
// eslint-disable-next-line
function fmtCombined(value: unknown, name: unknown) {
  if (name === 'revenue') return [formatARS(Number(value ?? 0)), 'Ingresos'] as [string, string]
  return [String(value ?? 0), 'Cortes'] as [string, string]
}

function buildDemoHistory(days: number): HistoryData {
  const daily = generateDemoDailyData(days)
  const services: ServiceCount[] = [
    { name: 'Corte clásico', count: Math.round(daily.reduce((s, d) => s + d.cuts, 0) * 0.45) },
    { name: 'Corte + barba', count: Math.round(daily.reduce((s, d) => s + d.cuts, 0) * 0.30) },
    { name: 'Degradado', count: Math.round(daily.reduce((s, d) => s + d.cuts, 0) * 0.15) },
    { name: 'Barba', count: Math.round(daily.reduce((s, d) => s + d.cuts, 0) * 0.10) },
  ]
  const totalCuts = daily.reduce((s, d) => s + d.cuts, 0)
  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0)
  return { daily, services, totalCuts, totalRevenue, avgPerCut: totalCuts > 0 ? totalRevenue / totalCuts : 0 }
}

type Tab = 'cuts' | 'revenue' | 'combined'

export default function DashboardCharts({
  demo,
  onDemoChange,
}: {
  demo: boolean
  onDemoChange: (v: boolean) => void
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  const cutsColor = isDark ? '#e4e4e7' : '#18181b'
  const gridColor = isDark ? '#27272a' : '#f0f0f0'
  const axisColor = isDark ? '#71717a' : '#9ca3af'
  const tooltipStyle = isDark
    ? { borderRadius: 8, fontSize: 12, backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#fafafa' }
    : { borderRadius: 8, fontSize: 12 }

  const [days, setDays] = useState(30)
  const [liveData, setLiveData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('cuts')

  const demoData = useMemo(() => buildDemoHistory(days), [days])
  const data = demo ? demoData : liveData

  useEffect(() => {
    if (demo) return
    setLoading(true)
    fetch(`/api/admin/stats/history?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setLiveData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [days, demo])

  const isLoading = !demo && loading
  const xInterval = days === 7 ? 0 : days === 30 ? 4 : 9

  return (
    <div className="space-y-6">
      {/* ── Summary cards ── */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cortes</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{data.totalCuts}</p>
            <p className="text-xs text-gray-400">últimos {days} días</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ingresos</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{formatARS(data.totalRevenue)}</p>
            <p className="text-xs text-gray-400">últimos {days} días</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Promedio</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{formatARS(data.avgPerCut)}</p>
            <p className="text-xs text-gray-400">por corte</p>
          </div>
        </div>
      )}

      {/* ── Chart card ── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-100 px-4 py-3 space-y-2">
          {/* Row 1: tabs + demo toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              {(['cuts', 'revenue', 'combined'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {t === 'cuts' ? 'Cortes' : t === 'revenue' ? 'Ingresos' : 'Comb.'}
                </button>
              ))}
            </div>
            <button
              onClick={() => onDemoChange(!demo)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                demo ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:bg-gray-100',
              ].join(' ')}
            >
              {demo ? 'Demo' : 'Demo'}
            </button>
          </div>
          {/* Row 2: period selector */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={[
                  'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors',
                  days === p.days ? 'bg-amber-400 text-zinc-900' : 'text-gray-500 hover:bg-gray-100',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {demo && (
          <div className="border-b border-violet-200 bg-violet-50 px-4 py-2 dark:border-violet-900 dark:bg-violet-950/40">
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Modo demo — datos simulados de 3 meses de actividad</p>
          </div>
        )}

        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">Cargando...</div>
          ) : !data || data.daily.every((d) => d.cuts === 0) ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">Sin datos para este período</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              {tab === 'cuts' ? (
                <BarChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisColor }} interval={xInterval} />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} allowDecimals={false} />
                  <Tooltip formatter={fmtCuts} contentStyle={tooltipStyle} />
                  <Bar dataKey="cuts" fill={cutsColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : tab === 'revenue' ? (
                <BarChart data={data.daily} margin={{ top: 4, right: 4, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisColor }} interval={xInterval} />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={fmtRevenue} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <ComposedChart data={data.daily} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisColor }} interval={xInterval} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: axisColor }} allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: axisColor }}
                    tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'}
                  />
                  <Tooltip formatter={fmtCombined} contentStyle={tooltipStyle} />
                  <Legend
                    iconSize={10}
                    formatter={(v) => (v === 'cuts' ? 'Cortes' : 'Ingresos')}
                    wrapperStyle={{ fontSize: 11, color: axisColor }}
                  />
                  <Bar yAxisId="left" dataKey="cuts" fill={cutsColor} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" dataKey="revenue" stroke="#fbbf24" dot={false} strokeWidth={2} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Services breakdown ── */}
      {data && data.services.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Servicios más pedidos</p>
          </div>
          <ul className="divide-y divide-gray-50 px-4">
            {data.services.map((s) => {
              const pct = data.totalCuts > 0 ? Math.round((s.count / data.totalCuts) * 100) : 0
              return (
                <li key={s.name} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-400">{s.count}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
