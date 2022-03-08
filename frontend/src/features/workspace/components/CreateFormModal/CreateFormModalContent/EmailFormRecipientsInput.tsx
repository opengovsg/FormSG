import { useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { Skeleton } from '@chakra-ui/react'
import { get } from 'lodash'

import { createAdminEmailValidationTransform } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { useUser } from '~features/user/queries'

import { useCreateFormWizard } from '../CreateFormWizardContext'

export const EmailFormRecipientsInput = (): JSX.Element => {
  const { user, isLoading } = useUser()
  const { formMethods } = useCreateFormWizard()
  const {
    control,
    formState: { errors },
  } = formMethods

  const emailTransformRules = useMemo(
    () => createAdminEmailValidationTransform(),
    [],
  )

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
        rules={emailTransformRules.rules}
        render={({ field: { value, onChange, ...rest } }) => (
          <Input
            value={emailTransformRules.transform.input(value)}
            onChange={(e) =>
              onChange(emailTransformRules.transform.output(e.target.value))
            }
            {...rest}
          />
        )}
      />
      <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
    </>
  )
}
