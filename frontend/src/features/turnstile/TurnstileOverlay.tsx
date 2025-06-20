import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
} from '@chakra-ui/react'
import { Turnstile } from '@marsidev/react-turnstile'

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

const TURNSTILE_SCRIPT_ID = 'turnstile-script-id'

const removeTurnstileScript = () => {
  const script = document.getElementById(TURNSTILE_SCRIPT_ID)
  if (script) {
    script.remove()
  }
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

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  if (isSiteKeyError || (isSiteKeyLoading && turnstileSiteKey === undefined)) {
    onLoadingError()
    return
  }

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          Complete this security verification to continue
        </ModalHeader>
        <ModalBody py="2rem" display="flex" justifyContent="center">
          {turnstileSiteKey && (
            <Turnstile
              siteKey={turnstileSiteKey!}
              onSuccess={onSuccess}
              onError={onError}
              onTimeout={onClose}
              scriptOptions={{
                id: TURNSTILE_SCRIPT_ID,
                onError: () => {
                  removeTurnstileScript() // RATIONALE: Required so as to retry load in subsequent overlay renders.
                  onLoadingError()
                },
              }}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default TurnstileOverlay
