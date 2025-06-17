import { createRoot } from 'react-dom/client'
import { AxiosError, AxiosResponse } from 'axios'

import { ApiService } from '~services/ApiService'

import TurnstileOverlay from './TurnstileOverlay'

export const checkIsCloudflareChallengeError = (response: AxiosResponse) => {
  return (
    response &&
    response.status === 403 &&
    response.headers['server'] === 'cloudflare' &&
    response.headers['cf-mitigated'] &&
    response.headers['cf-ray']
  )
}

export const handleCloudflareChallengeError = async (
  error: AxiosError | null,
) => {
  console.log('handleCloudflareChallengeError', error)
  const originalRequestConfigToReplay = error ? { ...error.config } : null

  const OVERLAY_ID = 'cf-mitigated-challenge-overlay'
  let overlay = document.getElementById(OVERLAY_ID)
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = OVERLAY_ID
    document.body.insertBefore(overlay, document.body.firstChild)
    const root = createRoot(overlay)
    return await new Promise((resolve, reject) => {
      console.log('rendering overlay')
      root.render(
        <TurnstileOverlay
          onClose={() => {
            reject(
              new Error(
                'You must complete the security challenge to continue. Please try again.',
              ),
            )
          }}
          onSuccess={() => {
            if (originalRequestConfigToReplay) {
              resolve(ApiService.request(originalRequestConfigToReplay))
            } else {
              reject(
                new Error(
                  'Something went wrong. Please try again. If this issue persists, contact support@form.gov.sg',
                ),
              )
            }
          }}
          onError={() => {
            reject(
              new Error(
                'Your request was blocked for security reasons. Please try again.',
              ),
            )
          }}
        />,
      )
    }).finally(() => {
      if (overlay) {
        console.log('removing overlay')
        root.unmount()
        document.body.removeChild(overlay)
      }
    })
  }
  throw new Error(
    'Your request was blocked for security reasons. Please try again.',
  )
}
