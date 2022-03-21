import { useMemo } from 'react'
import {
  DeepPartial,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
} from 'react-hook-form'
import { useDebounce } from 'react-use'

import { FieldBase } from '~shared/types/field'

import { EditFieldProps } from './types'
import { getButtonText } from './utils'

type UseEditFieldFormProps<
  FormShape,
  FieldShape extends FieldBase,
> = EditFieldProps<FieldShape> & {
  transform: {
    input: (field: FieldShape) => UnpackNestedValue<DeepPartial<FormShape>>
    output: (
      form: UnpackNestedValue<FormShape>,
      originalField: FieldShape,
    ) => FieldShape
  }
}

type UseEditFieldFormReturn<U> = UseFormReturn<U> & {
  handleUpdateField: () => Promise<void>
  buttonText: string
  isSaveEnabled: boolean
}

export const useEditFieldForm = <FormShape, FieldShape extends FieldBase>({
  field,
  isPendingField,
  handleChange,
  handleSave,
  transform,
}: UseEditFieldFormProps<
  FormShape,
  FieldShape
>): UseEditFieldFormReturn<FormShape> => {
  const defaultValues = useMemo(
    () => transform.input(field),
    [field, transform],
  )
  const editForm = useForm<FormShape>({
    defaultValues,
  })

  const watchedInputs = editForm.watch()

  useDebounce(
    () => handleChange(transform.output(watchedInputs, field)),
    300,
    Object.values(watchedInputs),
  )

  const handleUpdateField = editForm.handleSubmit((inputs) => {
    const updatedFormField: FieldShape = transform.output(inputs, field)
    return handleSave(updatedFormField, {
      onSuccess: (newField) => {
        editForm.reset(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          transform.input(newField),
        )
      },
    })
  })

  const buttonText = useMemo(
    () => getButtonText(isPendingField),
    [isPendingField],
  )

  const isSaveEnabled = useMemo(
    () => editForm.formState.isDirty || isPendingField,
    [editForm.formState.isDirty, isPendingField],
  )

  return {
    ...editForm,
    buttonText,
    isSaveEnabled,
    handleUpdateField,
  }
}
