import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { usePostHog } from 'posthog-js/react'

export function PosthogRouterAnalytics() {
  const location = useLocation()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return

    posthog.capture('$pageview', {
      $current_url: window.location.href,
    })
  }, [location, posthog])

  return null
}