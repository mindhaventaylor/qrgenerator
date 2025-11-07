import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { POSTHOG_ENABLED, posthog } from '../../lib/posthog'

export function PosthogRouterAnalytics() {
  const location = useLocation()

  useEffect(() => {
    if (!POSTHOG_ENABLED) return

    posthog.capture('$pageview', {
      $current_url: window.location.href,
    })
  }, [location])

  return null
}


