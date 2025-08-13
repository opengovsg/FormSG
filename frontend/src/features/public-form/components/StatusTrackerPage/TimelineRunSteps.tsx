import { MdCheck, MdClose } from 'react-icons/md'
import {
  BackgroundProps,
  Box,
  Circle,
  Divider,
  Flex,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react'
import { format } from 'date-fns'

import { StepData, WorkflowStatus } from '~shared/types'

const statusColor: Record<WorkflowStatus, BackgroundProps['bg']> = {
  [WorkflowStatus.PENDING]: '#E5E9F8', // grey
  [WorkflowStatus.COMPLETED]: '#05CC9A', // green
  [WorkflowStatus.APPROVED]: '#05CC9A',
  [WorkflowStatus.REJECTED]: '#C03434', // red
}

const statusTextMap: Record<WorkflowStatus, string | undefined> = {
  [WorkflowStatus.APPROVED]: 'Approved',
  [WorkflowStatus.REJECTED]: 'Not approved',
  [WorkflowStatus.PENDING]: undefined,
  [WorkflowStatus.COMPLETED]: undefined,
}

const StatusIcon = ({
  workflowStatus,
  stepNumber,
  isCurrentPendingStep,
}: {
  workflowStatus: WorkflowStatus
  stepNumber: number
  isCurrentPendingStep: boolean | undefined
}): JSX.Element => {
  if (isCurrentPendingStep) {
    return (
      <Circle size="2rem" border="2px" borderColor="warning.500" bg="yellow.50">
        <Text textStyle="caption-2">{stepNumber}</Text>
      </Circle>
    )
  }

  switch (workflowStatus) {
    case WorkflowStatus.COMPLETED:
    case WorkflowStatus.APPROVED:
      return (
        <Circle size="2rem" bg={statusColor[workflowStatus]}>
          <Icon as={MdCheck} color="#F5F6F8" boxSize="1rem" />
        </Circle>
      )
    case WorkflowStatus.PENDING:
      return (
        <Circle
          size="2rem"
          border="2px solid"
          borderColor={statusColor[workflowStatus]}
        >
          <Text textStyle="caption-2">{stepNumber}</Text>
        </Circle>
      )
    case WorkflowStatus.REJECTED:
      return (
        <Circle size="2rem" bg={statusColor[workflowStatus]}>
          <Icon as={MdClose} color="#F5F6F8" boxSize="1rem" />
        </Circle>
      )
    default:
      return (
        <Circle
          size="2rem"
          border="2px solid"
          borderColor={statusColor[workflowStatus]}
        ></Circle>
      )
  }
}

const TimelineStep = ({
  name,
  stepNumber,
  timestamp,
  workflowStatus,
  isCurrentPendingStep,
}: StepData) => {
  const submissionTimestamp = timestamp
    ? format(new Date(timestamp), 'do MMM yyyy, h:mm:ss a')
    : timestamp

  const approvalText = isCurrentPendingStep
    ? 'Pending'
    : statusTextMap[workflowStatus]

  return (
    <Box>
      <Flex alignItems="center" gap={4} height="3.5rem">
        <StatusIcon
          workflowStatus={workflowStatus}
          stepNumber={stepNumber}
          isCurrentPendingStep={isCurrentPendingStep}
        />
        <Stack spacing="4px">
          <Text textStyle="caption-2">{name}</Text>
          {approvalText ? (
            <Text textStyle="caption-2" color="content.medium">
              {approvalText}
            </Text>
          ) : null}
          {submissionTimestamp ? (
            <Text textStyle="caption-2" color="content.medium">
              {submissionTimestamp}
            </Text>
          ) : null}
        </Stack>
      </Flex>
    </Box>
  )
}

export const TimelineRunSteps = ({
  steps,
}: {
  steps: StepData[]
}): JSX.Element[] => {
  return steps.map((step, i) => (
    <>
      <TimelineStep {...step} />
      {i !== steps.length - 1 && (
        <Divider
          borderLeft="2px"
          orientation="vertical"
          h="2rem"
          mx="1rem"
          my="1.5rem"
          borderColor={
            step.workflowStatus === WorkflowStatus.REJECTED
              ? statusColor[WorkflowStatus.PENDING]
              : statusColor[step.workflowStatus]
          }
          zIndex={1}
          mt="0rem"
          mb="0rem"
        />
      )}
    </>
  ))
}
