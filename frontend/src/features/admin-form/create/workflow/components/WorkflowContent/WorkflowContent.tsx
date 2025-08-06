import { Box, Divider, Stack } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const WorkflowContent = (): JSX.Element | null => {
  const { formWorkflow, isLoading } = useAdminFormWorkflow()

  if (isLoading) return null
  console.log({ formWorkflow })
  return (
    <Stack color="secondary.500" spacing="2.75rem">
      <Box
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        borderRadius="4px"
        padding="1.5rem"
        mt={{ base: '1.5rem', md: '2rem' }}
      >
        <StatusTrackerToggle />
      </Box>
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        <NewStepBlock />
      </Stack>
      {formWorkflow?.length == 0 ? null : <WorkflowCompletionMessageBlock />}
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
