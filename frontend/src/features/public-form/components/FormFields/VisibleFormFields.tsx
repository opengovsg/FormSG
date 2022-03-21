import { useEffect, useState } from 'react'
import { Control, FieldValues, useWatch } from 'react-hook-form'

import { FormFieldDto } from '~shared/types/field'
import { FormColorTheme, LogicDto } from '~shared/types/form'

import { getVisibleFieldIds } from '~features/public-form/logic/utils'

import { FieldFactory } from './FieldFactory'

interface VisibleFormFieldsProps {
  control: Control<FieldValues>
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
  colorTheme: FormColorTheme
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
}: VisibleFormFieldsProps) => {
  const watchedValues = useWatch({ control })
  const [visibleFormFields, setVisibleFormFields] = useState(formFields)

  useEffect(() => {
    const visibleFieldIds = getVisibleFieldIds(watchedValues, {
      formFields,
      formLogics,
    })
    const visibleFields = formFields.filter((field) =>
      visibleFieldIds.has(field._id),
    )
    setVisibleFormFields(visibleFields)
  }, [formFields, formLogics, watchedValues])

  return (
    <>
      {visibleFormFields.map((field) => (
        <FieldFactory colorTheme={colorTheme} field={field} key={field._id} />
      ))}
    </>
  )
}
