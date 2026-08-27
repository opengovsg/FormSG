import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface SkipGuidanceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  /**
   * Whether the form has any steps yet, which selects the body copy.
   *
   * Read from the workflow rather than passed per screen. One confirmation
   * serves every entry point, so it should not need telling which one opened
   * it.
   */
  hasSteps: boolean
}

export const SkipGuidanceModal = ({
  isOpen,
  onClose,
  onConfirm,
  hasSteps,
}: SkipGuidanceModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Skip guided setup?</ModalHeader>
        <ModalBody>
          <Text textStyle="body-2" color="secondary.500">
            {hasSteps
              ? "You'll set up your workflow yourself. Any steps you've already created will be kept."
              : "You'll set up your workflow yourself. We won't show this guide again."}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Skip guidance</Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
