import { Box, Divider, Stack, useDisclosure } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { DeleteStepModal } from '../DeleteStepModal'

import { EndOfWorkflowBlock } from './EndOfWorkflowBlock'
import { NewStepBlock } from './NewStepBlock'
import { SortableStepList } from './SortableStepList'
import { WorkflowCard } from './WorkflowCard'

export const WorkflowContent = (): JSX.Element | null => {
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  const editState = useAdminWorkflowStore(editDataSelector)
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  const editingStepNumber = editState?.stepNumber

  if (isLoading) return null
  return (
    <Stack color="secondary.500" spacing="2.75rem" mt="1.5rem">
      <WorkflowCard />
      <Box>
        {editingStepNumber !== undefined && (
          <DeleteStepModal
            isOpen={isDeleteModalOpen}
            onClose={onDeleteModalClose}
            stepNumber={editingStepNumber}
          />
        )}
        {formWorkflow?.length ? (
          <SortableStepList
            steps={formWorkflow}
            onDeleteModalOpen={onDeleteModalOpen}
          />
        ) : null}
        <Stack spacing="0" alignItems="center">
          <WorkflowStepBlockDivider />
          <NewStepBlock />
        </Stack>
        {formWorkflow?.length ? <EndOfWorkflowBlock /> : null}
      </Box>
    </Stack>
  )
}

export const WorkflowStepBlockDivider = () => (
  <Box alignSelf="center" justifyContent="center" border="none">
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
    <BxsChevronDown />
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
  </Box>
)
