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
      // height="200px"
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
  timestamp: string | undefined
  showCompletedLabel: boolean
}

enum StatusType {
  PENDING,
  COMPLETED,
  REJECTED,
}

const StatusIcon = ({
  statusType,
}: {
  statusType: StatusType
}): JSX.Element => {
  return (
    // <Icon as={MdCheck}></Icon>
    <Circle size="2rem" border="2px solid" borderColor="#E5E9F8">
      <Icon as={MdCheck} color="green.500" boxSize="16px" />
    </Circle>
  )
}

const TimelineStep = ({
  name,
  timestamp,
  showCompletedLabel,
}: TimelineStepProps) => {
  return (
    <Flex alignItems="center" gap={4}>

      <StatusIcon statusType={StatusType.COMPLETED} />
      <Flex flexDir="column" gap="0.25rem">
        {/* {showCompletedLabel && (
          <Text
            textStyle="subhead-3"
            fontSize={10}
            lineHeight={4}
            textColor="brand.secondary.500"
          >
            Completed
          </Text>
        )} */}
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
    // const STATUS_COLOR_COMPLETE = 'interaction.support.disabled'
    // const STATUS_COLOR_PENDING = 'base.content.brand'
    // const STATUS_COLOR_SUCCESS = 'interaction.success.default'
    // const STATUS_COLOR_CRITICAL = 'interaction.critical.default'

    // const isLastStep = i === steps.length - 1

    // const dateString = format(new Date(step.date), 'd MMM yyyy, h:mm aa')

    // let statusColor, statusText, descriptionText
    // switch (step.statusType) {
    //   case RunStepStatusType.FORM_SUBMITTED: {
    //     statusColor = STATUS_COLOR_COMPLETE
    //     statusText = 'Form submitted'
    //     descriptionText = dateString
    //     break
    //   }
    //   case RunStepStatusType.PROCESSED: {
    //     statusColor = STATUS_COLOR_SUCCESS
    //     statusText = 'Processed'
    //     descriptionText = dateString
    //     break
    //   }
    //   case RunStepStatusType.AWAITING_REVIEW: {
    //     statusColor = STATUS_COLOR_PENDING
    //     statusText = 'Awaiting review'
    //     descriptionText =
    //       'We appreciate your patience as we process your response'
    //     break
    //   }
    //   case RunStepStatusType.APPROVED: {
    //     statusColor = STATUS_COLOR_SUCCESS
    //     statusText = 'Approved'
    //     descriptionText = dateString
    //     break
    //   }
    //   case RunStepStatusType.REJECTED: {
    //     statusColor = STATUS_COLOR_CRITICAL
    //     statusText = 'Rejected'
    //     descriptionText = dateString
    //     break
    //   }
    // }

    return {
      name: step.name,
      timestamp: step.timestamp,
      // statusColor: isLastStep ? statusColor : STATUS_COLOR_COMPLETE,
      // statusText,
      // descriptionText,
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
      <TimelineStep {...props} showCompletedLabel={true && i === 0} />
    </>
  ))
}
