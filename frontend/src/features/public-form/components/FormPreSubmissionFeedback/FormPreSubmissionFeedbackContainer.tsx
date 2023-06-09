import { Box } from '@chakra-ui/react'

import { FormPreSubmissionFeedbackButton } from './FormPreSubmissionFeedbackButton'

export const FormPreSubmissionFeedbackContainer = (): JSX.Element | null => {
  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      <FormPreSubmissionFeedbackButton />
    </Box>
  )
}
