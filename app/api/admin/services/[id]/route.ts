import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/services/[id]
 *
 * Updates price_ars and/or is_active for a service.
 * Body: { price_ars?: number; is_active?: boolean }
 *
 * Note: price_charged on past cuts is IMMUTABLE — this only affects future bookings.
 *
 * Auth required — returns 401 if session is missing.
 * Returns 404 if the service does not belong to the tenant.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // 1. Verify auth session
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  // 2. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 })
  }

  const patch = body as Record<string, unknown>
  const updates: { price_ars?: number; is_active?: boolean } = {}

  if ('price_ars' in patch) {
    if (typeof patch.price_ars !== 'number' || patch.price_ars < 0) {
      return NextResponse.json({ error: 'price_ars must be a non-negative number' }, { status: 400 })
    }
    updates.price_ars = patch.price_ars
  }

  if ('is_active' in patch) {
    if (typeof patch.is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
    }
    updates.is_active = patch.is_active
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // 3. Update service (service role — bypasses RLS)
  const service = createServiceClient()

  const { data: updated, error } = await service
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .select('id, name, price_ars, duration_minutes, is_active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows matched — either not found or wrong tenant
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    console.error('[PATCH /api/admin/services/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ service: updated })
}
