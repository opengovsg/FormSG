import { Controller } from 'react-hook-form'
import { Skeleton } from '@chakra-ui/react'
import {
  FormErrorMessage,
  Input,
  TagInput,
} from '@opengovsg/design-system-react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'

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
        rules={ADMIN_EMAIL_VALIDATION_RULES}
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
