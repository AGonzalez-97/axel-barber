import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tenant
 *
 * Returns the tenant row for the current admin.
 * Fields: id, name, slug, booking_mode, payment_alias, available_days, settings
 *
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

  const { data: tenant, error } = await service
    .from('tenants')
    .select('id, name, slug, booking_mode, payment_alias, available_days, settings')
    .eq('id', TENANT_ID)
    .single()

  if (error) {
    console.error('[GET /api/admin/tenant]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ tenant })
}

/**
 * PATCH /api/admin/tenant
 *
 * Updates allowed tenant fields.
 * Body: {
 *   booking_mode?: 'request' | 'slots';
 *   available_days?: number;          // bitmask 0-63
 *   settings?: { start_hour?: number; end_hour?: number };
 * }
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
  const updates: {
    booking_mode?: 'request' | 'slots'
    available_days?: number
    settings?: Record<string, unknown>
    payment_alias?: string
  } = {}

  if ('payment_alias' in patch) {
    if (typeof patch.payment_alias !== 'string' || patch.payment_alias.trim().length === 0) {
      return NextResponse.json({ error: 'payment_alias must be a non-empty string' }, { status: 400 })
    }
    updates.payment_alias = patch.payment_alias.trim()
  }

  if ('booking_mode' in patch) {
    if (patch.booking_mode !== 'request' && patch.booking_mode !== 'slots') {
      return NextResponse.json(
        { error: "booking_mode must be 'request' or 'slots'" },
        { status: 400 },
      )
    }
    updates.booking_mode = patch.booking_mode
  }

  if ('available_days' in patch) {
    if (
      typeof patch.available_days !== 'number' ||
      !Number.isInteger(patch.available_days) ||
      patch.available_days < 0 ||
      patch.available_days > 63
    ) {
      return NextResponse.json(
        { error: 'available_days must be an integer bitmask between 0 and 63' },
        { status: 400 },
      )
    }
    updates.available_days = patch.available_days
  }

  if ('settings' in patch) {
    if (typeof patch.settings !== 'object' || patch.settings === null || Array.isArray(patch.settings)) {
      return NextResponse.json({ error: 'settings must be an object' }, { status: 400 })
    }

    const settingsPatch = patch.settings as Record<string, unknown>

    // Fetch current settings to merge
    const service = createServiceClient()
    const { data: current } = await service
      .from('tenants')
      .select('settings')
      .eq('id', TENANT_ID)
      .single<{ settings: Record<string, unknown> }>()

    const currentSettings = current?.settings ?? {}

    // Validate start_hour / end_hour if provided
    if ('start_hour' in settingsPatch) {
      const h = settingsPatch.start_hour
      if (typeof h !== 'number' || !Number.isInteger(h) || h < 0 || h > 23) {
        return NextResponse.json({ error: 'start_hour must be an integer 0-23' }, { status: 400 })
      }
    }
    if ('end_hour' in settingsPatch) {
      const h = settingsPatch.end_hour
      if (typeof h !== 'number' || !Number.isInteger(h) || h < 0 || h > 23) {
        return NextResponse.json({ error: 'end_hour must be an integer 0-23' }, { status: 400 })
      }
    }

    const finalStart = ('start_hour' in settingsPatch ? settingsPatch.start_hour : currentSettings.start_hour) as number | undefined
    const finalEnd = ('end_hour' in settingsPatch ? settingsPatch.end_hour : currentSettings.end_hour) as number | undefined

    if (finalStart !== undefined && finalEnd !== undefined && finalStart >= finalEnd) {
      return NextResponse.json(
        { error: 'start_hour must be less than end_hour' },
        { status: 400 },
      )
    }

    updates.settings = { ...currentSettings, ...settingsPatch }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: updated, error } = await service
    .from('tenants')
    .update(updates)
    .eq('id', TENANT_ID)
    .select('id, name, slug, booking_mode, payment_alias, available_days, settings')
    .single()

  if (error) {
    console.error('[PATCH /api/admin/tenant]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ tenant: updated })
}
