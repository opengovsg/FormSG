import { AxiosRequestConfig } from 'axios'

import { TurnstileOverlayHandlingProps } from './TurnstileOverlay'

const CloudflareChallengeService = {
  issueChallenge: async (
    requestToReplay: AxiosRequestConfig | null,
    turnstileOverlayHandlingProps: TurnstileOverlayHandlingProps,
  ) => {
    console.warn('issueChallenge called before initialization')
  },
}

export default CloudflareChallengeService
