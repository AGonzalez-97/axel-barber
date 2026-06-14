// Auth guard will be added in Phase 3.
// This layout wraps all admin routes — every child route is protected by middleware.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
