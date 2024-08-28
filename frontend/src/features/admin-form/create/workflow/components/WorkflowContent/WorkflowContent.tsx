import { useEffect } from 'react'
import { Box, Divider, Stack } from '@chakra-ui/react'

import { WorkflowType } from '~shared/types'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

import {
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { DefaultOutcomeNotificationBlock } from './DefaultOutcomeNotificationBlock'
import { HeaderBlock } from './HeaderBlock'
import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'

export const WorkflowContent = (): JSX.Element | null => {
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)

  const hasOnlyStepOne = formWorkflow?.length === 1
  const firstStep = formWorkflow?.[0]
  const isStepOneEmpty =
    firstStep &&
    firstStep.edit.length === 0 &&
    (firstStep.workflow_type === WorkflowType.Static ||
      (firstStep.workflow_type === WorkflowType.Dynamic && !firstStep.field))

  useEffect(() => {
    if (hasOnlyStepOne && isStepOneEmpty) {
      setToEditing(0)
    }
  }, [hasOnlyStepOne, isStepOneEmpty, setToEditing])

  if (isLoading) return null

  return (
    <Stack color="secondary.500" spacing="1rem">
      <HeaderBlock />
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        <NewStepBlock />
      </Stack>
      <DefaultOutcomeNotificationBlock />
    </Stack>
  )
}

const WorkflowStepBlockDivider = () => (
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
