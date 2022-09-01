import { useCallback, useMemo } from 'react'
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

import { useDesignStore } from '~features/admin-form/create/builder-and-design/useDesignStore'
import { useFieldBuilderStore } from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { useCreatePageSidebar } from '~features/admin-form/create/common'

export const useDirtyModal = () => {
  const isMobile = useIsMobile()
  const {
    handleBuilderClick,
    handleDesignClick,
    pendingTab,
    movePendingToActiveTab,
    clearPendingTab,
  } = useCreatePageSidebar()

  const { designHoldingState, designMoveFromHolding, designClearHoldingState } =
    useDesignStore(
      useCallback(
        (state) => ({
          designHoldingState: state.holdingState,
          designMoveFromHolding: state.moveFromHolding,
          designClearHoldingState: state.clearHoldingState,
        }),
        [],
      ),
    )

  const {
    builderHoldingStateData,
    builderClearHoldingStateData,
    builderMoveFromHolding,
  } = useFieldBuilderStore(
    useCallback((state) => {
      return {
        builderHoldingStateData: state.holdingStateData,
        builderClearHoldingStateData: state.clearHoldingStateData,
        builderMoveFromHolding: state.moveFromHolding,
      }
    }, []),
  )

  const handleConfirmNavigate = useCallback(() => {
    if (builderHoldingStateData !== null) {
      builderMoveFromHolding()
      handleBuilderClick(false)
    } else if (designHoldingState !== null) {
      designMoveFromHolding()
      handleDesignClick(false)
    } else if (pendingTab !== undefined) {
      movePendingToActiveTab()
    }
  }, [
    builderHoldingStateData,
    builderMoveFromHolding,
    designHoldingState,
    designMoveFromHolding,
    handleBuilderClick,
    handleDesignClick,
    movePendingToActiveTab,
    pendingTab,
  ])

  const handleCancelNavigate = useCallback(() => {
    if (builderHoldingStateData !== null) {
      builderClearHoldingStateData()
    } else if (designHoldingState !== null) {
      designClearHoldingState()
    } else if (pendingTab !== undefined) {
      clearPendingTab()
    }
  }, [
    builderClearHoldingStateData,
    builderHoldingStateData,
    clearPendingTab,
    designClearHoldingState,
    designHoldingState,
    pendingTab,
  ])

  const isOpen = useMemo(
    () =>
      builderHoldingStateData !== null ||
      designHoldingState !== null ||
      pendingTab !== undefined,
    [builderHoldingStateData, designHoldingState, pendingTab],
  )

  return {
    isMobile,
    isOpen,
    handleConfirmNavigate,
    handleCancelNavigate,
  }
}

/**
 * @preconditions Must be nested in CreatePageSidebarProvider as context is used.
 */
export const DirtyModal = (): JSX.Element => {
  const { isOpen, handleCancelNavigate, handleConfirmNavigate, isMobile } =
    useDirtyModal()

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancelNavigate}
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
              onClick={handleConfirmNavigate}
              autoFocus
            >
              Yes, discard changes
            </Button>
            <Button
              colorScheme="secondary"
              variant="clear"
              isFullWidth={isMobile}
              onClick={handleCancelNavigate}
            >
              No, return to editing
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
