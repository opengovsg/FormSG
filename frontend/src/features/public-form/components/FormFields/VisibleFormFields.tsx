import { useEffect, useState } from 'react'
import { Control, useWatch } from 'react-hook-form'

import { FormColorTheme, LogicDto } from '~shared/types/form'

import { FormFieldValues } from '~templates/Field'

import { FormFieldWithQuestionNo } from '~features/form/types'
import { augmentWithQuestionNo } from '~features/form/utils'
import { getVisibleFieldIds } from '~features/logic/utils'

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
  }, [formFields, formLogics, setVisibleFieldIdsForScrollData, watchedValues])

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
