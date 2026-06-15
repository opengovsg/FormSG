import { Box, Divider, Stack, Text } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { EndOfWorkflowBlock } from './EndOfWorkflowBlock'
import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'

export const WorkflowContent = (): JSX.Element | null => {
  const { formWorkflow, isLoading } = useAdminFormWorkflow()

  if (isLoading) return null
  return (
    <Stack color="secondary.500" spacing="2.75rem" mt="1.5rem">
      {/* <HeaderBlock /> */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        borderRadius="4px"
        padding="1.5rem"
      >
        <Stack gap={'1.5rem'}>
          <Text as="h2" textStyle="h2">
            Workflow
          </Text>
          <Divider />
          <StatusTrackerToggle />
        </Stack>
      </Box>
      <Box>
        <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
          {formWorkflow?.map((step, i) => (
            <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
          ))}
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
