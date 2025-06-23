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
  const { data, isLoading, isLoadingError } = useEnv()

  console.log('env:', data)
  console.log('isLoading:', isLoading)
  console.log('isError:', isLoadingError)

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

  return (
    <TurnstileChallengeContext.Provider
      value={{ isChallengeOpen, requestToReplay }}
    >
      {turnstileOverlayHandlingProps && (
        <TurnstileOverlay
          turnstileSiteKey={data?.turnstileSiteKey}
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
