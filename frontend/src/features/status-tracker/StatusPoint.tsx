import { MdCheck, MdClose, MdRadioButtonUnchecked } from 'react-icons/md'
import {
  Box,
  Circle,
  Divider,
  Flex,
  Icon,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
} from '@chakra-ui/react'

import { StepData } from '~shared/types'

export const StatusTrackerStepper = ({
  steps,
  activeStep,
}: {
  steps: StepData[]
  activeStep: number
}): JSX.Element => {
  return (
    <Stepper
      index={activeStep}
      orientation="vertical"
      gap="0rem"
      lineHeight="2rem"
    >
      {steps.map((step, index) => (
        <Step key={index}>
          <Flex direction={'row'} align="center">
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>

            <Box flexShrink="0">
              <StepTitle>{step.name}</StepTitle>
              {step.timestamp ? (
                <StepDescription>{step.timestamp}</StepDescription>
              ) : null}
            </Box>
          </Flex>
          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  )
}

type TimelineStepProps = {
  name: string
  stepNumber: number
  timestamp: string | undefined
  isApprovalAndRejected?: boolean
}

enum StatusType {
  PENDING,
  COMPLETED,
  REJECTED,
}

const StatusIcon = ({
  statusType,
  stepNumber,
}: {
  statusType: StatusType
  stepNumber: number
}): JSX.Element => {
  switch (statusType) {
    case StatusType.COMPLETED:
      return (
        <Circle size="2rem" bg="#05CC9A">
          <Icon as={MdCheck} color="#F5F6F8" boxSize="1rem" />
        </Circle>
      )
    case StatusType.PENDING:
      return (
        <Circle size="2rem" border="2px solid" borderColor="#E5E9F8">
          <Text textStyle="caption-2">{stepNumber}</Text>
        </Circle>
      )
    case StatusType.REJECTED:
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
  isApprovalAndRejected,
}: TimelineStepProps) => {
  return (
    <Flex alignItems="center" gap={4}>
      <StatusIcon statusType={StatusType.COMPLETED} />
      <Flex flexDir="column" gap="0.25rem">
        <Text textStyle="caption-2" fontSize={12}>
          {name}
        </Text>
        <Text textStyle="caption-2" textColor={'#848484'}>
          {timestamp}
        </Text>
      </Flex>
    </Flex>
  )
}

// Used for public view
export enum RunStepStatusType {
  FORM_SUBMITTED = 1,
  AWAITING_REVIEW,
  PROCESSED,
  APPROVED,
  REJECTED,
}

export const TimelineRunSteps = ({
  steps,
}: {
  steps: StepData[]
}): JSX.Element[] => {
  const timelineStepProps = steps.map((step, i) => {

    return {
      name: step.name,
      timestamp: step.timestamp,
    }
  })

  return timelineStepProps.map((props, i) => (
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
      <TimelineStep {...props} />
    </>
  ))
}
