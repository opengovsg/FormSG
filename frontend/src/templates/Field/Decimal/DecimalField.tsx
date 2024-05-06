import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { NumberInput } from '@opengovsg/design-system-react'

import { createDecimalValidationRules } from '~utils/fieldValidation'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DecimalFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DecimalFieldProps extends BaseFieldProps {
  schema: DecimalFieldSchema
  disableRequiredValidation?: boolean
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DecimalField = ({
  schema,
  disableRequiredValidation,
}: DecimalFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDecimalValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue=""
        render={({ field }) => (
          <NumberInput
            inputMode="decimal"
            aria-label={`${schema.questionNumber}. ${schema.title}`}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
