import { Box } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

interface AuthSettingsDisabledExplanationTextProps {
  isFormPublic: boolean
  containsMyInfoFields: boolean
}

export const AuthSettingsDisabledExplanationText = ({
  isFormPublic,
  containsMyInfoFields,
}: AuthSettingsDisabledExplanationTextProps) => {
  return (
    <Box marginY="2.5rem">
      {containsMyInfoFields ? (
        <InlineMessage marginBottom="1rem">
          To change Singpass authentication settings, close your form to new
          responses and remove all existing Myinfo fields.
        </InlineMessage>
      ) : isFormPublic ? (
        <InlineMessage marginBottom="1rem">
          To change Singpass authentication settings, close your form to new
          responses.
        </InlineMessage>
      ) : null}
    </Box>
  )
}
