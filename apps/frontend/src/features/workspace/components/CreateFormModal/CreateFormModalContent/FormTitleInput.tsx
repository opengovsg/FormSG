import { RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, FormControlProps, Skeleton } from '@chakra-ui/react'

import { useFormTitleValidationRules } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import {
  CreateFormWizardInputProps,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

/** The length of form title to start showing warning text */
export const FORM_TITLE_LENGTH_WARNING = 65

interface FormTitleInputProps {
  mb?: FormControlProps['mb']
}

export const FormTitleInput = ({
  mb = '2.25rem',
}: FormTitleInputProps): JSX.Element => {
  const { t } = useTranslation()
  const { formMethods, isFetching } = useCreateFormWizard()
  const {
    register,
    formState: { errors },
    watch,
  } = formMethods

  const titleInputValue = watch('title')
  const formTitleValidationRules = useFormTitleValidationRules()

  return (
    <FormControl isRequired isInvalid={!!errors.title} mb={mb}>
      <FormLabel useMarkdownForDescription>
        {t('features.workspace.modals.forms.create.details.name.label')}
      </FormLabel>
      <Skeleton isLoaded={!isFetching}>
        <Input
          autoFocus
          {...register(
            'title',
            formTitleValidationRules as RegisterOptions<
              CreateFormWizardInputProps,
              'title'
            >,
          )}
        />
      </Skeleton>
      <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
      {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
        <FormFieldMessage>
          {t('features.workspace.modals.forms.create.details.name.message')}
        </FormFieldMessage>
      ) : null}
    </FormControl>
  )
}
