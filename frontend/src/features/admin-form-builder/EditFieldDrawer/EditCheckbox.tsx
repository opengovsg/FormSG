import { useForm } from 'react-hook-form'
import { useDebounce } from 'react-use'
import { Divider, FormControl, Stack } from '@chakra-ui/react'
import { extend } from 'lodash'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'
import { CheckboxFieldSchema } from '~templates/Field/Checkbox/CheckboxField'

import { useEditFieldStore } from '../editFieldStore'
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

const transformCheckboxOpts = {
  toArray: (input?: string) =>
    input
      ?.split('\n')
      .map((opt) => opt.trim())
      .filter(Boolean) ?? [],
  toString: (output?: string[]) => output?.filter(Boolean).join('\n'),
}

const transformToFormField = ({
  fieldOptions,
  ...rest
}: EditCheckboxInputs): Partial<CheckboxFieldSchema> => {
  return {
    ...rest,
    fieldOptions: transformCheckboxOpts.toArray(fieldOptions),
  }
}

const requiredValidationRule = createBaseValidationRules({ required: true })

const fieldOptionsValidationRule = {
  ...requiredValidationRule,
  validate: {
    duplicate: (opts: string) => {
      const optsArray = transformCheckboxOpts.toArray(opts)
      return (
        new Set(optsArray).size === optsArray.length ||
        'Please remove duplicate options.'
      )
    },
  },
}

export const EditCheckbox = ({ field }: EditCheckboxProps): JSX.Element => {
  const { updateActiveField, clearActiveField } = useEditFieldStore()

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

  useDebounce(
    () => {
      if (!watchedInputs) return
      return updateActiveField(transformToFormField(watchedInputs))
    },
    300,
    [
      transformCheckboxOpts,
      // Required destructure to prevent debounce firing infinitely.
      watchedInputs.description,
      watchedInputs.fieldOptions,
      watchedInputs.required,
      watchedInputs.title,
    ],
  )

  const { mutateFormField } = useMutateFormFields()

  const handleUpdateField = handleSubmit((inputs) => {
    const updatedField = extend({}, field, transformToFormField(inputs))
    return mutateFormField.mutate(updatedField, {
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
      <FormControl
        isRequired
        isReadOnly={mutateFormField.isLoading}
        isInvalid={!!errors.fieldOptions}
      >
        <FormLabel>Options</FormLabel>
        <Textarea {...register('fieldOptions', fieldOptionsValidationRule)} />
        <FormErrorMessage>{errors?.fieldOptions?.message}</FormErrorMessage>
      </FormControl>
      <Toggle
        isLoading={mutateFormField.isLoading}
        label="Required"
        {...register('required', requiredValidationRule)}
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
