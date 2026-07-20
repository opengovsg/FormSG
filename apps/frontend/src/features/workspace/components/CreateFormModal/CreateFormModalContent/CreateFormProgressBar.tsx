import { Box, Container } from '@chakra-ui/react'

interface CreateFormProgressBarProps {
  currentStepIdx: number
  numSteps: number
}

/** Progress bar shown across the paper-tracking create-form set-up pages. */
export const CreateFormProgressBar = ({
  currentStepIdx,
  numSteps,
}: CreateFormProgressBarProps): JSX.Element => {
  const currentStep = currentStepIdx + 1
  const progress = (currentStep / numSteps) * 100

  return (
    <Box px="1.5rem" pt="1.5rem">
      <Container maxW="45rem" p={0}>
        <Box
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={numSteps}
          aria-label={`Step ${currentStep} of ${numSteps}`}
          h="0.25rem"
          w="100%"
          bg="neutral.200"
          borderRadius="2px"
          overflow="hidden"
        >
          <Box
            data-testid="progress-fill"
            h="100%"
            w={`${progress}%`}
            bg="primary.500"
            borderRadius="2px"
            transition="width 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
          />
        </Box>
      </Container>
    </Box>
  )
}
