import { Box } from '@chakra-ui/react'

import { FormIssueFeedbackButton } from './FormIssueFeedbackButton'

export const FormIssueFeedbackContainer = (): JSX.Element | null => {
  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      <FormIssueFeedbackButton />
    </Box>
  )
}
