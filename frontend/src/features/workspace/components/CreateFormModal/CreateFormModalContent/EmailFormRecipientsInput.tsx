import { Control, Controller, RegisterOptions } from 'react-hook-form'
import { Skeleton } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { FormResponseMode } from '~shared/types/form/form'

import {
  useOptionalAdminEmailValidationRules,
  useRequiredAdminEmailValidationRules,
} from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'
import { TagInput } from '~components/TagInput'

import { useUser } from '~features/user/queries'

import {
  CreateFormWizardInputProps,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

export const EmailFormRecipientsInput = (): JSX.Element => {
  const { user, isLoading } = useUser()
  const { formMethods } = useCreateFormWizard()

  const { watch } = formMethods
  const responseModeValue = watch('responseMode')

  const requiredAdminEmailValidationRules =
    useRequiredAdminEmailValidationRules()
  const optionalAdminEmailValidationRules =
    useOptionalAdminEmailValidationRules()

  const {
    control,
    formState: { errors },
  } = formMethods

  // Add loading skeleton
  if (!user || isLoading) {
    return (
      <Skeleton>
        <Input isDisabled />
      </Skeleton>
    )
  }

  return (
    <>
      <Controller<CreateFormWizardInputProps>
        control={control}
        defaultValue={[user.email]}
        name="emails"
        rules={
          (responseModeValue === FormResponseMode.Email
            ? requiredAdminEmailValidationRules
            : optionalAdminEmailValidationRules) as RegisterOptions<CreateFormWizardInputProps>
        }
        render={({ field }) => (
          <TagInput
            placeholder="Separate emails with a comma"
            {...field}
            value={field.value as string[]}
            tagValidation={isEmail}
          />
        )}
      />
      <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
    </>
  )
}
