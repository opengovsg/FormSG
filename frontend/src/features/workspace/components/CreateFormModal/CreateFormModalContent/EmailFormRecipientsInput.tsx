import { Controller } from 'react-hook-form'
import { Skeleton } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { REQUIRED_ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'
import { TagInput } from '~components/TagInput'

import { useUser } from '~features/user/queries'

import { useCreateFormWizard } from '../CreateFormWizardContext'

export const EmailFormRecipientsInput = (): JSX.Element => {
  const { user, isLoading } = useUser()
  const { formMethods } = useCreateFormWizard()
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
      <Controller
        control={control}
        defaultValue={[user.email]}
        name="emails"
        rules={REQUIRED_ADMIN_EMAIL_VALIDATION_RULES}
        render={({ field }) => (
          <TagInput
            placeholder="Separate emails with a comma"
            {...field}
            tagValidation={isEmail}
          />
        )}
      />
      <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
    </>
  )
}
