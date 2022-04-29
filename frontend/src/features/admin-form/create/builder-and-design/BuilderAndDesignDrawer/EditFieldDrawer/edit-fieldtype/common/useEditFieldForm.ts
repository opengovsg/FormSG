import { useCallback, useMemo } from 'react'
import {
  DeepPartial,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
} from 'react-hook-form'
import { useDebounce } from 'react-use'

import {
  FieldBase,
  FieldCreateDto,
  FormField,
  FormFieldDto,
} from '~shared/types/field'

import { useCreateFormField } from '~features/admin-form/create/builder-and-design/mutations/useCreateFormField'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  updateCreateStateSelector,
  updateEditStateSelector,
  useBuilderAndDesignStore,
} from '~features/admin-form/create/builder-and-design/useBuilderAndDesignStore'

import { EditFieldProps } from './types'

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
    /**
     * Final transformation before submitting, if any.
     * This transformation will be ran with the output of transform.output.
     */
    preSubmit?: (field: FieldShape) => Promise<FieldShape> | FieldShape
  }
}

type UseEditFieldFormReturn<U> = UseFormReturn<U> & {
  handleUpdateField: () => Promise<void>
  handleCancel: () => void
  buttonText: string
  isSaveEnabled: boolean
  isLoading: boolean
}

export const useEditFieldForm = <FormShape, FieldShape extends FormField>({
  field,
  transform,
}: UseEditFieldFormProps<
  FormShape,
  FieldShape
>): UseEditFieldFormReturn<FormShape> => {
  const { stateData, setToInactive, updateEditState, updateCreateState } =
    useBuilderAndDesignStore(
      useCallback(
        (state) => ({
          stateData: stateDataSelector(state),
          setToInactive: setToInactiveSelector(state),
          updateEditState: updateEditStateSelector(state),
          updateCreateState: updateCreateStateSelector(state),
        }),
        [],
      ),
    )

  const { editFieldMutation } = useEditFormField()
  const { createFieldMutation } = useCreateFormField()

  const isPendingField = useMemo(
    () => stateData.state === BuildFieldState.CreatingField,
    [stateData.state],
  )

  const defaultValues = useMemo(
    () => transform.input(field),
    [field, transform],
  )
  const editForm = useForm<FormShape>({
    defaultValues,
  })

  const watchedInputs = editForm.watch()

  const onSaveSuccess = useCallback(
    (newField) => {
      editForm.reset(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        transform.input(newField),
      )
    },
    [editForm, transform],
  )

  const handleUpdateField = editForm.handleSubmit(async (inputs) => {
    let updatedFormField = transform.output(inputs, field)
    if (transform.preSubmit) {
      updatedFormField = await transform.preSubmit(updatedFormField)
    }
    if (stateData.state === BuildFieldState.CreatingField) {
      return createFieldMutation.mutate(updatedFormField, {
        onSuccess: onSaveSuccess,
      })
    } else if (stateData.state === BuildFieldState.EditingField) {
      return editFieldMutation.mutate(
        { ...updatedFormField, _id: stateData.field._id } as FormFieldDto,
        { onSuccess: onSaveSuccess },
      )
    }
  })

  const handleChange = useCallback(
    (field: FieldCreateDto | FormFieldDto) => {
      if (stateData.state === BuildFieldState.CreatingField) {
        updateCreateState(field, stateData.insertionIndex)
      } else if (stateData.state === BuildFieldState.EditingField) {
        updateEditState({
          ...(field as FormFieldDto),
          _id: stateData.field._id,
        })
      }
    },
    [stateData, updateCreateState, updateEditState],
  )

  useDebounce(
    () => handleChange(transform.output(watchedInputs, field)),
    300,
    Object.values(watchedInputs),
  )

  const buttonText = useMemo(
    () => (isPendingField ? 'Create field' : 'Save field'),
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
    handleCancel: setToInactive,
    isLoading: createFieldMutation.isLoading || editFieldMutation.isLoading,
  }
}
