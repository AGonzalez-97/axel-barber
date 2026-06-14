import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TENANT_ID } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/clients?q=search_term
 *
 * Returns all clients for the tenant, ordered by name ASC.
 * Optional ?q= filters by name or phone (case-insensitive).
 *
 * Auth required — returns 401 if the session is missing.
 * Uses the service-role client (clients table is service_role only).
 */
export async function GET(request: NextRequest) {
  // 1. Verify auth session
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse search param
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  // 3. Fetch clients with service role
  const service = createServiceClient()

  let query = service
    .from('clients')
    .select('id, name, phone, created_at')
    .eq('tenant_id', TENANT_ID)
    .order('name', { ascending: true })

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: clients, error } = await query

  if (error) {
    console.error('[GET /api/admin/clients]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ clients: clients ?? [], total: (clients ?? []).length })
}
