import { useEffect, useMemo } from 'react'
import {
  DeepPartial,
  Path,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
} from 'react-hook-form'
import { useDebounce } from 'react-use'
import { extend, get, isEqual, pick } from 'lodash'

import { FieldBase } from '~shared/types/field'

import { EditFieldProps } from './types'
import { getButtonText } from './utils'

type UseEditFieldFormProps<T extends FieldBase> = EditFieldProps<T> & {
  fieldKeys: readonly Path<T>[]
}

type UseEditFieldFormReturn<U> = UseFormReturn<U> & {
  handleUpdateField: () => Promise<void>
  buttonText: string
  isSaveEnabled: boolean
}

export const useEditFieldForm = <U, T extends FieldBase>({
  field,
  fieldKeys,
  isPendingField,
  handleChange,
  handleSave,
}: UseEditFieldFormProps<T>): UseEditFieldFormReturn<U> => {
  // Destructure getValues and setValue specifically so they can
  // be used as dependencies in the useEffect below
  const { getValues, setValue, ...editForm } = useForm<U>({
    defaultValues: pick(field, fieldKeys) as UnpackNestedValue<DeepPartial<U>>,
  })

  const watchedInputs = editForm.watch()

  // Update form when field loads or changes due to external action,
  // e.g. if user clicks on another field in the builder
  useEffect(() => {
    // perf: setValue causes an additional render, so call it only if
    // the values change
    const currentValues = getValues()
    fieldKeys.forEach((key) => {
      if (!isEqual(get(currentValues, key), get(field, key))) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        setValue(key, get(field, key), { shouldDirty: false })
      }
    })
    // Not ideal to disable exhaustive deps linting, but it is
    // necessary to ensure that this useEffect is only called
    // after the useDebounce below runs, i.e. after the field
    // is updated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...fieldKeys.map((key) => get(field, key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...fieldKeys,
    setValue,
    getValues,
  ])

  useDebounce(
    () => handleChange({ ...field, ...watchedInputs }),
    300,
    fieldKeys.map((key) => get(watchedInputs, key)),
  )

  const handleUpdateField = editForm.handleSubmit((inputs) => {
    const updatedFormField: T = extend({}, field, inputs)
    return handleSave(updatedFormField, {
      onSuccess: (newField) => {
        editForm.reset(
          pick(newField, fieldKeys) as UnpackNestedValue<DeepPartial<U>>,
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
    setValue,
    getValues,
    buttonText,
    isSaveEnabled,
    handleUpdateField,
  }
}
