import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'
import { HttpError } from '~services/ApiService'

import { useEnv } from '~features/env/queries'

import { useTurnstile } from './useTurnstile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds,
      retry: (failureCount, error) => {
        // Do not retry on 4xx error codes.
        if (error instanceof HttpError && String(error.code).startsWith('4')) {
          return false
        }
        return failureCount !== 3
      },
    },
  },
})

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
    console.log('using effect')
    if (hasTurnstileLoaded) {
      console.log('hasTurnstileLoaded', hasTurnstileLoaded)
      getTurnstileResponse()
        .then((response) => {
          console.log('onSuccess')
          onSuccess(response)
        })
        .catch(() => {
          console.log('onError')
          onError()
        })
    }
  }, [getTurnstileResponse, hasTurnstileLoaded, onError, onSuccess])

  return (
    <Modal size="full" isOpen onClose={onError}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody>
          <Skeleton isLoaded={hasTurnstileLoaded}>
            <Text>Hello world</Text>
            <Box
              width="100%"
              height="100%"
              id={turnstileContainerID}
              sx={noPrintCss}
              mt="2rem"
            />
          </Skeleton>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

const TurnstileOverlayContainer = ({
  onSuccess,
  onError,
}: {
  onSuccess: (response: string | null) => void
  onError: () => void
}) => {
  return (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>
      <TurnstileOverlay onSuccess={onSuccess} onError={onError} />
    </QueryClientProvider>
  )
}

export default TurnstileOverlayContainer
