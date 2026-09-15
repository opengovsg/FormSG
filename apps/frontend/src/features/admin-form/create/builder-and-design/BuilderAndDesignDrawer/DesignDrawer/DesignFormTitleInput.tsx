import { Control, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'

import { useFormTitleValidationRules } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { FormStartPageInput } from '../../../builder-and-design/useDesignStore'

export const DesignFormTitleInput = ({
  control,
}: {
  control: Control<FormStartPageInput>
}): JSX.Element => {
  const { t } = useTranslation()
  const formTitleValidationRules = useFormTitleValidationRules()

  return (
    <Controller
      name="title"
      control={control}
      rules={formTitleValidationRules}
      render={({ field, fieldState }) => (
        <FormControl isInvalid={!!fieldState.error}>
          <FormLabel isRequired>{t('features.common.formName')}</FormLabel>
          <Input {...field} />
          <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
        </FormControl>
      )}
    />
  )
}
