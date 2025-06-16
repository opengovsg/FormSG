import { useEffect } from 'react'
import { Box, Skeleton } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'

import { useEnv } from '~features/env/queries'

import { useTurnstile } from './useTurnstile'

const TurnstileOverlay = ({
  onSuccess,
  onError,
}: {
  onSuccess: (response: string | null) => void
  onError: () => void
}) => {
  const { data: { turnstileSiteKey } = {} } = useEnv()

  const {
    hasLoaded: hasTurnstileLoaded,
    getTurnstileResponse,
    containerID: turnstileContainerID,
  } = useTurnstile({
    sitekey: turnstileSiteKey,
    enableUsage: true,
  })

  useEffect(() => {
    if (hasTurnstileLoaded) {
      getTurnstileResponse().then(onSuccess).catch(onError)
    }
  }, [getTurnstileResponse, hasTurnstileLoaded, onError, onSuccess])

  return (
    <Skeleton isLoaded={hasTurnstileLoaded}>
      <Box id={turnstileContainerID} sx={noPrintCss} mt="2rem" />
    </Skeleton>
  )
}

export default TurnstileOverlay
