import { useMemo } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { isEmpty } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { FormPermission } from '~shared/types/form/form'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateCollaborators } from '../../mutations'
import { useAdminForm, useAdminFormCollaborators } from '../../queries'

import { PermissionDropdown } from './PermissionDropdown'
import { roleToPermission } from './utils'

export type AddCollaboratorInputs = {
  email: string
  role: DropdownRole
}

export enum DropdownRole {
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

const useAddCollaboratorInput = () => {
  // Admin form data required for checking for duplicate emails.
  const { data: form } = useAdminForm()
  const { isLoading, data: collaborators } = useAdminFormCollaborators({
    enabled: !!form,
  })

  const { mutateAddCollaborator } = useMutateCollaborators()

  const formMethods = useForm<AddCollaboratorInputs>({
    defaultValues: {
      email: '',
      role: DropdownRole.Editor,
    },
  })

  const { handleSubmit, reset } = formMethods

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
          form?.admin.email.toLowerCase() !== value.toLowerCase() ||
          'You cannot add the form owner as a collaborator',
      },
    }
  }, [collaborators, form?.admin.email])

  const isMobile = useIsMobile()

  const handleAddCollaborator = handleSubmit((inputs) => {
    if (!form?.permissionList) return
    const newPermission: FormPermission = {
      ...roleToPermission(inputs.role),
      email: inputs.email,
    }
    return mutateAddCollaborator.mutate(
      {
        newPermission,
        currentPermissions: form.permissionList,
      },
      {
        onSuccess: () => reset(),
      },
    )
  })

  return {
    isQueryLoading: isLoading,
    isMutationLoading: mutateAddCollaborator.isLoading,
    formMethods,
    isFullWidth: isMobile,
    validationRules,
    handleAddCollaborator,
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
    isMutationLoading,
    validationRules,
    handleAddCollaborator,
  } = useAddCollaboratorInput()

  return (
    <form noValidate onSubmit={handleAddCollaborator}>
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
        isDisabled={isQueryLoading}
        isLoading={isMutationLoading}
        isFullWidth={isFullWidth}
        mt="1rem"
        type="submit"
      >
        Add collaborator
      </Button>
    </form>
  )
}
