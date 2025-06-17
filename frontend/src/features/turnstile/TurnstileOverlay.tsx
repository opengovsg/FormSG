import { QueryClient, QueryClientProvider } from 'react-query'
import {
  Box,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Turnstile } from '@marsidev/react-turnstile'

import { HttpError } from '~services/ApiService'

import { useEnv } from '~features/env/queries'

const isDev = process.env.NODE_ENV === 'development'
const CF_DEV_PASS_SITEKEY = '1x00000000000000000000AA'

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

interface TurnstileOverlayProps {
  onSuccess: (response: string | null) => void
  onError: () => void
  onClose: () => void
  onLoadingError: () => void
}

const TurnstileOverlay = ({
  onSuccess,
  onError,
  onClose,
  onLoadingError,
}: TurnstileOverlayProps) => {
  const {
    data: { turnstileSiteKey = isDev ? CF_DEV_PASS_SITEKEY : undefined } = {},
  } = useEnv()

  if (turnstileSiteKey === undefined) {
    onLoadingError()
    return
  }

  return (
    <Modal isOpen size="md" onClose={onClose}>
      <ModalOverlay backgroundColor="rgba(128, 128, 128, 0.5)" />
      <ModalContent
        bg="white"
        w="fit-content"
        h="fit-content"
        mx="auto"
        my="auto"
        padding="1rem"
        borderRadius="0.25rem"
      >
        <Box display="flex" justifyContent="flex-end" w="100%">
          <ModalCloseButton />
        </Box>
        <Skeleton isLoaded={!!turnstileSiteKey}>
          <Stack py="0.5rem" spacing="0.5rem" alignItems="center">
            <Text w="100%" fontSize="lg" fontWeight="bold">
              Complete this challenge to continue
            </Text>
            <Turnstile
              siteKey={turnstileSiteKey!}
              onSuccess={onSuccess}
              onError={onError}
            />
          </Stack>
        </Skeleton>
      </ModalContent>
    </Modal>
  )
}

const TurnstileOverlayContainer = ({
  onSuccess,
  onError,
  onClose,
  onLoadingError,
}: TurnstileOverlayProps) => {
  return (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>
      <TurnstileOverlay
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        onLoadingError={onLoadingError}
      />
    </QueryClientProvider>
  )
}

export default TurnstileOverlayContainer
