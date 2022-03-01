import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import { DecimalFieldBase, FormFieldWithId } from '~shared/types/field'

import { createDecimalValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

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

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
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
