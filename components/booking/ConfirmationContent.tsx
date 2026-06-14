'use client'

import { useSearchParams, useRouter } from 'next/navigation'

function formatReadableDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
  } catch {
    return isoString
  }
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
  } catch {
    return ''
  }
}

function getBookingLink(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/book`
  }
  return '/book'
}

/**
 * Confirmation screen shown after a successful booking.
 * Reads booking data from URL params (passed by ClientStep after POST).
 *
 * TASK-022: Shows service, date/time, client name, loyalty status.
 * Includes WhatsApp share via navigator.share() with wa.me fallback.
 */
export function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const serviceName = searchParams.get('service_name') ?? ''
  const startsAt = searchParams.get('starts_at') ?? ''
  const clientName = searchParams.get('client_name') ?? ''
  const loyaltyLabel = searchParams.get('loyalty_label') ?? ''
  const status = searchParams.get('status') ?? 'active'

  const displayDate = formatReadableDate(startsAt)
  const displayTime = formatTime(startsAt)

  const isPending = status === 'pending'

  async function handleShare() {
    const bookingLink = getBookingLink()
    const shareText = `Reservé mi turno en Leo Barber para el ${displayDate} a las ${displayTime}. ¿Querés sacar el tuyo? ${bookingLink}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi turno en Leo Barber',
          text: shareText,
        })
        return
      } catch {
        // User cancelled or share failed — fall through to wa.me
      }
    }

    // Fallback: open WhatsApp deeplink
    const encoded = encodeURIComponent(shareText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  // Guard: if no booking data in URL, redirect to booking start
  if (!serviceName && !startsAt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-gray-500">No hay información de turno disponible.</p>
        <button
          onClick={() => router.push('/book')}
          className="mt-4 h-12 rounded-xl bg-gray-900 px-6 text-sm font-semibold text-white"
        >
          Reservar turno
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Success icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
        {isPending ? 'Solicitud enviada' : 'Turno confirmado'}
      </h1>

      {isPending && (
        <p className="mb-6 text-center text-sm text-gray-500">
          Leo va a confirmar tu turno en breve.
        </p>
      )}

      {/* Booking details card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Servicio</dt>
            <dd className="mt-0.5 text-base font-semibold text-gray-900">{serviceName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Fecha</dt>
            <dd className="mt-0.5 text-base font-semibold text-gray-900 capitalize">{displayDate}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Hora</dt>
            <dd className="mt-0.5 text-base font-semibold text-gray-900">{displayTime}</dd>
          </div>
          {clientName && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Nombre</dt>
              <dd className="mt-0.5 text-base font-semibold text-gray-900">{clientName}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Loyalty status */}
      {loyaltyLabel && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-center">
          <p className="text-sm font-medium text-amber-800">{loyaltyLabel}</p>
        </div>
      )}

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
        aria-label="Compartir turno por WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Compartir turno
      </button>

      {/* Book another */}
      <button
        onClick={() => router.push('/book')}
        className="mt-3 h-12 w-full rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        Volver al inicio
      </button>
    </div>
  )
}
