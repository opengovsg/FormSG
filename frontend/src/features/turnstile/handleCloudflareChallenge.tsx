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

  let overlay = document.getElementById(OVERLAY_ID)
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = OVERLAY_ID
    document.body.insertBefore(overlay, document.body.firstChild)
    const overlayReactRoot = createRoot(overlay)
    return await new Promise((resolve, reject) => {
      overlayReactRoot.render(
        <TurnstileOverlay
          turnstileScriptId={TURNSTILE_SCRIPT_ID}
          onClose={() => {
            reject(
              new Error(
                'You must complete the security verification to continue. Please try again.',
              ),
            )
          }}
          onSuccess={() => {
            if (originalRequestConfigToReplay) {
              resolve(ApiService.request(originalRequestConfigToReplay))
            } else {
              reject(new Error('Something went wrong. Please try again.'))
            }
          }}
          onError={() => {
            reject(
              new Error(
                'Your verification was unsuccessful due to security reasons. Please try again.',
              ),
            )
          }}
          onLoadingError={() => {
            reject(
              new Error(
                'The security verification failed to load. Please try again.',
              ),
            )
          }}
        />,
      )
    }).finally(() => {
      cleanupAndRemoveOverlay({
        overlay,
        turnstileScript: document.getElementById(TURNSTILE_SCRIPT_ID),
        overlayReactRoot,
      })
    })
  }
  throw new Error(
    'Your request was blocked due to security reasons. Please try again.',
  )
}
