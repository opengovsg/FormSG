import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DecimalFieldBase, FormFieldWithId } from '~shared/types/field'

import { createDecimalValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput } from '../types'

export type DecimalFieldSchema = FormFieldWithId<DecimalFieldBase>
export interface DecimalFieldProps extends BaseFieldProps {
  schema: DecimalFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DecimalField = ({
  schema,
  questionNumber,
}: DecimalFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDecimalValidationRules(schema),
    [schema],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <NumberInput
            inputMode="decimal"
            aria-label={schema.title}
            allowMouseWheel
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
