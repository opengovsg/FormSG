import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DropdownFieldBase, FormColorTheme } from '~shared/types'

import {
  createDropdownValidationRules,
  ValidationRuleFn,
} from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown/SingleSelect'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DropdownFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DropdownFieldProps extends BaseFieldProps {
  schema: DropdownFieldSchema
  validationRules?: ValidationRuleFn<DropdownFieldBase>
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DropdownField = ({
  schema,
  validationRules,
  colorTheme = FormColorTheme.Blue,
  ...fieldContainerProps
}: DropdownFieldProps): JSX.Element => {
  const rules = useMemo(() => {
    if (validationRules) {
      return validationRules(schema)
    }
    return createDropdownValidationRules(schema)
  }, [schema, validationRules])

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <Controller
        control={control}
        rules={rules}
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
