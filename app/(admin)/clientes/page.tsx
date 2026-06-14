import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TENANT_ID } from '@/lib/tenant'
import { getLoyaltyStatusLabel } from '@/lib/loyalty'
import type { LoyaltyConfig } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string
  name: string
  phone: string
  created_at: string
}

interface ClientWithStats extends ClientRow {
  total_cuts: number
  current_cycle_count: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats an E.164 phone number for display.
 * +5491123456789 → +54 9 11 2345-6789
 * Falls back to showing the raw value if it doesn't match.
 */
function formatPhone(phone: string): string {
  // Argentine mobile: +549 + 10 digits
  const mobileMatch = phone.match(/^\+549(\d{2})(\d{4})(\d{4})$/)
  if (mobileMatch) {
    return `+54 9 ${mobileMatch[1]} ${mobileMatch[2]}-${mobileMatch[3]}`
  }
  // Landline: +54 + 2-3 digit area + remaining
  const landlineMatch = phone.match(/^\+54(\d{2,3})(\d{4})(\d{4})$/)
  if (landlineMatch) {
    return `+54 ${landlineMatch[1]} ${landlineMatch[2]}-${landlineMatch[3]}`
  }
  return phone
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchClients(q: string): Promise<ClientWithStats[]> {
  const service = createServiceClient()

  // 1. Fetch clients (filtered by search query if provided)
  let clientQuery = service
    .from('clients')
    .select('id, name, phone, created_at')
    .eq('tenant_id', TENANT_ID)
    .order('name', { ascending: true })

  if (q.trim()) {
    // ILIKE on name or phone — Supabase supports .or() with filter syntax
    clientQuery = clientQuery.or(
      `name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`,
    )
  }

  const { data: clients, error } = await clientQuery.returns<ClientRow[]>()

  if (error) {
    console.error('[ClientesPage] fetchClients error:', error)
    return []
  }

  if (!clients || clients.length === 0) return []

  // 2. For each client, fetch total_cuts and current_cycle_count in parallel
  const statsPromises = clients.map(async (client): Promise<ClientWithStats> => {
    // Total cuts (all time)
    const { count: total_cuts } = await service
      .from('cuts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('client_id', client.id)

    // Current cycle count: cut_completed events after the last cycle_reset
    const { data: lastReset } = await service
      .from('loyalty_ledger')
      .select('created_at')
      .eq('tenant_id', TENANT_ID)
      .eq('client_id', client.id)
      .eq('event', 'cycle_reset')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>()

    let cycleQuery = service
      .from('loyalty_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('client_id', client.id)
      .eq('event', 'cut_completed')

    if (lastReset?.created_at) {
      cycleQuery = cycleQuery.gt('created_at', lastReset.created_at)
    }

    const { count: current_cycle_count } = await cycleQuery

    return {
      ...client,
      total_cuts: total_cuts ?? 0,
      current_cycle_count: current_cycle_count ?? 0,
    }
  })

  return Promise.all(statsPromises)
}

async function fetchLoyaltyConfig(): Promise<LoyaltyConfig> {
  const service = createServiceClient()
  const { data } = await service
    .from('loyalty_config')
    .select('discount_at, free_at, discount_pct, reset_on_redeem')
    .eq('tenant_id', TENANT_ID)
    .single<LoyaltyConfig>()

  return (
    data ?? {
      discount_at: 3,
      free_at: 6,
      discount_pct: 15,
      reset_on_redeem: true,
    }
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  // Auth guard
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const q = searchParams.q ?? ''

  const [clients, loyaltyConfig] = await Promise.all([
    fetchClients(q),
    fetchLoyaltyConfig(),
  ])

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
          {q && ' encontrados'}
        </p>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <form method="GET" action="/clientes" className="mb-5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o teléfono…"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </form>

      {/* ── Client list ─────────────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-gray-200">
          {q ? (
            <>
              <p className="text-sm font-medium text-gray-700">
                Sin resultados para &ldquo;{q}&rdquo;
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Intentá buscar por nombre completo o número de teléfono.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              No hay clientes registrados aún.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Lista de clientes">
          {clients.map((client) => {
            const loyaltyLabel = getLoyaltyStatusLabel(
              client.current_cycle_count,
              loyaltyConfig,
            )

            return (
              <li key={client.id}>
                <Link
                  href={`/clientes/${client.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md active:shadow-sm"
                >
                  {/* Avatar initial */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + phone + loyalty */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {client.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {formatPhone(client.phone)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {loyaltyLabel}
                    </p>
                  </div>

                  {/* Total cuts badge */}
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {client.total_cuts}{' '}
                      {client.total_cuts === 1 ? 'corte' : 'cortes'}
                    </span>
                  </div>

                  {/* Chevron */}
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
