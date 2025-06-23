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

  console.log('originalRequestConfigToReplay:', originalRequestConfigToReplay)

  if (originalRequestConfigToReplay) {
    return await new Promise((resolve, reject) => {
      TurnstileChallengeService.issueChallenge(originalRequestConfigToReplay, {
        onSuccess: () => {
          console.log('success onSuccess')
          if (originalRequestConfigToReplay) {
            console.log('success onSuccess 2')
            return ApiService.request(originalRequestConfigToReplay)
              .then((response) => {
                console.log('response:', response)
                resolve(response)
              })
              .catch((error) => {
                console.log('error:', error)
                reject(error)
              })
          } else {
            console.log('error onSuccess')
            reject(new Error('Something went wrong. Please try again.'))
          }
        },
        onError: () => {
          console.log('error onError')
          reject(
            new Error(
              'Your verification was unsuccessful due to security reasons. Please try again.',
            ),
          )
        },
        onClose: () => {
          console.log('error onClose')
          reject(
            new Error(
              'You must complete the security verification to continue. Please try again.',
            ),
          )
        },
        onLoadingError: () => {
          console.log('error onLoadingError')
          reject(
            new Error(
              'The security verification failed to load. Please try again.',
            ),
          )
        },
      })
    })
  }

  console.log('did not invoke cf challenge')
  return new Error('Something went wrong. Please try again.')
}
