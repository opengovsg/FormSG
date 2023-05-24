import { useEffect, useState } from 'react'
import { Control, useWatch } from 'react-hook-form'

import { FormColorTheme, LogicDto } from '~shared/types/form'

import { FormFieldValues } from '~templates/Field'

import { FormFieldWithQuestionNo } from '~features/form/types'
import { augmentWithQuestionNo } from '~features/form/utils'
import { getVisibleFieldIds } from '~features/logic/utils'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FieldFactory } from './FieldFactory'
import { PrefillMap } from './FormFields'
import { useFormSections } from './FormSectionsContext'

interface VisibleFormFieldsProps {
  control: Control<FormFieldValues>
  formFields: FormFieldWithQuestionNo[]
  formLogics: LogicDto[]
  colorTheme: FormColorTheme
  fieldPrefillMap: PrefillMap
}

/**
 * This is its own component instead of being rendered in `FormFields` component
 * so expensive rerenders to form fields are isolated to this component.
 */
export const VisibleFormFields = ({
  control,
  formFields,
  formLogics,
  colorTheme,
  fieldPrefillMap,
}: VisibleFormFieldsProps) => {
  const watchedValues = useWatch({ control })
  const { setVisibleFieldIdsForScrollData } = useFormSections()
  const [visibleFormFields, setVisibleFormFields] = useState(formFields)
  const { setNumVisibleFields } = usePublicFormContext()

  useEffect(() => {
    const visibleFieldIds = getVisibleFieldIds(watchedValues, {
      formFields,
      formLogics,
    })
    setVisibleFieldIdsForScrollData(visibleFieldIds)
    const visibleFields = formFields.filter((field) =>
      visibleFieldIds.has(field._id),
    )
    const visibleFieldsWithQuestionNo = augmentWithQuestionNo(visibleFields)
    setVisibleFormFields(visibleFieldsWithQuestionNo)

    // set the number of visible fields in the context for public forms
    if (setNumVisibleFields)
      setNumVisibleFields(visibleFieldsWithQuestionNo.length)
  }, [
    formFields,
    formLogics,
    setVisibleFieldIdsForScrollData,
    watchedValues,
    setNumVisibleFields,
  ])

  return (
    <>
      {visibleFormFields.map((field) => (
        <FieldFactory
          colorTheme={colorTheme}
          field={field}
          key={field._id}
          prefill={fieldPrefillMap[field._id]}
        />
      ))}
    </>
  )
}
