import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats/daily
 *
 * Returns today's stats from the daily_stats Postgres view.
 * Requires an active Supabase auth session.
 *
 * Response:
 *   200 { tenant_id, date, total_cuts, total_revenue, avg_revenue_per_cut }
 *   200 { tenant_id: null, ... } with zero values when no cuts today
 *   401 when unauthenticated
 */
export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('daily_stats')
    .select('tenant_id, date, total_cuts, total_revenue, avg_revenue_per_cut')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (error) {
    console.error('[/api/admin/stats/daily]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // No cuts today: return explicit zero values so the dashboard renders cleanly
  if (!data) {
    return NextResponse.json({
      tenant_id: TENANT_ID,
      date: new Date().toISOString().slice(0, 10),
      total_cuts: 0,
      total_revenue: 0,
      avg_revenue_per_cut: 0,
    })
  }

  return NextResponse.json(data)
}
