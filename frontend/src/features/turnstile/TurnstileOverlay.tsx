import { QueryClient, QueryClientProvider } from 'react-query'
import {
  HStack,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Turnstile } from '@marsidev/react-turnstile'

import { useIsMobile } from '~hooks/useIsMobile'
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
  turnstileScriptId?: string
}

const TurnstileOverlay = ({
  onSuccess,
  onError,
  onClose,
  onLoadingError,
  turnstileScriptId = 'turnstile-script-id',
}: TurnstileOverlayProps) => {
  const {
    isLoading: isSitekeyLoading,
    isError: isSitekeyError,
    data: { turnstileSiteKey = isDev ? CF_DEV_PASS_SITEKEY : undefined } = {},
  } = useEnv()

  const isMobile = useIsMobile()

  if (isSitekeyError || (!isSitekeyLoading && turnstileSiteKey === undefined)) {
    onLoadingError()
    return
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.65)" />
      <ModalContent
        bgColor="#FBFCFD"
        w={isMobile ? '100%' : 'fit-content'}
        h={isMobile ? '100%' : 'fit-content'}
        margin="auto"
        padding="1rem"
        borderRadius="0.25rem"
        p="2rem"
      >
        <Skeleton isLoaded={!isSitekeyLoading}>
          <Stack spacing="2rem" alignItems="center">
            <HStack spacing="2rem" w="100%">
              <Text
                w="100%"
                fontWeight="600"
                fontSize="1.5rem"
                textColor="#293044"
              >
                Complete this security verification to continue
              </Text>
              <ModalCloseButton position="static" />
            </HStack>
            <Turnstile
              siteKey={turnstileSiteKey!}
              onSuccess={onSuccess}
              onError={onError}
              onTimeout={onClose}
              scriptOptions={{
                appendTo: 'body', // RATIONALE: Required so that it can be removed onLoadingError to retry load in subsequent overlay renders.
                id: turnstileScriptId,
                onError: onLoadingError,
              }}
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
  turnstileScriptId,
}: TurnstileOverlayProps) => {
  return (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>
      <TurnstileOverlay
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        onLoadingError={onLoadingError}
        turnstileScriptId={turnstileScriptId}
      />
    </QueryClientProvider>
  )
}

export default TurnstileOverlayContainer
