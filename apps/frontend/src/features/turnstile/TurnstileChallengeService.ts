import { AxiosRequestConfig } from 'axios'

import { TurnstileOverlayHandlingProps } from './TurnstileOverlay'

const CloudflareChallengeService = {
  issueChallenge: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    requestToReplay: AxiosRequestConfig | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    turnstileOverlayHandlingProps: TurnstileOverlayHandlingProps,
  ) => {
    console.warn('issueChallenge called before initialization')
  },
}

export default CloudflareChallengeService
