/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { createBaseValidationRules } from '~/utils/fieldValidation'

import YesNo from '~components/Field/YesNo'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { YesNoFieldInput, YesNoFieldSchema, YesNoFieldValue } from '../types'

export interface YesNoFieldProps extends BaseFieldProps {
  schema: YesNoFieldSchema
}

const transform = {
  fieldToInput: (value?: YesNoFieldValue) => {
    if (value === undefined) return
    return value === 'Yes' ? 'yes' : 'no'
  },
  inputToField: (value: 'yes' | 'no') => (value === 'yes' ? 'Yes' : 'No'),
}

export const YesNoField = ({ schema }: YesNoFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createBaseValidationRules(schema),
    [schema],
  )

  const { control } = useFormContext<YesNoFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field: { value, onChange, ...field } }) => (
          <YesNo
            value={transform.fieldToInput(value)}
            onChange={(input) => onChange(transform.inputToField(input))}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
