/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker'
import { NetworkFirst, Serwist } from 'serwist'

// __SW_MANIFEST is injected by @serwist/webpack-plugin at build time
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[]
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // Network-first for API routes — never serve stale auth/booking data
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
      }),
    },
    // Network-first for Supabase — never cache auth or database responses
    {
      matcher: ({ url }: { url: URL }) => url.hostname.includes('supabase.co'),
      handler: new NetworkFirst({
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 10,
      }),
    },
    // Cache-first for static assets (images, fonts, JS, CSS)
    ...defaultCache,
  ],
})

serwist.addEventListeners()
