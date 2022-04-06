import { useEffect, useState } from 'react'
import { Control, useWatch } from 'react-hook-form'

import { FormFieldDto } from '~shared/types/field'
import { FormColorTheme, LogicDto } from '~shared/types/form'

import { FormFieldValues } from '~templates/Field'

import { getVisibleFieldIds } from '~features/logic/utils'

import { FieldFactory } from './FieldFactory'

interface VisibleFormFieldsProps {
  control: Control<FormFieldValues>
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
