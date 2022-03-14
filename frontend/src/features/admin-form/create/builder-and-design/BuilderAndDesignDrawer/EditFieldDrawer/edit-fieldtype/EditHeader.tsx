import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDebounce } from 'react-use'
import { Divider, FormControl, Stack } from '@chakra-ui/react'
import { extend } from 'lodash'

import { SectionFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { DrawerContentContainer } from './common/DrawerContentContainer'
import { FormFieldDrawerActions } from './common/FormFieldDrawerActions'
import { FieldMutateOptions } from './common/types'

export interface EditHeaderProps {
  field: SectionFieldBase
  isLoading: boolean
  isPendingField: boolean
  handleChange: (field: SectionFieldBase) => void
  handleSave: (field: SectionFieldBase, options?: FieldMutateOptions) => void
  handleCancel: () => void
}

interface EditHeaderInputs {
  title: string
  description: string
}

export const EditHeader = ({
  field,
  isLoading,
  isPendingField,
  handleChange,
  handleSave,
  handleCancel,
}: EditHeaderProps): JSX.Element => {
  const {
    handleSubmit,
    watch,
    register,
    formState: { errors, isDirty },
    reset,
    setValue,
    getValues,
  } = useForm<EditHeaderInputs>({
    defaultValues: {
      title: field.title,
      description: field.description,
    },
  })

  // Update form when field loads or changes due to external action,
  // e.g. if user clicks on another field in the builder
  useEffect(() => {
    // perf: setValue causes an additional render, so call it only if
    // the values change
    const currentValues = getValues()
    if (currentValues.title !== field.title) {
      setValue('title', field.title, { shouldDirty: false })
    }
    if (currentValues.description !== field.description) {
      setValue('description', field.description, { shouldDirty: false })
    }
  }, [field.title, field.description, setValue, getValues])

  const buttonText = useMemo(
    () => (isPendingField ? 'Create' : 'Save'),
    [isPendingField],
  )

  const isSaveEnabled = useMemo(
    () => isDirty || isPendingField,
    [isDirty, isPendingField],
  )

  const watchedInputs = watch()

  useDebounce(() => handleChange({ ...field, ...watchedInputs }), 300, [
    watchedInputs.description,
    watchedInputs.title,
  ])

  const handleUpdateField = handleSubmit((inputs) => {
    const updatedFormField: SectionFieldBase = extend({}, field, inputs)
    return handleSave(updatedFormField, {
      onSuccess: (newField) => {
        reset({
          title: newField.title,
          description: newField.description,
        })
      },
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
          isReadOnly={isLoading}
          isInvalid={!!errors.title}
        >
          <FormLabel>Section header title</FormLabel>
          <Input autoFocus {...register('title', requiredValidationRule)} />
          <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isRequired
          isReadOnly={isLoading}
          isInvalid={!!errors.description}
        >
          <FormLabel>Description</FormLabel>
          <Textarea {...register('description')} />
          <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
        </FormControl>
        <FormFieldDrawerActions
          isLoading={isLoading}
          isSaveEnabled={isSaveEnabled}
          buttonText={buttonText}
          handleClick={handleUpdateField}
          handleCancel={handleCancel}
        />
      </Stack>
    </DrawerContentContainer>
  )
}
