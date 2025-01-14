import { useCallback, useEffect, useMemo } from 'react'
import {
  DeepPartial,
  FieldValues,
  Mode,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
  useWatch,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'react-use'
import { cloneDeep } from 'lodash'

import {
  FieldBase,
  FieldCreateDto,
  FormField,
  FormFieldDto,
} from '~shared/types/field'

import { ADMIN_FEEDBACK_SESSION_KEY } from '~constants/sessionStorage'
import { useSessionStorage } from '~hooks/useSessionStorage'

import { useCreateFormField } from '~features/admin-form/create/builder-and-design/mutations/useCreateFormField'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '~features/admin-form/create/builder-and-design/useDirtyFieldStore'
import {
  FieldBuilderState,
  setToInactiveSelector,
  stateDataSelector,
  updateCreateStateSelector,
  updateEditStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import { isMyInfo } from '~features/myinfo/utils'

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
    preSubmit?: (
      input: UnpackNestedValue<FormShape>,
      output: FieldShape,
    ) => Promise<FieldShape> | FieldShape
  }
} & {
  mode?: Mode
}

export type UseEditFieldFormReturn<U extends FieldValues> = UseFormReturn<U> & {
  handleUpdateField: () => Promise<void>
  handleCancel: () => void
  buttonText: string
  isLoading: boolean
  formMethods: UseFormReturn<U>
}

export const useEditFieldForm = <
  FormShape extends FieldValues,
  FieldShape extends FormField,
>({
  field,
  transform,
  mode,
}: UseEditFieldFormProps<
  FormShape,
  FieldShape
>): UseEditFieldFormReturn<FormShape> => {
  const { t } = useTranslation()
  const { stateData, setToInactive, updateEditState, updateCreateState } =
    useFieldBuilderStore(
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

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const { editFieldMutation } = useEditFormField()
  const { createFieldMutation } = useCreateFormField()
  const [, setIsAdminFeedbackEligible] = useSessionStorage<boolean>(
    ADMIN_FEEDBACK_SESSION_KEY,
  )

  const isPendingField = useMemo(
    () => stateData.state === FieldBuilderState.CreatingField,
    [stateData.state],
  )

  const defaultValues = useMemo(
    () => transform.input(field),
    [field, transform],
  )
  const editForm = useForm<FormShape>({
    defaultValues,
    mode: mode,
  })

  const { isDirty } = editForm.formState
  // Update dirty state of builder so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(isDirty)

    return () => {
      setIsDirty(false)
    }
  }, [isDirty, setIsDirty])

  const watchedInputs = useWatch({
    control: editForm.control,
  }) as UnpackNestedValue<FormShape>

  // Cloning is required so any nested references are not pointing to the same object,
  // which would prevent rerenders.
  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  const onSaveSuccess = useCallback(
    (newField: FormField) => {
      editForm.reset(transform.input(newField as FieldShape))
      setToInactive()
    },
    [editForm, transform, setToInactive],
  )

  const handleUpdateField = editForm.handleSubmit(async (inputs) => {
    let updatedFormField = transform.output(inputs, field)
    if (transform.preSubmit) {
      updatedFormField = await transform.preSubmit(inputs, updatedFormField)
    }

    // if field to be updated is MyInfo, enable admin feedback
    if (isMyInfo(updatedFormField)) setIsAdminFeedbackEligible(true)

    if (stateData.state === FieldBuilderState.CreatingField) {
      return createFieldMutation.mutate(updatedFormField, {
        onSuccess: onSaveSuccess,
      })
    } else if (stateData.state === FieldBuilderState.EditingField) {
      return editFieldMutation.mutate(
        { ...updatedFormField, _id: stateData.field._id } as FormFieldDto,
        { onSuccess: onSaveSuccess },
      )
    }
  })

  const handleChange = useCallback(
    (field: FieldCreateDto | FormFieldDto) => {
      if (stateData.state === FieldBuilderState.CreatingField) {
        updateCreateState(field, stateData.insertionIndex)
      } else if (stateData.state === FieldBuilderState.EditingField) {
        updateEditState({
          ...(field as FormFieldDto),
          _id: stateData.field._id,
        })
      }
    },
    [stateData, updateCreateState, updateEditState],
  )

  const handleCancel = useCallback(() => {
    setToInactive()
  }, [setToInactive])

  useDebounce(
    () => handleChange(transform.output(clonedWatchedInputs, field)),
    300,
    Object.values(clonedWatchedInputs),
  )

  const buttonText = useMemo(
    () =>
      isPendingField
        ? t('features.adminForm.sidebar.fields.builder.createField')
        : t('features.common.saveField'),
    [isPendingField, t],
  )

  return {
    ...editForm,
    formMethods: editForm,
    buttonText,
    handleUpdateField,
    handleCancel,
    isLoading: createFieldMutation.isLoading || editFieldMutation.isLoading,
  }
}
