import { useMemo } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { FormWorkflowStepDto } from '~shared/types'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { DeleteStepModal } from '../../DeleteStepModal'
import { ActiveStepBlock } from '../ActiveStepBlock'
import { InactiveStepBlock } from '../InactiveStepBlock'

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

  return (
    <>
      <DeleteStepModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        stepNumber={stepNumber}
      />
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
