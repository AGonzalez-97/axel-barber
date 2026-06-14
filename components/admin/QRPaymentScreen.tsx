'use client'

import { useRouter } from 'next/navigation'
import PaymentQR from '@/components/PaymentQR'
import { PAYMENT_ALIAS } from '@/lib/qr'

type Booking = {
  starts_at: string
  clients: { name: string; phone: string } | null
  services: { name: string } | null
}

type Cut = {
  id: string
  price_charged: number
  loyalty_discount_applied: boolean
  bookings: Booking | null
}

type QRPaymentScreenProps = {
  cut: Cut
}

function formatARS(amount: number): string {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function QRPaymentScreen({ cut }: QRPaymentScreenProps) {
  const router = useRouter()
  const isFree = cut.price_charged === 0
  const clientName = cut.bookings?.clients?.name ?? 'Cliente'
  const serviceName = cut.bookings?.services?.name ?? 'Corte'

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="text-sm font-medium text-gray-500">{serviceName}</p>
        <h1 className="text-xl font-bold text-gray-900">{clientName}</h1>
        {cut.loyalty_discount_applied && !isFree && (
          <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            Descuento aplicado
          </span>
        )}
      </div>

      {/* QR / Free cut */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {isFree ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="text-7xl">🎉</div>
            <h2 className="text-3xl font-bold text-green-600">¡Corte gratis!</h2>
            <p className="text-lg text-gray-500">No necesitás cobrar nada</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <p className="text-base font-medium text-gray-500">Total a cobrar</p>
            <p className="text-5xl font-bold text-gray-900">${formatARS(cut.price_charged)}</p>
            <p className="mb-2 text-xs text-gray-400">ARS</p>
            <PaymentQR alias={PAYMENT_ALIAS} amount={cut.price_charged} isFree={false} />
            <p className="mt-2 text-sm text-gray-400">
              El cliente escanea el QR con cualquier app bancaria o billetera virtual
            </p>
          </div>
        )}
      </div>

      {/* Done button */}
      <div className="border-t border-gray-100 p-4 pb-8">
        <button
          onClick={() => router.push('/turnos')}
          className="h-14 w-full rounded-2xl bg-gray-900 text-base font-semibold text-white transition-opacity active:opacity-80"
        >
          Listo, cobré
        </button>
      </div>
    </div>
  )
}
