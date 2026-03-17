import { AxiosError, AxiosResponse } from 'axios'

import { ApiService } from '~services/ApiService'

import TurnstileChallengeService from './TurnstileChallengeService'

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
  const originalRequestConfigToReplay = error ? { ...error.config } : null

  if (originalRequestConfigToReplay) {
    return await new Promise((resolve, reject) => {
      TurnstileChallengeService.issueChallenge(originalRequestConfigToReplay, {
        onSuccess: () => {
          if (originalRequestConfigToReplay) {
            return ApiService.request(originalRequestConfigToReplay)
              .then((response) => {
                resolve(response)
              })
              .catch((error) => {
                reject(error)
              })
          } else {
            reject(new Error('Something went wrong. Please try again.'))
          }
        },
        onError: () => {
          reject(
            new Error(
              'Your verification was unsuccessful due to security reasons. Please try again.',
            ),
          )
        },
        onClose: () => {
          reject(
            new Error(
              'You must complete the security verification to continue. Please try again.',
            ),
          )
        },
        onLoadingError: () => {
          reject(
            new Error(
              'The security verification failed to load. Please try again.',
            ),
          )
        },
      })
    })
  }
  return new Error('Something went wrong. Please try again.')
}
