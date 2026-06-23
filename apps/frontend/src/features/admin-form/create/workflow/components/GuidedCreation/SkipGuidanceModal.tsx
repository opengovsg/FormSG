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
}

export const SkipGuidanceModal = ({
  isOpen,
  onClose,
  onConfirm,
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
            You'll switch to manual mode. Any steps you've already created will
            be kept.
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
