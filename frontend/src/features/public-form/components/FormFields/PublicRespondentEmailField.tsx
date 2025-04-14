import { Control, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormLabel, Text } from '@chakra-ui/react'

import { RESPONDENT_EMAIL_FIELD_ID } from '~shared/constants'

import { TagInput } from '~components/TagInput'
import { FormFieldValues } from '~templates/Field'

interface PublicRespondentEmailFieldProps {
  something: string
  control: Control<FormFieldValues>
}

export const PublicRespondentEmailField = ({
  control,
}: PublicRespondentEmailFieldProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Controller
      name={RESPONDENT_EMAIL_FIELD_ID}
      control={control}
      render={({ field }) => (
        <Box>
          <FormLabel>Email me a copy of my responses</FormLabel>
          <TagInput {...field} />
          <Text color="secondary.400" textStyle="body-2" aria-hidden>
            {t('features.publicForm.components.fields.respondentEmail.info')}
          </Text>
        </Box>
      )}
    />
  )
}
