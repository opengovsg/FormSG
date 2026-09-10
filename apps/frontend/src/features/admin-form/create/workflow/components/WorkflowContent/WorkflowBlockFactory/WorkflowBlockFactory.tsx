import { useMemo } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { FormWorkflowStepDto } from 'formsg-shared/types'

import {
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
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  const isActiveState = useMemo(
    () => editState?.stepNumber === stepNumber,
    [editState?.stepNumber, stepNumber],
  )

  const peekCardProps: CompletionPeekCardProps = isFirstStepByStepNumber(
    stepNumber,
  )
    ? {
        type: CompletionPeekMomentType.StepOneDone,
        onDeclineAnotherStep: dismissCompletedStep,
        onAddAnotherStep: setToCreating,
      }
    : {
        type: CompletionPeekMomentType.LaterStepDone,
        stepNumber,
        onDeclineAnotherStep: dismissCompletedStep,
        onAddAnotherStep: setToCreating,
      }
  // A workflow without its first step has no entry point, so deleting step 1 is
  // deleting the workflow. Same button, same modal as the workflow's own delete
  // — the outcome is the same, and two different modals would imply otherwise.
  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <>
      {isFirstStep ? (
        <DeleteWorkflowModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
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
