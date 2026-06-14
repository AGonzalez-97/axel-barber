import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/services
 *
 * Returns all services for the tenant (including inactive) for admin management.
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

  const { data: services, error } = await service
    .from('services')
    .select('id, name, price_ars, duration_minutes, is_active, created_at')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/admin/services]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ services: services ?? [] })
}

/**
 * POST /api/admin/services
 *
 * Creates a new service for the tenant.
 * Body: { name: string; price_ars: number; duration_minutes: number }
 *
 * Auth required — returns 401 if session is missing.
 */
export async function POST(request: NextRequest) {
  // 1. Verify auth session
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).name !== 'string' ||
    typeof (body as Record<string, unknown>).price_ars !== 'number' ||
    typeof (body as Record<string, unknown>).duration_minutes !== 'number'
  ) {
    return NextResponse.json(
      { error: 'name (string), price_ars (number), and duration_minutes (number) are required' },
      { status: 400 },
    )
  }

  const { name, price_ars, duration_minutes } = body as {
    name: string
    price_ars: number
    duration_minutes: number
  }

  if (name.trim().length < 1 || name.trim().length > 100) {
    return NextResponse.json(
      { error: 'name must be between 1 and 100 characters' },
      { status: 400 },
    )
  }

  if (price_ars < 0) {
    return NextResponse.json({ error: 'price_ars must be >= 0' }, { status: 400 })
  }

  if (duration_minutes < 1 || duration_minutes > 480) {
    return NextResponse.json(
      { error: 'duration_minutes must be between 1 and 480' },
      { status: 400 },
    )
  }

  // 3. Insert service
  const service = createServiceClient()

  const { data: created, error } = await service
    .from('services')
    .insert({
      tenant_id: TENANT_ID,
      name: name.trim(),
      price_ars,
      duration_minutes,
      is_active: true,
    })
    .select('id, name, price_ars, duration_minutes, is_active, created_at')
    .single()

  if (error) {
    console.error('[POST /api/admin/services]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ service: created }, { status: 201 })
}
