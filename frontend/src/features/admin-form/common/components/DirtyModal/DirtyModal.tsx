import { useTranslation } from 'react-i18next'

import { UnsavedChangesModal } from '~templates/NavigationPrompt'

import { usePaymentStore } from '~features/admin-form/create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { FieldListTabIndex } from '~features/admin-form/create/builder-and-design/constants'
import { useDesignStore } from '~features/admin-form/create/builder-and-design/useDesignStore'
import { useFieldBuilderStore } from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { useCreatePageSidebar } from '~features/admin-form/create/common'
import {
  clearHoldingStateDataSelector,
  holdingStateDataSelector,
  moveFromHoldingSelector,
  useAdminWorkflowStore,
} from '~features/admin-form/create/workflow/adminWorkflowStore'

export const useDirtyModal = () => {
  const {
    handleClose,
    handleBuilderClick,
    handleDesignClick,
    handleWorkflowClick,
    pendingTab,
    movePendingToActiveTab,
    clearPendingTab,
    setFieldListTabIndex,
  } = useCreatePageSidebar()

  const { designHoldingState, designMoveFromHolding, designClearHoldingState } =
    useDesignStore((state) => ({
      designHoldingState: state.holdingState,
      designMoveFromHolding: state.moveFromHolding,
      designClearHoldingState: state.clearHoldingState,
    }))

  const {
    paymentHoldingState,
    paymentMoveFromHolding,
    paymentClearHoldingState,
  } = usePaymentStore((state) => ({
    paymentHoldingState: state.holdingState,
    paymentMoveFromHolding: state.moveFromHolding,
    paymentClearHoldingState: state.clearHoldingState,
  }))

  const {
    builderHoldingStateData,
    builderClearHoldingStateData,
    builderMoveFromHolding,
  } = useFieldBuilderStore((state) => ({
    builderHoldingStateData: state.holdingStateData,
    builderClearHoldingStateData: state.clearHoldingStateData,
    builderMoveFromHolding: state.moveFromHolding,
  }))

  const {
    workflowHoldingStateData,
    workflowClearHoldingStateData,
    workflowMoveFromHolding,
  } = useAdminWorkflowStore((state) => ({
    workflowHoldingStateData: holdingStateDataSelector(state),
    workflowClearHoldingStateData: clearHoldingStateDataSelector(state),
    workflowMoveFromHolding: moveFromHoldingSelector(state),
  }))

  const handleConfirmNavigate = () => {
    if (builderHoldingStateData !== null) {
      builderMoveFromHolding()
      handleBuilderClick(false)
    } else if (designHoldingState !== null) {
      designMoveFromHolding()
      handleDesignClick(false)
    } else if (paymentHoldingState !== null) {
      paymentMoveFromHolding()
      // Simulate closing the builder drawer first to ensure that the drawer state resets
      handleClose(false)
      handleBuilderClick(false)
      setFieldListTabIndex(FieldListTabIndex.Payments)
    } else if (workflowHoldingStateData !== null) {
      workflowMoveFromHolding()
      handleWorkflowClick(false)
    } else if (pendingTab !== undefined) {
      movePendingToActiveTab()
    }
  }

  const handleCancelNavigate = () => {
    if (builderHoldingStateData !== null) {
      builderClearHoldingStateData()
    } else if (designHoldingState !== null) {
      designClearHoldingState()
    } else if (paymentHoldingState !== null) {
      paymentClearHoldingState()
    } else if (workflowHoldingStateData !== null) {
      workflowClearHoldingStateData()
    } else if (pendingTab !== undefined) {
      clearPendingTab()
    }
  }

  const isOpen =
    builderHoldingStateData !== null ||
    designHoldingState !== null ||
    paymentHoldingState !== null ||
    workflowHoldingStateData !== null ||
    pendingTab !== undefined

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
  const { t } = useTranslation()

  return (
    <UnsavedChangesModal
      isOpen={isOpen}
      onClose={handleCancelNavigate}
      cancelButtonText={t('features.adminForm.modals.dirty.cancelButtonText')}
      onConfirm={handleConfirmNavigate}
      onCancel={handleCancelNavigate}
    />
  )
}
