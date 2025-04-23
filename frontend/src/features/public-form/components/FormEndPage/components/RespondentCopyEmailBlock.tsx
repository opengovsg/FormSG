import { Controller, get, RegisterOptions, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  chakra,
  FormControl,
  FormLabel,
  Stack,
  Text,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { REQUIRED_ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { TagInput } from '~components/TagInput'
import Button from '~components/Button'

export type RespondentCopyEmailBlockInput = {
  emails?: string[]
}

export interface RespondentCopyEmailBlockProps {
  onSubmit: (input: RespondentCopyEmailBlockInput) => void
}

export const RespondentCopyEmailBlock = ({
  onSubmit,
}: RespondentCopyEmailBlockProps): JSX.Element => {
  const { t } = useTranslation()

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<RespondentCopyEmailBlockInput>()

  const handleFormSubmit = handleSubmit((inputs) => onSubmit(inputs))

  return (
    <chakra.form w="100%" maxW="100%" noValidate onSubmit={handleFormSubmit}>
      <FormControl isInvalid={!!errors?.emails}>
        <Controller
          name="emails"
          control={control}
          rules={
            REQUIRED_ADMIN_EMAIL_VALIDATION_RULES as RegisterOptions<
              RespondentCopyEmailBlockInput,
              'emails'
            >
          }
          render={({ field }) => (
            <Box>
              <FormLabel>
                {t(
                  'features.publicForm.components.respondentCopyEmailBlock.title',
                )}
              </FormLabel>
              <Stack direction="row">
                <TagInput
                  {...field}
                  value={field.value as string[]}
                  tagValidation={isEmail}
                />
                <Button
                  onClick={handleFormSubmit}
                  isLoading={isSubmitting}
                  //   isDisabled={isButtonDisabled}
                  //   isHighContrast={isHighContrast}
                >
                  {t(
                    'features.publicForm.components.respondentCopyEmailBlock.sendButton',
                  )}
                </Button>
              </Stack>
              {get(errors, errors.emails?.message) ? (
                <FormErrorMessage>
                  {get(errors, errors.emails?.message)}
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
      </FormControl>
    </chakra.form>
  )
}
