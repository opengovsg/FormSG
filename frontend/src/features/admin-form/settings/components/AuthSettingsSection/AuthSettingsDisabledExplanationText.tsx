import { Box } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

interface AuthSettingsDisabledExplanationTextProps {
  isFormPublic: boolean
  containsMyInfoFields: boolean
}

const CONTAINS_MYINFO_FIELDS_DISABLED_EXPLANATION_TEXT =
  'To change Singpass settings, close your form to new responses. For Singpass authentication changes, remove all existing Myinfo fields.'
const FORM_IS_PUBLIC_DISABLED_EXPLANATION_TEXT =
  'To change Singpass settings, close your form to new responses.'

export const AuthSettingsDisabledExplanationText = ({
  isFormPublic,
  containsMyInfoFields,
}: AuthSettingsDisabledExplanationTextProps) => {
  const explanationText = containsMyInfoFields
    ? CONTAINS_MYINFO_FIELDS_DISABLED_EXPLANATION_TEXT
    : isFormPublic
      ? FORM_IS_PUBLIC_DISABLED_EXPLANATION_TEXT
      : null

  if (!explanationText) {
    return null
  }
  return (
    <Box my="2.5rem">
      <InlineMessage mb="1rem">{explanationText}</InlineMessage>
    </Box>
  )
}
