'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type TenantConfig = {
  booking_mode: 'request' | 'slots'
  available_days: number
}

type SlotStatus = {
  time: string
  available: boolean
}

/**
 * Returns true if the given Date falls on an enabled day per the bitmask.
 * Bitmask: bit 1 = Monday, ..., bit 6 = Saturday, bit 7 = Sunday
 */
function isDayEnabled(date: Date, bitmask: number): boolean {
  const jsDay = date.getDay()
  const bitPos = jsDay === 0 ? 7 : jsDay
  return (bitmask & (1 << (bitPos - 1))) !== 0
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type DateStepProps = {
  serviceId: string
}

/**
 * Step 2: Date picker → visual availability grid → time selection.
 *
 * After the client picks a date, a full slot grid is shown for the day.
 * Available slots are clickable; taken slots are grayed out so the client
 * knows at a glance what's still free before choosing.
 *
 * In "request" mode: selecting a slot submits a booking request (Leo confirms).
 * In "slots" mode: only available slots are shown as selectable.
 */
export function DateStep({ serviceId }: DateStepProps) {
  const router = useRouter()
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  const [slots, setSlots] = useState<SlotStatus[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // Fetch tenant config on mount
  useEffect(() => {
    fetch('/api/tenant')
      .then((r) => r.json())
      .then((data: TenantConfig & { error?: string }) => {
        if (data.error) throw new Error(data.error)
        setTenantConfig(data)
      })
      .catch(() => setConfigError('No se pudo cargar la configuración. Intentá de nuevo.'))
  }, [])

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return
    setSlotsLoading(true)
    setSlotsError(null)
    setSlots([])
    setSelectedTime('')

    fetch(`/api/availability?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: { slots?: SlotStatus[]; error?: string }) => {
        if (data.error) throw new Error(data.error)
        setSlots(data.slots ?? [])
      })
      .catch(() => setSlotsError('No se pudo cargar la disponibilidad. Intentá de nuevo.'))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate])

  function handleContinue() {
    if (!selectedDate || !selectedTime) return
    router.push(
      `/book?step=client&service=${serviceId}&date=${selectedDate}&time=${encodeURIComponent(selectedTime)}`,
    )
  }

  const today = new Date()
  const minDate = toLocalDateString(today)
  const maxDateObj = new Date(today)
  maxDateObj.setDate(maxDateObj.getDate() + 60)
  const maxDate = toLocalDateString(maxDateObj)

  function isDateDisabled(dateStr: string): boolean {
    if (!tenantConfig) return true
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return !isDayEnabled(dt, tenantConfig.available_days)
  }

  const availableCount = slots.filter((s) => s.available).length

  if (configError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="rounded-xl bg-red-50 p-4 text-center text-red-600">{configError}</p>
      </div>
    )
  }

  if (!tenantConfig) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="space-y-4" role="status" aria-label="Cargando">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    )
  }

  const canContinue = !!selectedDate && !!selectedTime

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button
        onClick={() => router.push('/book')}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        aria-label="Volver a servicios"
      >
        ← Volver
      </button>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Elegí fecha y hora</h1>
        <p className="mt-1 text-gray-500">
          {tenantConfig.booking_mode === 'slots'
            ? 'Solo los turnos disponibles son seleccionables'
            : 'Leo va a confirmar tu turno en breve'}
        </p>
      </header>

      {/* Date picker */}
      <section className="mb-6">
        <label htmlFor="booking-date" className="mb-2 block text-sm font-medium text-gray-700">
          Fecha
        </label>
        <input
          id="booking-date"
          type="date"
          min={minDate}
          max={maxDate}
          value={selectedDate}
          onChange={(e) => {
            const val = e.target.value
            if (val && isDateDisabled(val)) return
            setSelectedDate(val)
          }}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="mt-1 text-xs text-gray-400">Días disponibles: lunes a sábado</p>
      </section>

      {/* Availability grid */}
      {selectedDate && (
        <section className="mb-8">
          {slotsLoading && (
            <div className="grid grid-cols-4 gap-2" role="status" aria-label="Cargando disponibilidad">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          )}

          {slotsError && (
            <p className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
              {slotsError}
            </p>
          )}

          {!slotsLoading && !slotsError && slots.length > 0 && (
            <>
              {/* Summary */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Horarios</p>
                <p className="text-xs text-gray-400">
                  {availableCount === 0
                    ? 'Sin turnos disponibles'
                    : `${availableCount} disponible${availableCount !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Legend */}
              <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-gray-900" />
                  Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-gray-200" />
                  Ocupado
                </span>
                {selectedTime && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
                    Tu elección
                  </span>
                )}
              </div>

              {/* Slot grid */}
              <div
                className="grid grid-cols-4 gap-2"
                role="group"
                aria-label="Disponibilidad de turnos"
              >
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time
                  const isAvailable = slot.available

                  // In slots mode: taken slots are completely blocked.
                  // In request mode: taken slots are shown but still selectable (Leo confirms).
                  const isDisabled =
                    tenantConfig.booking_mode === 'slots' && !isAvailable

                  return (
                    <button
                      key={slot.time}
                      onClick={() => !isDisabled && setSelectedTime(slot.time)}
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                      aria-label={`${slot.time} — ${isAvailable ? 'disponible' : 'ocupado'}`}
                      className={[
                        'flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors',
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : isDisabled
                          ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                          : isAvailable
                          ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-900 hover:bg-gray-50 active:bg-gray-100'
                          : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <span>{slot.time}</span>
                      {!isAvailable && (
                        <span className="mt-0.5 text-[10px] font-normal leading-none">
                          Ocupado
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Request mode note when user picks a taken slot */}
              {tenantConfig.booking_mode === 'request' && selectedTime && !slots.find(s => s.time === selectedTime)?.available && (
                <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  Ese horario ya tiene un turno, pero podés pedirlo igual. Leo va a confirmar si hay lugar.
                </p>
              )}

              {availableCount === 0 && tenantConfig.booking_mode === 'slots' && (
                <p className="mt-3 rounded-xl bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                  No hay turnos disponibles para este día. Probá con otra fecha.
                </p>
              )}
            </>
          )}
        </section>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="h-14 w-full rounded-xl bg-gray-900 text-base font-semibold text-white transition-opacity disabled:opacity-40"
      >
        Continuar
      </button>
    </div>
  )
}
