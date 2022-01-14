import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDebounce } from 'react-use'
import { Divider, FormControl, Stack } from '@chakra-ui/react'
import { extend } from 'lodash'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import { SectionFieldSchema } from '~templates/Field/Section/SectionFieldContainer'

import { useEditFieldStore } from '../editFieldStore'
import { useMutateFormFields } from '../mutations'
import { isPendingFormField } from '../utils'

import { DrawerContentContainer } from './DrawerContentContainer'
import { FormFieldDrawerActions } from './FormFieldDrawerActions'

export interface EditHeaderProps {
  field: SectionFieldSchema
}

interface EditHeaderInputs {
  title: string
  description: string
}

export const EditHeader = ({ field }: EditHeaderProps): JSX.Element => {
  const { updateActiveField, clearActiveField } = useEditFieldStore()

  const {
    handleSubmit,
    reset,
    watch,
    register,
    formState: { errors, isDirty },
  } = useForm<EditHeaderInputs>({
    defaultValues: {
      title: field.title,
      description: field.description,
    },
  })

  const watchedInputs = watch()

  useDebounce(() => updateActiveField(watchedInputs), 300, [
    watchedInputs.description,
    watchedInputs.title,
  ])

  const { mutateFormField } = useMutateFormFields()

  const isSaveDisabled = useMemo(
    () => isDirty || isPendingFormField(field),
    [field, isDirty],
  )

  const saveButtonText = useMemo(
    () => (isPendingFormField(field) ? 'Create' : 'Save'),
    [field],
  )

  const handleUpdateField = handleSubmit((inputs) => {
    const updatedFormField: SectionFieldSchema = extend({}, field, inputs)
    return mutateFormField.mutate(updatedFormField, {
      onSuccess: () => reset(inputs),
    })
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  return (
    <DrawerContentContainer>
      <Stack spacing="2rem" divider={<Divider />}>
        <FormControl
          isRequired
          isReadOnly={mutateFormField.isLoading}
          isInvalid={!!errors.title}
        >
          <FormLabel>Section header title</FormLabel>
          <Input autoFocus {...register('title', requiredValidationRule)} />
          <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isRequired
          isReadOnly={mutateFormField.isLoading}
          isInvalid={!!errors.description}
        >
          <FormLabel>Description</FormLabel>
          <Textarea {...register('description')} />
          <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
        </FormControl>
        <FormFieldDrawerActions
          isLoading={mutateFormField.isLoading}
          isDirty={isSaveDisabled}
          buttonText={saveButtonText}
          handleClick={handleUpdateField}
          handleCancel={clearActiveField}
        />
      </Stack>
    </DrawerContentContainer>
  )
}
