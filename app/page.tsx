import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { TENANT_ID } from '@/lib/tenant'

interface Service {
  id: string
  name: string
  price_ars: number
  duration_minutes: number
  description: string | null
}

async function fetchServices(): Promise<Service[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('services')
    .select('id, name, price_ars, duration_minutes, description')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('price_ars')
  return data ?? []
}

function formatARS(value: number): string {
  return '$' + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export default async function HomePage() {
  const services = await fetchServices()

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-center">
        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Scissors icon */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
          Barbería de barrio
        </p>
        <h1 className="mb-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
          Axel-Barber
        </h1>
        <p className="mb-10 max-w-sm text-lg text-zinc-400">
          Reservá tu turno online en segundos. Sin llamadas, sin esperas.
        </p>

        <Link
          href="/book"
          className="group inline-flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 active:scale-95"
        >
          Reservar turno
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Social links */}
        <div className="mt-8 flex items-center gap-4">
          <a
            href="https://wa.me/5493815313592"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-[#25D366]/20 hover:border-[#25D366]/40"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
          <a
            href="https://instagram.com/_leobarber23"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-pink-500/20 hover:border-pink-500/40"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1 text-zinc-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 animate-bounce" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-lg">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Sin complicaciones
          </p>
          <h2 className="mb-12 text-center text-3xl font-black text-zinc-900">
            Así de simple
          </h2>

          <div className="space-y-6">
            {[
              {
                n: '01',
                title: 'Elegí el día y hora',
                body: 'Ves en tiempo real qué turnos están disponibles. Nada de llamar para preguntar.',
              },
              {
                n: '02',
                title: 'Te confirmamos',
                body: 'Leo revisa tu solicitud y te confirma el turno. Te enterás al toque.',
              },
              {
                n: '03',
                title: 'Venís y listo',
                body: 'Llegás a tu horario y te atendemos. Al final pagás por transferencia con un QR.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-black text-white">
                  {step.n}
                </span>
                <div>
                  <p className="font-bold text-zinc-900">{step.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-lg">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Precios
            </p>
            <h2 className="mb-12 text-center text-3xl font-black text-zinc-900">
              Servicios
            </h2>

            <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between gap-4 px-5 py-5">
                  <div>
                    <p className="font-bold text-zinc-900">{service.name}</p>
                    <p className="text-sm text-zinc-400">{service.duration_minutes} min</p>
                    {service.description && (
                      <p className="mt-0.5 text-xs text-zinc-400">{service.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xl font-black text-zinc-900">
                    {formatARS(service.price_ars)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Loyalty teaser ─────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 px-6 py-20 text-center">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl">
            ✂️
          </div>
          <h2 className="mb-3 text-2xl font-black text-white">
            Programa de fidelidad
          </h2>
          <p className="mb-2 text-zinc-400">
            Cada corte suma. Al 3.º te hacemos un descuento especial.
          </p>
          <p className="text-zinc-400">
            Al 6.º <span className="font-bold text-amber-400">el corte es gratis</span>.
          </p>
        </div>
      </section>

      {/* ── Hours ──────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-lg">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Cuándo encontrarnos
          </p>
          <h2 className="mb-10 text-center text-3xl font-black text-zinc-900">
            Horarios
          </h2>

          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            {[
              { day: 'Lunes a viernes', hours: '9:00 – 21:00' },
              { day: 'Sábados', hours: '9:00 – 21:00' },
              { day: 'Domingos', hours: 'Cerrado', closed: true },
            ].map((row, i, arr) => (
              <div
                key={row.day}
                className={[
                  'flex items-center justify-between px-5 py-4',
                  i < arr.length - 1 ? 'border-b border-zinc-100' : '',
                ].join(' ')}
              >
                <span className={row.closed ? 'text-zinc-400' : 'font-medium text-zinc-900'}>
                  {row.day}
                </span>
                <span className={row.closed ? 'text-sm text-zinc-400' : 'font-bold text-zinc-900'}>
                  {row.hours}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-zinc-400">
            Los feriados nacionales pueden variar. Seguinos para novedades.
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 px-6 py-24 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-3 text-3xl font-black text-white">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="mb-10 text-zinc-400">
            Reservá en menos de un minuto, sin registrarte.
          </p>
          <Link
            href="/book"
            className="group inline-flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 active:scale-95"
          >
            Reservar mi turno
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-6 py-8 text-center">
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Axel-Barber · Todos los derechos reservados
        </p>
      </footer>
    </div>
  )
}
