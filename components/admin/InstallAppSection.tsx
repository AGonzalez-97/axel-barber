'use client'

import { useEffect, useState } from 'react'

type Platform = 'ios' | 'android' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function InstallAppSection() {
  const [platform, setPlatform] = useState<Platform>('other')
  const [installed, setInstalled] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  // biome-ignore lint: beforeinstallprompt type
  // eslint-disable-next-line
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    setPlatform(detectPlatform())
    setInstalled(isInstalled())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (platform === 'android' && deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } else {
      setShowBanner(true)
    }
  }

  if (installed) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <p className="text-sm font-medium text-gray-900">App ya instalada</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Instalar app</p>
          <p className="text-xs text-gray-400">Acceso rápido desde la pantalla de inicio</p>
        </div>
        <button
          onClick={handleInstall}
          className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80 active:opacity-70"
        >
          Instalar
        </button>
      </div>

      {/* iOS instruction banner */}
      {showBanner && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowBanner(false)}>
          <div
            className="w-full rounded-t-2xl bg-white px-5 py-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Agregar a la pantalla de inicio</p>
              <button
                onClick={() => setShowBanner(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <ol className="space-y-4">
              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Tocá el botón Compartir</p>
                  <p className="text-xs text-gray-400">El ícono de la flecha hacia arriba en Safari</p>
                </div>
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Agregar a pantalla de inicio</p>
                  <p className="text-xs text-gray-400">Scrolleá hacia abajo en el menú de compartir</p>
                </div>
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Tocá Agregar</p>
                  <p className="text-xs text-gray-400">Arriba a la derecha — y listo</p>
                </div>
              </li>
            </ol>

            <p className="mt-5 text-center text-xs text-gray-400">
              Tocá fuera para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  )
}
