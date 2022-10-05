import { useCallback, useMemo } from 'react'

import { UnsavedChangesModal } from '~templates/NavigationPrompt'

import { useDesignStore } from '~features/admin-form/create/builder-and-design/useDesignStore'
import { useFieldBuilderStore } from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { useCreatePageSidebar } from '~features/admin-form/create/common'

export const useDirtyModal = () => {
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

  const isOpen = useMemo(() => {
    return (
      builderHoldingStateData !== null ||
      designHoldingState !== null ||
      pendingTab !== undefined
    )
  }, [builderHoldingStateData, designHoldingState, pendingTab])

  return {
    isOpen,
    handleConfirmNavigate,
    handleCancelNavigate,
  }
}

/**
 * @preconditions Must be nested in CreatePageSidebarProvider as context is used.
 */
export const DirtyModal = (): JSX.Element => {
  const { isOpen, handleCancelNavigate, handleConfirmNavigate } =
    useDirtyModal()

  return (
    <UnsavedChangesModal
      isOpen={isOpen}
      onClose={handleCancelNavigate}
      cancelButtonText="No, return to editing"
      onConfirm={handleConfirmNavigate}
      onCancel={handleCancelNavigate}
    />
  )
}
