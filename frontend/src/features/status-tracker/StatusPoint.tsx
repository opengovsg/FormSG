import {
  Box,
  Flex,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
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
    <Stepper index={activeStep} orientation="vertical">
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
          <StepSeparator size="2rem" />
        </Step>
      ))}
    </Stepper>
  )
}
