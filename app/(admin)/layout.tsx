import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin layout — server component.
 *
 * Second defense layer after middleware: verifies the session via
 * createServerClient (cookie-based). Redirects to /login if the session
 * is missing or expired. This catches edge cases where middleware is
 * bypassed (e.g., direct server action calls, misconfigured CDN).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
