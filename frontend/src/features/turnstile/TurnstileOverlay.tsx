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

import { useEnv } from '~features/env/queries'

export interface TurnstileOverlayHandlingProps {
  onSuccess: (response: string | null) => void
  onError: () => void
  onClose: () => void
  onLoadingError: () => void
}
interface TurnstileOverlayProps extends TurnstileOverlayHandlingProps {
  isOpen: boolean
}

const TurnstileOverlay = ({
  isOpen,
  onSuccess,
  onError,
  onClose,
  onLoadingError,
}: TurnstileOverlayProps) => {
  const {
    isError: isSiteKeyError,
    isLoading: isSiteKeyLoading,
    data: { turnstileSiteKey } = {},
  } = useEnv()

  const isMobile = useIsMobile()

  if (isSiteKeyError || (isSiteKeyLoading && turnstileSiteKey === undefined)) {
    onLoadingError()
    return
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
        <Skeleton isLoaded={!isSiteKeyLoading}>
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
            {turnstileSiteKey && (
              <Turnstile
                siteKey={turnstileSiteKey!}
                onSuccess={onSuccess}
                onError={onError}
                onTimeout={onClose}
                scriptOptions={{
                  appendTo: 'body', // RATIONALE: Required so that it can be removed onLoadingError to retry load in subsequent overlay renders.
                  onError: onLoadingError,
                }}
              />
            )}
          </Stack>
        </Skeleton>
      </ModalContent>
    </Modal>
  )
}

export default TurnstileOverlay
