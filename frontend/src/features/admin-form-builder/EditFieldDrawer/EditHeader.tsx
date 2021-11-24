import { Controller, useForm } from 'react-hook-form'
import { Divider, FormControl, Stack } from '@chakra-ui/react'
import { merge } from 'lodash'
import { useDebouncedCallback } from 'use-debounce'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import { SectionFieldSchema } from '~templates/Field/Section/SectionFieldContainer'

import {
  clearActiveFieldSelector,
  updateFieldSelector,
  useEditFieldStore,
} from '../editFieldStore'
import { useMutateFormFields } from '../mutations'

import { FormFieldDrawerActions } from './FormFieldDrawerActions'

export interface EditHeaderProps {
  field: SectionFieldSchema
}

interface EditHeaderInputs {
  title: string
  description: string
}

export const EditHeader = ({ field }: EditHeaderProps): JSX.Element => {
  const updateActiveField = useEditFieldStore(updateFieldSelector)
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)
  const debouncedUpdateField = useDebouncedCallback(
    updateActiveField,
    // delay in ms
    300,
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditHeaderInputs>({
    defaultValues: {
      title: field.title,
      description: field.description,
    },
  })

  const { mutateFormField } = useMutateFormFields()

  const handleUpdateField = handleSubmit((inputs) => {
    const updatedFormField: SectionFieldSchema = merge({}, field, inputs)
    return mutateFormField.mutate(updatedFormField, {
      onSuccess: () =>
        reset({
          ...inputs,
        }),
    })
  })

  return (
    <Stack spacing="2rem" divider={<Divider />}>
      <FormControl
        isRequired
        isReadOnly={mutateFormField.isLoading}
        isInvalid={!!errors.title}
      >
        <FormLabel>Section header title</FormLabel>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, ...rest } }) => (
            <Input
              autoFocus
              onChange={(e) => {
                onChange(e)
                debouncedUpdateField({
                  title: e.target.value,
                })
              }}
              {...rest}
            />
          )}
        />
        <FormErrorMessage>
          {errors.title && errors.title.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={mutateFormField.isLoading}
        isInvalid={!!errors.title}
      >
        <FormLabel>Description</FormLabel>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, ...rest } }) => (
            <Textarea
              onChange={(e) => {
                onChange(e)
                debouncedUpdateField({
                  description: e.target.value,
                })
              }}
              {...rest}
            />
          )}
        />
        <FormErrorMessage>
          {errors.title && errors.title.message}
        </FormErrorMessage>
      </FormControl>
      <FormFieldDrawerActions
        isLoading={mutateFormField.isLoading}
        isDirty={isDirty}
        handleClick={handleUpdateField}
        handleCancel={clearActiveField}
      />
    </Stack>
  )
}
