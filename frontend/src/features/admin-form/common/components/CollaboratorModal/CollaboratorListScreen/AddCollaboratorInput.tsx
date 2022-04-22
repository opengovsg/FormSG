import { useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { isEmpty } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useAdminFormCollaborators } from '../../../queries'
import { useCollaboratorWizard } from '../CollaboratorWizardContext'
import { DropdownRole } from '../constants'

import { PermissionDropdown } from './PermissionDropdown'

export type AddCollaboratorInputs = {
  email: string
  role: DropdownRole
}

const useAddCollaboratorInput = () => {
  const { formMethods, handleListSubmit, isMutationLoading, formAdminEmail } =
    useCollaboratorWizard()
  const { isLoading, data: collaborators } = useAdminFormCollaborators({
    enabled: !!formAdminEmail,
  })

  const { watch } = formMethods

  const roleValue = watch('role')

  const validationRules: RegisterOptions = useMemo(() => {
    return {
      required: 'Collaborator email is required',
      validate: {
        validEmail: (value: string) =>
          !value || isEmail(value) || 'Please enter a valid email',
        duplicateEmail: (value: string) =>
          !value ||
          !collaborators?.find(
            (c) => c.email.toLowerCase() === value.toLowerCase(),
          ) ||
          'This user is an existing collaborator. Edit role below.',
        ownerEmail: (value: string) =>
          !value ||
          formAdminEmail?.toLowerCase() !== value.toLowerCase() ||
          'You cannot add the form owner as a collaborator',
      },
    }
  }, [collaborators, formAdminEmail])

  const isMobile = useIsMobile()

  const isTransferOwnershipSelected = useMemo(
    () => roleValue === DropdownRole.Owner,
    [roleValue],
  )

  return {
    isQueryLoading: isLoading,
    isMutationLoading,
    isTransferOwnershipSelected,
    formMethods,
    isFullWidth: isMobile,
    validationRules,
    handleListSubmit,
  }
}

export const AddCollaboratorInput = (): JSX.Element => {
  const {
    formMethods: {
      control,
      register,
      formState: { errors },
    },
    isFullWidth,
    isQueryLoading,
    isTransferOwnershipSelected,
    isMutationLoading,
    validationRules,
    handleListSubmit,
  } = useAddCollaboratorInput()

  return (
    <form noValidate onSubmit={handleListSubmit}>
      <FormControl isInvalid={!isEmpty(errors)} isReadOnly={isMutationLoading}>
        <FormLabel
          isRequired
          description="Share your secret key with users who need to access response data"
        >
          Add collaborators or transfer form ownership
        </FormLabel>
        <Skeleton isLoaded={!isQueryLoading}>
          <Stack direction={{ base: 'column', md: 'row' }}>
            <Input
              isDisabled={isQueryLoading}
              type="email"
              {...register('email', validationRules)}
              placeholder="me@example.com"
            />
            <Controller
              name="role"
              control={control}
              render={({ field: { value, onChange } }) => (
                <PermissionDropdown
                  isLoading={isQueryLoading || isMutationLoading}
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </Stack>
        </Skeleton>
        <FormErrorMessage>
          {errors.email && errors.email.message}
        </FormErrorMessage>
      </FormControl>
      <Button
        colorScheme={isTransferOwnershipSelected ? 'danger' : 'primary'}
        isDisabled={isQueryLoading}
        isLoading={isMutationLoading}
        isFullWidth={isFullWidth}
        mt="1rem"
        type="submit"
      >
        {isTransferOwnershipSelected
          ? 'Transfer form ownership'
          : 'Add collaborator'}
      </Button>
    </form>
  )
}
