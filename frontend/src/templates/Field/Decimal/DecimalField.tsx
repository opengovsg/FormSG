import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormResponseMode } from '~shared/types'

import { createDecimalValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DecimalFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DecimalFieldProps extends BaseFieldProps {
  schema: DecimalFieldSchema
  responseMode: FormResponseMode
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DecimalField = ({
  schema,
  responseMode,
}: DecimalFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDecimalValidationRules(schema, responseMode),
    [schema, responseMode],
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
            allowMouseWheel
            preventDefaultOnEnter
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
