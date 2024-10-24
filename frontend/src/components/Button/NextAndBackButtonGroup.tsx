import { Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { Button } from './Button'

interface NextAndBackButtonProps {
  handleBack: () => void
  handleNext: () => void
  nextButtonLabel?: string
  backButtonLabel?: string
  isNextDisabled?: boolean
  isBackDisabled?: boolean
}

export const NextAndBackButtonGroup = ({
  handleBack,
  handleNext,
  nextButtonLabel = 'Next',
  backButtonLabel = 'Back',
  isNextDisabled = false,
  isBackDisabled = false,
}: NextAndBackButtonProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Stack
      justify="flex-start"
      align="center"
      spacing="1rem"
      direction={{ base: 'column', md: 'row-reverse' }}
      w="100%"
    >
      <Button
        isDisabled={isNextDisabled}
        onClick={handleNext}
        isFullWidth={isMobile}
      >
        {nextButtonLabel}
      </Button>
      <Button
        variant="clear"
        colorScheme="secondary"
        isDisabled={isBackDisabled}
        onClick={handleBack}
        isFullWidth={isMobile}
      >
        {backButtonLabel}
      </Button>
    </Stack>
  )
}
