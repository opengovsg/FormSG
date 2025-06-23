import { createContext, useEffect, useState } from 'react'
import { AxiosRequestConfig } from 'axios'

import { useEnv } from '~features/env/queries'

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
  const {
    data: { turnstileSiteKey } = { turnstileSiteKey: undefined },
    isLoading: isTurnstileKeyLoading,
    isError: isTurnstileKeyLoadingError,
  } = useEnv()

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

  useEffect(() => {
    const issueChallenge = async (
      requestToReplay: AxiosRequestConfig | null,
      turnstileOverlayHandlingProps: TurnstileOverlayHandlingProps,
    ) => {
      if (isChallengeOpen) {
        turnstileOverlayHandlingProps.onError() // RATIONALE: Block subsequent requests if challenge is open for previous request
        return
      }
      setRequestToReplay(requestToReplay)
      setTurnstileOverlayHandlingProps(turnstileOverlayHandlingProps)
      setIsChallengeOpen(true)
    }

    TurnstileChallengeService.issueChallenge = issueChallenge
  }, [isChallengeOpen])

  if (
    (!turnstileSiteKey && !isTurnstileKeyLoading) ||
    isTurnstileKeyLoadingError
  ) {
    turnstileOverlayHandlingProps?.onLoadingError()
    return
  }

  return (
    <TurnstileChallengeContext.Provider
      value={{ isChallengeOpen, requestToReplay }}
    >
      {turnstileOverlayHandlingProps && (
        <TurnstileOverlay
          turnstileSiteKey={turnstileSiteKey}
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
