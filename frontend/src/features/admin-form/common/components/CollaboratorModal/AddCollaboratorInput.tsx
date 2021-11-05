import { useMemo } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import {
  FormControl,
  Skeleton,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react'
import { isEmpty } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { FormPermission } from '~shared/types/form/form'

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

  const formMethods = useForm<AddCollaboratorInputs>({
    defaultValues: {
      role: DropdownRole.Editor,
    },
  })

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

  const isFullWidth = useBreakpointValue({ base: true, xs: true, md: false })

  return {
    isLoading,
    formMethods,
    isFullWidth,
    validationRules,
    currentCollaborators: form?.permissionList,
  }
}

export const AddCollaboratorInput = (): JSX.Element => {
  const {
    formMethods: {
      control,
      register,
      formState: { errors },
      handleSubmit,
      reset,
    },
    isFullWidth,
    isLoading,
    validationRules,
    currentCollaborators,
  } = useAddCollaboratorInput()

  const { mutateAddCollaborator } = useMutateCollaborators()

  const handleAddCollaborator = handleSubmit((inputs) => {
    if (!currentCollaborators) return
    const newPermission: FormPermission = {
      ...roleToPermission(inputs.role),
      email: inputs.email,
    }
    return mutateAddCollaborator.mutate(
      {
        newPermission,
        currentPermissions: currentCollaborators,
      },
      {
        onSuccess: () => reset(),
      },
    )
  })

  return (
    <form noValidate onSubmit={handleAddCollaborator}>
      <FormControl
        isInvalid={!isEmpty(errors)}
        isReadOnly={mutateAddCollaborator.isLoading}
      >
        <FormLabel
          isRequired
          description="Share your secret key with users who need to access response data"
        >
          Add collaborators or transfer form ownership
        </FormLabel>
        <Skeleton isLoaded={!isLoading}>
          <Stack direction={{ base: 'column', md: 'row' }}>
            <Input
              isDisabled={isLoading}
              type="email"
              {...register('email', validationRules)}
              placeholder="me@example.com"
            />
            <Controller
              name="role"
              control={control}
              render={({ field: { value, onChange } }) => (
                <PermissionDropdown
                  isLoading={isLoading || mutateAddCollaborator.isLoading}
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
        isLoading={mutateAddCollaborator.isLoading}
        isFullWidth={isFullWidth}
        mt="1rem"
        type="submit"
      >
        Add collaborator
      </Button>
    </form>
  )
}
