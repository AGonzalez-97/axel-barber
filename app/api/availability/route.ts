import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export interface SlotStatus {
  time: string      // "HH:MM"
  available: boolean
}

/**
 * GET /api/availability?date=YYYY-MM-DD
 * Public endpoint — no auth required.
 *
 * Returns ALL 30-minute slots for the day with availability status.
 * Available = not already booked (pending or confirmed).
 * Uses get_available_slots RPC to determine which slots are free.
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Missing or invalid date (expected YYYY-MM-DD)' },
      { status: 400 },
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Get tenant settings for start/end hours (defaults: 9–19)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', TENANT_ID)
    .single<{ settings: { start_hour?: number; end_hour?: number } | null }>()

  const startHour = tenant?.settings?.start_hour ?? 9
  const endHour = tenant?.settings?.end_hour ?? 19

  // Generate all 30-min slots in [startHour, endHour)
  const allSlots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    allSlots.push(`${String(h).padStart(2, '0')}:00`)
    allSlots.push(`${String(h).padStart(2, '0')}:30`)
  }

  // Get available slots from RPC
  const { data: rpcData, error } = await supabase.rpc('get_available_slots', {
    p_tenant_id: TENANT_ID,
    p_date: date,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }

  const availableSet = new Set<string>(
    (rpcData ?? []).map((row: { slot_time: string }) => {
      const d = new Date(row.slot_time)
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    }),
  )

  const slots: SlotStatus[] = allSlots.map((time) => ({
    time,
    available: availableSet.has(time),
  }))

  return NextResponse.json({ slots })
}
