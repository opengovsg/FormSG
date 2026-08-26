import { useMemo } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { FormWorkflowStepDto } from 'formsg-shared/types'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { DeleteStepModal } from '../../DeleteStepModal'
import { ActiveStepBlock } from '../ActiveStepBlock'
import { InactiveStepBlock } from '../InactiveStepBlock'
import { UnsetStepBlock } from '../UnsetStepBlock'

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
      ) : step.isPlaceholder ? (
        // The slot left by deleting step 1. Rendering it as a normal step would
        // claim it routes to anyone with the form link, which it does not: the
        // workflow is not running at all until it is set up.
        <UnsetStepBlock stepNumber={stepNumber} />
      ) : (
        <InactiveStepBlock stepNumber={stepNumber} step={step} />
      )}
    </>
  )
}
