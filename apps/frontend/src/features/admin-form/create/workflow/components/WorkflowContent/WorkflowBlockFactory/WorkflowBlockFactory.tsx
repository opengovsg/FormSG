import { useMemo } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { FormWorkflowStepDto } from 'formsg-shared/types'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import {
  continueToEmailCardSelector,
  dismissCompletedStepSelector,
  editDataSelector,
  setToCreatingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { DeleteStepModal } from '../../DeleteStepModal'
import { DeleteWorkflowModal } from '../../DeleteWorkflowModal'
import {
  CompletionPeekCard,
  CompletionPeekCardProps,
  useReportedCompletedStep,
} from '../../GuidedCreation'
import { CompletionPeekMomentType } from '../../GuidedCreation/utils/completionPeekContent'
import { ActiveStepBlock } from '../ActiveStepBlock'
import { InactiveStepBlock } from '../InactiveStepBlock'
import { isCompletionEmailCardReachable } from '../utils/isCompletionEmailCardReachable'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

export interface WorkflowBlockFactoryProps {
  stepNumber: number
  step: FormWorkflowStepDto
}

export const WorkflowBlockFactory = ({
  stepNumber,
  step,
}: WorkflowBlockFactoryProps): JSX.Element => {
  const editState = useAdminWorkflowStore(editDataSelector)
  const reportedStepNumber = useReportedCompletedStep()
  const dismissCompletedStep = useAdminWorkflowStore(
    dismissCompletedStepSelector,
  )
  const setToCreating = useAdminWorkflowStore(setToCreatingSelector)
  const continueToEmailCard = useAdminWorkflowStore(continueToEmailCardSelector)
  const { data: settings, isError: isSettingsError } = useAdminFormSettings()
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  const isActiveState = useMemo(
    () => editState?.stepNumber === stepNumber,
    [editState?.stepNumber, stepNumber],
  )

  const onDeclineAnotherStep = isCompletionEmailCardReachable({
    settings,
    isSettingsError,
  })
    ? continueToEmailCard
    : dismissCompletedStep

  const peekCardProps: CompletionPeekCardProps = isFirstStepByStepNumber(
    stepNumber,
  )
    ? {
        type: CompletionPeekMomentType.StepOneDone,
        onDeclineAnotherStep,
        onAddAnotherStep: setToCreating,
      }
    : {
        type: CompletionPeekMomentType.LaterStepDone,
        stepNumber,
        onDeclineAnotherStep,
        onAddAnotherStep: setToCreating,
      }
  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <>
      {isFirstStep ? (
        <DeleteWorkflowModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          entryPoint="first-step"
        />
      ) : (
        <DeleteStepModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          stepNumber={stepNumber}
        />
      )}
      {isActiveState ? (
        <ActiveStepBlock
          stepNumber={stepNumber}
          step={step}
          handleOpenDeleteModal={onDeleteModalOpen}
        />
      ) : (
        <InactiveStepBlock stepNumber={stepNumber} step={step} />
      )}
      {reportedStepNumber === stepNumber ? (
        <CompletionPeekCard {...peekCardProps} />
      ) : null}
    </>
  )
}
