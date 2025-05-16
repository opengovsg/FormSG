import { MdCheck, MdClose } from 'react-icons/md'
import { Circle, Divider, Flex, Icon, Text } from '@chakra-ui/react'

import { StepData, WorkflowStatus } from '~shared/types'

const StatusIcon = ({
  workflowStatus,
  stepNumber,
}: {
  workflowStatus: WorkflowStatus
  stepNumber: number
}): JSX.Element => {
  switch (workflowStatus) {
    case WorkflowStatus.COMPLETED || WorkflowStatus.APPROVED:
      return (
        <Circle size="2rem" bg="#05CC9A">
          <Icon as={MdCheck} color="#F5F6F8" boxSize="1rem" />
        </Circle>
      )
    case WorkflowStatus.PENDING:
      return (
        <Circle size="2rem" border="2px solid" borderColor="#E5E9F8">
          <Text textStyle="caption-2">{stepNumber}</Text>
        </Circle>
      )
    case WorkflowStatus.REJECTED:
      return (
        <Circle size="2rem" bg="#C03434">
          <Icon as={MdClose} color="#F5F6F8" boxSize="1rem" />
        </Circle>
      )
    default:
      return (
        <Circle size="2rem" border="2px solid" borderColor="#E5E9F8"></Circle>
      )
  }
}

const TimelineStep = ({
  name,
  stepNumber,
  timestamp,
  workflowStatus,
}: StepData) => {
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
    <Flex alignItems="center" gap={4}>
      <StatusIcon workflowStatus={workflowStatus} stepNumber={stepNumber} />
      <Flex flexDir="column" gap="0.25rem">
        <Text textStyle="caption-2">{name}</Text>
        <Text textStyle="caption-2">{approvalText}</Text>
        <Text textStyle="caption-2" textColor={'#848484'}>
          {timestamp}
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
      {i !== 0 && (
        <Divider
          borderLeft="2px"
          orientation="vertical"
          h={'28'}
          mx="1rem"
          my="-1.5rem"
          borderColor="interaction.support.disabled"
          zIndex={1}
          mt="0.25rem"
          mb="0.25rem"
        />
      )}
      <TimelineStep {...step} />
    </>
  ))
}
