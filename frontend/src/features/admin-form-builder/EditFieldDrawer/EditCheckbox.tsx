import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Divider, FormControl, Stack } from '@chakra-ui/react'
import { merge } from 'lodash'
import { useDebouncedCallback } from 'use-debounce'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'
import { CheckboxFieldSchema } from '~templates/Field/Checkbox/CheckboxField'

import {
  clearActiveFieldSelector,
  updateFieldSelector,
  useEditFieldStore,
} from '../editFieldStore'
import { useMutateFormFields } from '../mutations'

import { FormFieldDrawerActions } from './FormFieldDrawerActions'

export interface EditCheckboxProps {
  field: CheckboxFieldSchema
}

interface EditCheckboxInputs {
  title: string
  description: string
  fieldOptions: string
  required: boolean
}

export const EditCheckbox = ({ field }: EditCheckboxProps): JSX.Element => {
  const updateActiveField = useEditFieldStore(updateFieldSelector)
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)
  const debouncedUpdateField = useDebouncedCallback(
    updateActiveField,
    // delay in ms
    300,
  )

  const transformCheckboxOpts = useMemo(
    () => ({
      toArray: (input?: string) =>
        input
          ?.split('\n')
          .map((opt) => opt.trim())
          .filter(Boolean),
      toString: (output?: string[]) => output?.filter(Boolean).join('\n'),
    }),
    [],
  )

  const {
    handleSubmit,
    reset,
    register,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditCheckboxInputs>({
    defaultValues: {
      title: field.title,
      description: field.description,
      fieldOptions: transformCheckboxOpts.toString(field.fieldOptions),
      required: field.required,
    },
  })

  const watchedInputs = watch()

  useEffect(() => {
    debouncedUpdateField({
      title: watchedInputs.title,
      description: watchedInputs.description,
      fieldOptions: transformCheckboxOpts.toArray(watchedInputs.fieldOptions),
      required: watchedInputs.required,
    })
  }, [
    debouncedUpdateField,
    transformCheckboxOpts,
    watchedInputs.description,
    watchedInputs.fieldOptions,
    watchedInputs.required,
    watchedInputs.title,
  ])

  const { mutateFormField } = useMutateFormFields()

  const handleUpdateField = handleSubmit(({ fieldOptions, ...inputs }) => {
    const updatedFormField: CheckboxFieldSchema = merge({}, field, {
      ...inputs,
      fieldOptions: transformCheckboxOpts.toArray(fieldOptions),
    })
    return mutateFormField.mutate(updatedFormField, {
      onSuccess: () => {
        reset(inputs)
      },
    })
  })

  return (
    <Stack spacing="2rem" divider={<Divider />}>
      <FormControl
        isRequired
        isReadOnly={mutateFormField.isLoading}
        isInvalid={!!errors.title}
      >
        <FormLabel>Question</FormLabel>
        <Input autoFocus {...register('title')} />
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
      <FormControl
        isRequired
        isReadOnly={mutateFormField.isLoading}
        isInvalid={!!errors.fieldOptions}
      >
        <FormLabel>Options</FormLabel>
        <Textarea {...register('fieldOptions')} />
        <FormErrorMessage>{errors?.fieldOptions?.message}</FormErrorMessage>
      </FormControl>
      <Toggle
        isLoading={mutateFormField.isLoading}
        label="Required"
        {...register('required')}
      />
      <FormFieldDrawerActions
        isLoading={mutateFormField.isLoading}
        isDirty={isDirty}
        handleClick={handleUpdateField}
        handleCancel={clearActiveField}
      />
    </Stack>
  )
}
