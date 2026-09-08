import { Box, Divider, Stack, Text } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'
import { GuidedSetupToggle, useReportedCompletedStep } from '../GuidedCreation'

import { CompletionEmailBlock } from './CompletionEmailBlock'
import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const STEP_CONNECTOR_TEST_ID = 'workflow-step-connector'

export const WorkflowContent = (): JSX.Element | null => {
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isReportingCompletedStep = useReportedCompletedStep() !== null

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
          <GuidedSetupToggle />
        </Stack>
      </Box>
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        {isReportingCompletedStep ? null : <NewStepBlock />}
      </Stack>
      {formWorkflow?.length ? (
        isRedesign ? (
          <CompletionEmailBlock />
        ) : (
          <WorkflowCompletionMessageBlock />
        )
      ) : null}
    </Stack>
  )
}

const WorkflowStepBlockDivider = () => (
  <Box
    data-testid={STEP_CONNECTOR_TEST_ID}
    alignSelf="center"
    justifyContent="center"
    border="none"
  >
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
