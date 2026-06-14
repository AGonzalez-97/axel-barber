import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/loyalty-config
 *
 * Returns the loyalty configuration for the tenant.
 * Auth required — returns 401 if session is missing.
 */
export async function GET(_request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: config, error } = await service
    .from('loyalty_config')
    .select('id, discount_at, free_at, discount_pct, reset_on_redeem, updated_at')
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) {
    console.error('[GET /api/admin/loyalty-config]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ config })
}

/**
 * PATCH /api/admin/loyalty-config
 *
 * Updates loyalty configuration thresholds.
 * Body: { discount_at?: number; discount_pct?: number; free_at?: number }
 *
 * Validation:
 *   - discount_at must be < free_at
 *   - Both > 0
 *   - discount_pct between 1 and 99
 *
 * Note: changes apply to future cuts only — past ledger is immutable.
 *
 * Auth required — returns 401 if session is missing.
 */
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  const updates: { discount_at?: number; free_at?: number; discount_pct?: number; updated_at?: string } = {}

  if ('discount_at' in patch) {
    if (typeof patch.discount_at !== 'number' || !Number.isInteger(patch.discount_at) || patch.discount_at < 1) {
      return NextResponse.json({ error: 'discount_at must be a positive integer' }, { status: 400 })
    }
    updates.discount_at = patch.discount_at
  }

  if ('free_at' in patch) {
    if (typeof patch.free_at !== 'number' || !Number.isInteger(patch.free_at) || patch.free_at < 1) {
      return NextResponse.json({ error: 'free_at must be a positive integer' }, { status: 400 })
    }
    updates.free_at = patch.free_at
  }

  if ('discount_pct' in patch) {
    if (typeof patch.discount_pct !== 'number' || patch.discount_pct < 1 || patch.discount_pct > 99) {
      return NextResponse.json({ error: 'discount_pct must be between 1 and 99' }, { status: 400 })
    }
    updates.discount_pct = patch.discount_pct
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Cross-field validation: need both values to compare.
  // Fetch current config to fill in whichever field isn't being patched.
  const service = createServiceClient()

  const { data: current, error: fetchError } = await service
    .from('loyalty_config')
    .select('discount_at, free_at')
    .eq('tenant_id', TENANT_ID)
    .single<{ discount_at: number; free_at: number }>()

  if (fetchError || !current) {
    console.error('[PATCH /api/admin/loyalty-config] fetch current:', fetchError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const finalDiscountAt = updates.discount_at ?? current.discount_at
  const finalFreeAt = updates.free_at ?? current.free_at

  if (finalDiscountAt >= finalFreeAt) {
    return NextResponse.json(
      { error: 'discount_at must be less than free_at' },
      { status: 400 },
    )
  }

  updates.updated_at = new Date().toISOString()

  const { data: updated, error: updateError } = await service
    .from('loyalty_config')
    .update(updates)
    .eq('tenant_id', TENANT_ID)
    .select('id, discount_at, free_at, discount_pct, reset_on_redeem, updated_at')
    .single()

  if (updateError) {
    console.error('[PATCH /api/admin/loyalty-config] update:', updateError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ config: updated })
}
