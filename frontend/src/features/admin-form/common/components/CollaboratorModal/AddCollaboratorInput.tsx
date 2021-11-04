import { Controller, useForm } from 'react-hook-form'
import { FormControl, Stack, useBreakpointValue } from '@chakra-ui/react'
import { isEmpty } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { PermissionDropdown } from './PermissionDropdown'

export type AddCollaboratorInputs = {
  email: string
  role: DropdownRole
}

export enum DropdownRole {
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

interface AddCollaboratorInputProps {
  onSubmit: (inputs: AddCollaboratorInputs) => void
}

export const AddCollaboratorInput = ({
  onSubmit,
}: AddCollaboratorInputProps): JSX.Element => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AddCollaboratorInputs>({
    defaultValues: {
      role: DropdownRole.Editor,
    },
  })

  const isFullWidth = useBreakpointValue({ base: true, xs: true, md: false })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!isEmpty(errors)}>
        <FormLabel
          isRequired
          description="Share your secret key with users who need to access response data"
        >
          Add collaborators or transfer form ownership
        </FormLabel>
        <Stack direction={{ base: 'column', md: 'row' }}>
          <Input
            type="email"
            {...register('email', {
              required: 'Collaborator email is required',
              validate: (value) => {
                return !value || isEmail(value) || 'Please enter a valid email'
              },
            })}
            placeholder="me@example.com"
          />
          <Controller
            name="role"
            control={control}
            render={({ field: { value, onChange } }) => (
              <PermissionDropdown value={value} onChange={onChange} />
            )}
          />
        </Stack>
        <FormErrorMessage>
          {errors.email && errors.email.message}
        </FormErrorMessage>
      </FormControl>
      <Button isFullWidth={isFullWidth} mt="1rem" type="submit">
        Add collaborator
      </Button>
    </form>
  )
}
