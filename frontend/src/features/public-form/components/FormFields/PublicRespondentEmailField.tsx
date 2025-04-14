import { useTranslation } from 'react-i18next'
import { Box, FormLabel, Text } from '@chakra-ui/react'

import { TagInput } from '~components/TagInput'

interface PublicRespondentEmailFieldProps {
  something: string
}

export const PublicRespondentEmailField = ({
  something,
}: PublicRespondentEmailFieldProps): JSX.Element => {
  const something1 = something

  const { t } = useTranslation()

  return (
    <Box>
      <FormLabel>Email me a copy of my responses</FormLabel>
      <TagInput />
      <Text color="secondary.400" textStyle="body-2" aria-hidden>
        {t('features.publicForm.components.fields.respondentEmail.info')}
      </Text>
    </Box>
  )
}
