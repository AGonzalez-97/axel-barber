import { Suspense } from 'react'
import { ConfirmationContent } from '@/components/booking/ConfirmationContent'

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-8">
            <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </main>
  )
}
