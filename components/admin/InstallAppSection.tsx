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
  const [showSteps, setShowSteps] = useState(false)
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

  if (installed) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <p className="text-sm font-medium text-gray-900">App instalada</p>
      </div>
    )
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Instalar app</p>
          <p className="text-xs text-gray-400">Acceso rápido desde la pantalla de inicio</p>
        </div>

        {platform === 'android' && deferredPrompt ? (
          <button
            onClick={handleAndroidInstall}
            className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80"
          >
            Instalar
          </button>
        ) : (
          <button
            onClick={() => setShowSteps((v) => !v)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80"
          >
            {showSteps ? 'Cerrar' : 'Ver pasos'}
          </button>
        )}
      </div>

      {showSteps && platform === 'ios' && (
        <ol className="mt-4 space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">1</span>
            Tocá el ícono de <strong className="mx-1">Compartir</strong>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 self-center text-gray-500" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">2</span>
            Scrolleá y tocá <strong className="ml-1">"Agregar a pantalla de inicio"</strong>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">3</span>
            Tocá <strong className="ml-1">"Agregar"</strong> arriba a la derecha
          </li>
        </ol>
      )}

      {showSteps && platform !== 'ios' && (
        <ol className="mt-4 space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">1</span>
            Tocá el menú <strong className="ml-1">⋮</strong> del navegador
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">2</span>
            Tocá <strong className="ml-1">"Agregar a pantalla de inicio"</strong>
          </li>
        </ol>
      )}
    </div>
  )
}
