import { Controller, useFormContext } from 'react-hook-form'

import { useDecimalValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

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
  isHighContrast,
}: DecimalFieldProps): JSX.Element => {
  const validationRules = useDecimalValidationRules(
    schema,
    disableRequiredValidation,
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} isHighContrast={isHighContrast}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue=""
        render={({ field }) => (
          <NumberInput
            inputMode="decimal"
            aria-label={`${schema.questionNumber}. ${schema.title}`}
            preventDefaultOnEnter
            isHighContrast={isHighContrast}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
