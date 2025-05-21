import { MdCheck, MdClose } from 'react-icons/md'
import { Circle, Divider, Flex, Icon, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { StepData, WorkflowStatus } from '~shared/types'

const statusColor: Record<WorkflowStatus, string> = {
  [WorkflowStatus.PENDING]: '#E5E9F8', // grey
  [WorkflowStatus.COMPLETED]: '#05CC9A', // green
  [WorkflowStatus.APPROVED]: '#05CC9A',
  [WorkflowStatus.REJECTED]: '#C03434', // red
}
const StatusIcon = ({
  workflowStatus,
  stepNumber,
}: {
  workflowStatus: WorkflowStatus
  stepNumber: number
}): JSX.Element => {
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
}: StepData) => {
  const submissionTimestamp = timestamp
    ? format(new Date(timestamp), 'dd MMM yyyy, HH:mm:ss z')
    : timestamp

  let approvalText
  switch (workflowStatus) {
    case WorkflowStatus.APPROVED:
      approvalText = 'Approved'
      break
    case WorkflowStatus.REJECTED:
      approvalText = 'Not Approved'
      break
    default:
      approvalText = undefined
      break
  }

  return (
    <Flex alignItems="center" gap={4} height="3.5rem">
      <StatusIcon workflowStatus={workflowStatus} stepNumber={stepNumber} />
      <Flex flexDir="column" gap="0.25rem">
        <Text textStyle="caption-2">{name}</Text>
        <Text textStyle="caption-2" textColor={'#848484'}>
          {approvalText}
        </Text>
        <Text textStyle="caption-2" textColor={'#848484'}>
          {submissionTimestamp}
        </Text>
      </Flex>
    </Flex>
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
          borderColor={statusColor[step.workflowStatus]}
          zIndex={1}
          mt="0rem"
          mb="0rem"
        />
      )}
    </>
  ))
}
