import { Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { Button } from './Button'

interface NextAndBackButtonProps {
  handleBack: () => void
  handleNext: () => void
  nextButtonLabel?: string
  nextButtonIcon?: JSX.Element
  backButtonLabel?: string
  isNextLoading?: boolean
  isNextDisabled?: boolean
  isBackDisabled?: boolean
  nextButtonColorScheme?: 'danger'
}

export const NextAndBackButtonGroup = ({
  handleBack,
  handleNext,
  nextButtonLabel = 'Next',
  nextButtonIcon,
  backButtonLabel = 'Back',
  isNextLoading = false,
  isNextDisabled = false,
  isBackDisabled = false,
  nextButtonColorScheme,
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
        textStyle="subhead-2"
        isLoading={isNextLoading}
        colorScheme={nextButtonColorScheme}
        isDisabled={isNextDisabled}
        onClick={handleNext}
        isFullWidth={isMobile}
        leftIcon={nextButtonIcon}
      >
        {nextButtonLabel}
      </Button>
      <Button
        variant="clear"
        textStyle="subhead-2"
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
