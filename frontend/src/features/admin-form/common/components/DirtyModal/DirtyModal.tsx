import { useCallback } from 'react'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useFieldBuilderStore } from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'

export const DirtyModal = (): JSX.Element => {
  const isMobile = useIsMobile()
  const {
    holdingStateData,
    clearHoldingStateData,
    moveFromHoldingToStateData,
  } = useFieldBuilderStore(
    useCallback((state) => {
      return {
        holdingStateData: state.holdingStateData,
        clearHoldingStateData: state.clearHoldingStateData,
        moveFromHoldingToStateData: state.moveFromHoldingToStateData,
      }
    }, []),
  )

  return (
    <Modal
      isOpen={!!holdingStateData}
      onClose={clearHoldingStateData}
      returnFocusOnClose={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700" pr="4rem">
          You have unsaved changes
        </ModalHeader>
        <ModalBody color="secondary.500" textStyle="body-2">
          Are you sure you want to leave? Your changes will be lost.
        </ModalBody>
        <ModalFooter>
          <Stack
            spacing="1rem"
            w="100%"
            direction={{ base: 'column', md: 'row-reverse' }}
          >
            <Button
              isFullWidth={isMobile}
              colorScheme="danger"
              onClick={moveFromHoldingToStateData}
              autoFocus
            >
              Yes, discard changes
            </Button>
            <Button
              colorScheme="secondary"
              variant="clear"
              isFullWidth={isMobile}
              onClick={clearHoldingStateData}
            >
              No, return to editing
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
