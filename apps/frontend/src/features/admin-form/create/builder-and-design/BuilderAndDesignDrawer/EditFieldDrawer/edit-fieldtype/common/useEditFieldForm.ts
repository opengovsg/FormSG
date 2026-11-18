import { useCallback, useEffect, useMemo } from 'react'
import {
  DeepPartial,
  DefaultValues,
  FieldValues,
  Mode,
  UnpackNestedValue,
  useForm,
  UseFormReturn,
  useWatch,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useDebounce } from 'react-use'
import { cloneDeep } from 'lodash'

import {
  FieldBase,
  FieldCreateDto,
  FormField,
  FormFieldDto,
} from 'formsg-shared/types/field'

import { useCreateFormField } from '~features/admin-form/create/builder-and-design/mutations/useCreateFormField'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import { useCreateTabForm } from '~features/admin-form/create/builder-and-design/useCreateTabForm'
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
import { useEnv } from '~features/env/queries'
import { isMyInfo } from '~features/myinfo/utils'
import { useAdminFeedbackStore } from '~features/workspace/components/AdminFeedbackContainer/adminFeedbackStore'

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
  const { formId } = useParams()
  const { data: formData } = useCreateTabForm()
  const { data: { adminFeedbackFieldThreshold } = {} } = useEnv()

  const isPendingField = useMemo(
    () => stateData.state === FieldBuilderState.CreatingField,
    [stateData.state],
  )

  const defaultValues = useMemo(
    () => transform.input(field) as DefaultValues<FormShape>,
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
  }) as FormShape

  // Cloning is required so any nested references are not pointing to the same object,
  // which would prevent rerenders.
  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  const onSaveSuccess = useCallback(
    (newField: FormField) => {
      editForm.reset(
        transform.input(newField as FieldShape) as DefaultValues<FormShape>,
      )
      setToInactive()
    },
    [editForm, transform, setToInactive],
  )

  const handleUpdateField = editForm.handleSubmit(async (inputs) => {
    let updatedFormField = transform.output(
      inputs as UnpackNestedValue<FormShape>,
      field,
    )
    if (transform.preSubmit) {
      updatedFormField = await transform.preSubmit(
        inputs as UnpackNestedValue<FormShape>,
        updatedFormField,
      )
    }

    const isCreating = stateData.state === FieldBuilderState.CreatingField
    const isMyInfoField = isMyInfo(updatedFormField)
    // Count of fields already saved on the form. While creating, the pending
    // field isn't part of this count yet, so we offset the threshold by 1.
    const savedFieldCount = formData?.form_fields.length ?? 0
    const meetsFieldThreshold =
      !!adminFeedbackFieldThreshold &&
      savedFieldCount >= adminFeedbackFieldThreshold - (isCreating ? 1 : 0)

    // Enable the admin feedback prompt once the save succeeds (onSaveSuccess
    // closes the drawer), so the prompt appears after the drawer is gone, not
    // mid-edit. Triggers on crossing the field-count threshold or on a MyInfo
    // field save.
    const onMutateSuccess = (newField: FormField) => {
      onSaveSuccess(newField)
      if (isMyInfoField || meetsFieldThreshold)
        useAdminFeedbackStore.getState().setEligible('field-edit', formId)
    }

    if (isCreating) {
      return createFieldMutation.mutate(updatedFormField, {
        onSuccess: onMutateSuccess,
      })
    } else if (stateData.state === FieldBuilderState.EditingField) {
      return editFieldMutation.mutate(
        { ...updatedFormField, _id: stateData.field._id } as FormFieldDto,
        { onSuccess: onMutateSuccess },
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
    () =>
      handleChange(
        transform.output(
          clonedWatchedInputs as UnpackNestedValue<FormShape>,
          field,
        ),
      ),
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
