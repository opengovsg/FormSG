import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  useBreakpointValue,
} from '@chakra-ui/react'
import { Turnstile } from '@marsidev/react-turnstile'

export interface TurnstileOverlayHandlingProps {
  onSuccess: (response: string | null) => void
  onError: () => void
  onClose: () => void
  onLoadingError: () => void
}
interface TurnstileOverlayProps extends TurnstileOverlayHandlingProps {
  isOpen: boolean
  turnstileSiteKey: string | undefined
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
  turnstileSiteKey,
}: TurnstileOverlayProps) => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          Complete this security verification to continue
        </ModalHeader>
        <ModalBody py="2rem" display="flex" justifyContent="center">
          {turnstileSiteKey ? (
            <Turnstile
              options={{
                execution: 'execute',
              }}
              siteKey={turnstileSiteKey!}
              onSuccess={onSuccess}
              onError={onError}
              onTimeout={onError}
              onUnsupported={onLoadingError}
              scriptOptions={{
                id: TURNSTILE_SCRIPT_ID,
                onError: () => {
                  removeTurnstileScript() // RATIONALE: Required so as to retry load in subsequent overlay renders.
                  onLoadingError()
                },
              }}
            />
          ) : (
            <Skeleton height="6.25rem" width="100%" />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default TurnstileOverlay
