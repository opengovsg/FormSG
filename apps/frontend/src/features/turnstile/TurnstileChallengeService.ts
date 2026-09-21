import { AxiosRequestConfig } from 'axios'

import { TurnstileOverlayHandlingProps } from './TurnstileOverlay'

const CloudflareChallengeService = {
  issueChallenge: async (
    // oxlint-disable-next-line typescript/no-unused-vars
    requestToReplay: AxiosRequestConfig | null,
    // oxlint-disable-next-line typescript/no-unused-vars
    turnstileOverlayHandlingProps: TurnstileOverlayHandlingProps,
  ) => {
    console.warn('issueChallenge called before initialization')
  },
}

export default CloudflareChallengeService
