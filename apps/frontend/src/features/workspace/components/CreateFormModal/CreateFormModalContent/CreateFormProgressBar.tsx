import { Box } from '@chakra-ui/react'

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
    <Box
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={numSteps}
      aria-label={`Step ${currentStep} of ${numSteps}`}
      h="0.25rem"
      w="100%"
      bg="neutral.300"
      overflow="hidden"
    >
      <Box
        data-testid="progress-fill"
        h="100%"
        w={`${progress}%`}
        bg="primary.500"
        transition="width 0.3s ease"
      />
    </Box>
  )
}
