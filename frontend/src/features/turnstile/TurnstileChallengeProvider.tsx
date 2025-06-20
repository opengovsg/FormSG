import { createContext, useEffect, useState } from 'react'
import { AxiosRequestConfig } from 'axios'

import TurnstileChallengeService from './TurnstileChallengeService'
import TurnstileOverlay, {
  TurnstileOverlayHandlingProps,
} from './TurnstileOverlay'

const TurnstileChallengeContext = createContext<{
  isChallengeOpen: boolean
  requestToReplay: AxiosRequestConfig | null
}>({
  isChallengeOpen: false,
  requestToReplay: null,
})

export const TurnstileChallengeProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isChallengeOpen, setIsChallengeOpen] = useState(false)
  const [requestToReplay, setRequestToReplay] =
    useState<AxiosRequestConfig | null>(null)
  const [turnstileOverlayHandlingProps, setTurnstileOverlayHandlingProps] =
    useState<TurnstileOverlayHandlingProps | null>(null)

  const cleanup = () => {
    setIsChallengeOpen(false)
    setRequestToReplay(null)
    setTurnstileOverlayHandlingProps(null)
  }

  const issueChallenge = async (
    requestToReplay: AxiosRequestConfig | null,
    turnstileOverlayHandlingProps: TurnstileOverlayHandlingProps,
  ) => {
    setRequestToReplay(requestToReplay)
    setTurnstileOverlayHandlingProps(turnstileOverlayHandlingProps)
    setIsChallengeOpen(true)
  }

  useEffect(() => {
    TurnstileChallengeService.issueChallenge = issueChallenge
  }, [])

  return (
    <TurnstileChallengeContext.Provider
      value={{ isChallengeOpen, requestToReplay }}
    >
      {turnstileOverlayHandlingProps && (
        <TurnstileOverlay
          isOpen={isChallengeOpen}
          onSuccess={(response) => {
            turnstileOverlayHandlingProps.onSuccess(response)
            cleanup()
          }}
          onError={() => {
            turnstileOverlayHandlingProps.onError()
            cleanup()
          }}
          onClose={() => {
            turnstileOverlayHandlingProps.onClose()
            cleanup()
          }}
          onLoadingError={() => {
            turnstileOverlayHandlingProps.onLoadingError()
            cleanup()
          }}
        />
      )}
      {children}
    </TurnstileChallengeContext.Provider>
  )
}
