import { useCallback, useMemo } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { isEmpty } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { FormPermission } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateCollaborators } from '~features/admin-form/common/mutations'

import { useAdminFormCollaborators } from '../../../queries'
import { useCollaboratorWizard } from '../CollaboratorWizardContext'
import { DropdownRole } from '../constants'
import { roleToPermission } from '../utils'

import { PermissionDropdown } from './PermissionDropdown'

export type AddCollaboratorInputs = {
  email: string
  role: DropdownRole
}

const useAddCollaboratorInput = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.collaborator.addInput',
  })
  const { handleForwardToTransferOwnership, formId } = useCollaboratorWizard()
  const { isLoading, collaborators, form, isFormAdmin } =
    useAdminFormCollaborators(formId)
  const { mutateAddCollaborator } = useMutateCollaborators()

  const formMethods = useForm<AddCollaboratorInputs>({
    defaultValues: {
      email: '',
      role: DropdownRole.Editor,
    },
  })

  const { watch, handleSubmit, reset } = formMethods

  const roleValue = watch('role')

  const handleAddCollaborator = useCallback(
    (inputs: AddCollaboratorInputs) => {
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
    },
    [form?.permissionList, mutateAddCollaborator, reset],
  )

  const handleInputSubmission = handleSubmit((inputs) => {
    // Handle transfer form ownership instead of granting admin rights.
    if (inputs.role === DropdownRole.Owner) {
      return handleForwardToTransferOwnership(inputs.email)
    }

    return handleAddCollaborator(inputs)
  })

  const validationRules: RegisterOptions<AddCollaboratorInputs, 'email'> =
    useMemo(() => {
      return {
        required: t('errors.required'),
        validate: {
          validEmail: (value: string) =>
            !value || isEmail(value) || t('errors.invalidEmail'),
          duplicateEmail: (value: string) =>
            !value ||
            !collaborators?.find(
              (c) => c.email.toLowerCase() === value.toLowerCase(),
            ) ||
            t('errors.duplicate'),
          ownerEmail: (value: string) =>
            !value ||
            form?.admin.email?.toLowerCase() !== value.toLowerCase() ||
            t('errors.ownerEmail'),
        },
      }
    }, [collaborators, form?.admin.email, t])

  const isMobile = useIsMobile()

  const isTransferOwnershipSelected = useMemo(
    () => roleValue === DropdownRole.Owner,
    [roleValue],
  )

  return {
    isQueryLoading: isLoading,
    isMutationLoading: mutateAddCollaborator.isLoading,
    isTransferOwnershipSelected,
    isFormAdmin,
    formMethods,
    isFullWidth: isMobile,
    validationRules,
    handleInputSubmission,
  }
}

export const AddCollaboratorInput = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.collaborator.addInput',
  })
  const {
    formMethods: {
      control,
      register,
      formState: { errors },
    },
    isFullWidth,
    isQueryLoading,
    isTransferOwnershipSelected,
    isFormAdmin,
    isMutationLoading,
    validationRules,
    handleInputSubmission,
  } = useAddCollaboratorInput()

  return (
    <form noValidate onSubmit={handleInputSubmission}>
      <FormControl isInvalid={!isEmpty(errors)} isReadOnly={isMutationLoading}>
        <FormLabel isRequired description={t('description')}>
          {t('label')}
        </FormLabel>
        <Skeleton isLoaded={!isQueryLoading}>
          <Stack direction={{ base: 'column', md: 'row' }}>
            <Input
              isDisabled={isQueryLoading}
              type="email"
              {...register('email', validationRules)}
              placeholder={t('email.placeholder')}
            />
            <Controller
              name="role"
              control={control}
              render={({ field: { value, onChange } }) => (
                <PermissionDropdown
                  allowTransferOwnership={isFormAdmin}
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
        {isTransferOwnershipSelected ? t('button.transfer') : t('button.add')}
      </Button>
    </form>
  )
}
