import { Stack } from '@chakra-ui/react'

import { noPrintCss } from '~utils/noPrintCss'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FloatingIssueFeedbackButton } from './FloatingIssueFeedbackButton'

export const FloatingToolBar = (): JSX.Element | null => {
  const { isPreview, formId, submissionData } = usePublicFormContext()
  if (submissionData) return null

  return (
    <Stack
      direction={{ base: 'row', md: 'column' }}
      position="fixed"
      spacing="1rem"
      bottom={{ base: '1rem', md: '2.625rem' }}
      right={{ base: '1rem', md: '2.75rem' }}
      sx={noPrintCss}
      zIndex="docked"
    >
      <FloatingIssueFeedbackButton isPreview={isPreview} formId={formId} />
    </Stack>
  )
}
