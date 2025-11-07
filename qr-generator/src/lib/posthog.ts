import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const POSTHOG_ENABLED = typeof window !== 'undefined' && Boolean(POSTHOG_KEY)

if (POSTHOG_ENABLED) {
  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    defaults: '2025-05-24',
    capture_exceptions: true,
    debug: import.meta.env.MODE === 'development',
    capture_pageview: false,
    persistence: 'localStorage',
    loaded: () => {
      posthog.capture('app_loaded', { source: 'qr-generator' })
    },
  })
} else {
  console.warn('PostHog is not enabled. Missing VITE_PUBLIC_POSTHOG_KEY or running outside browser.')
}

export { posthog, POSTHOG_ENABLED }