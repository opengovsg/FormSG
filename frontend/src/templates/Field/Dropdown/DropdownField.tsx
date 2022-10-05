import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'

import { createDropdownValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown/SingleSelect'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DropdownFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DropdownFieldProps extends BaseFieldProps {
  schema: DropdownFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DropdownField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
  ...fieldContainerProps
}: DropdownFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDropdownValidationRules(schema),
    [schema],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue=""
        render={({ field }) => (
          <SingleSelect
            colorScheme={`theme-${colorTheme}`}
            items={schema.fieldOptions}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
