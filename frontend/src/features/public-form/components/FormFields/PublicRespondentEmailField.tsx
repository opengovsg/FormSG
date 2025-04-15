import {
  Control,
  Controller,
  RegisterOptions,
  useFormState,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, FormLabel, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { RESPONDENT_EMAIL_FIELD_ID } from '~shared/constants'

import { OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { TagInput } from '~components/TagInput'

interface RespondentEmailData {
  [RESPONDENT_EMAIL_FIELD_ID]: string[]
}
interface PublicRespondentEmailFieldProps {
  something: string
  control: Control<RespondentEmailData>
}

export const PublicRespondentEmailField = ({
  control,
}: PublicRespondentEmailFieldProps): JSX.Element => {
  const { t } = useTranslation()

  const { errors } = useFormState({
    control,
    name: RESPONDENT_EMAIL_FIELD_ID,
  })

  return (
    <FormControl isInvalid={!!errors?.[RESPONDENT_EMAIL_FIELD_ID]}>
      <Controller<RespondentEmailData>
        name={RESPONDENT_EMAIL_FIELD_ID}
        control={control}
        rules={
          OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES as RegisterOptions<RespondentEmailData>
        }
        render={({ field }) => (
          <Box>
            <FormLabel>Email me a copy of my responses</FormLabel>
            <TagInput
              {...field}
              value={field.value as string[]}
              tagValidation={isEmail}
            />
            {get(errors, `${RESPONDENT_EMAIL_FIELD_ID}.message`) ? (
              <FormErrorMessage>
                {get(errors, `${RESPONDENT_EMAIL_FIELD_ID}.message`)}
              </FormErrorMessage>
            ) : (
              <Text
                color="secondary.400"
                textStyle="body-2"
                aria-hidden
                my="0.125rem" // same as error message margin
              >
                {t(
                  'features.publicForm.components.fields.respondentEmail.info',
                )}
              </Text>
            )}
          </Box>
        )}
      />
      {/* <FormErrorMessage>
        {get(errors, `${RESPONDENT_EMAIL_FIELD_ID}.message`)}
      </FormErrorMessage> */}
    </FormControl>
  )
}
