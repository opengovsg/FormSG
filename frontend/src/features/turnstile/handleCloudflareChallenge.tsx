import { createRoot, Root } from 'react-dom/client'
import { AxiosError, AxiosResponse } from 'axios'

import { ApiService } from '~services/ApiService'

import TurnstileOverlay from './TurnstileOverlay'

const OVERLAY_ID = 'cf-mitigated-challenge-overlay'
const TURNSTILE_SCRIPT_ID = 'turnstile-script-id'

export const checkIsCloudflareChallengeError = (response: AxiosResponse) => {
  return (
    response &&
    response.status === 403 &&
    response.headers['server'] === 'cloudflare' &&
    response.headers['cf-mitigated'] &&
    response.headers['cf-ray']
  )
}

const cleanupAndRemoveOverlay = ({
  overlay,
  turnstileScript,
  overlayReactRoot,
}: {
  overlay: HTMLElement | null
  turnstileScript: HTMLElement | null
  overlayReactRoot: Root
}) => {
  if (overlay) {
    overlayReactRoot.unmount()
    document.body.removeChild(overlay)
  }
  const isTurnstileScriptLoadFailed = window.turnstile === undefined
  if (turnstileScript && isTurnstileScriptLoadFailed) {
    // RATIONALE: Remove turnstile script if it failed to load so that it can retry for subsequent overlay renders.
    document.body.removeChild(turnstileScript)
  }
}

export const handleCloudflareChallengeError = async (
  error: AxiosError | null,
) => {
  const originalRequestConfigToReplay = error ? { ...error.config } : null
  window.Turnstile?.handleError && window.Turnstile.handleError(error)

  return error
}
