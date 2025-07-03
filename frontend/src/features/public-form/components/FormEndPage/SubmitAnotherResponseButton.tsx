import { Box } from '@chakra-ui/react'

import { FormColorTheme, FormDto } from '~shared/types/form'

import Button from '~components/Button'

export interface SubmitAnotherResponseButtonProps {
  endPage: FormDto['endPage']
  colorTheme?: FormColorTheme
}

export const SubmitAnotherResponseButton = ({
  endPage,
  colorTheme,
}: SubmitAnotherResponseButtonProps): JSX.Element => {
  return (
    <Box>
      <Button
        as="a"
        href={endPage.buttonLink || window.location.href}
        variant="solid"
        colorScheme={`theme-${colorTheme}`}
      >
        {endPage.buttonText || 'Submit another response'}
      </Button>
    </Box>
  )
}
