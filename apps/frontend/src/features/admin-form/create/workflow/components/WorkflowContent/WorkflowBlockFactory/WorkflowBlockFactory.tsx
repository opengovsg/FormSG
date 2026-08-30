import { useMemo } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { FormWorkflowStepDto } from 'formsg-shared/types'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { DeleteStepModal } from '../../DeleteStepModal'
import { DeleteWorkflowModal } from '../../DeleteWorkflowModal'
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
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  const isActiveState = useMemo(
    () => editState?.stepNumber === stepNumber,
    [editState?.stepNumber, stepNumber],
  )

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
    </>
  )
}
