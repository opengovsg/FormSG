/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useFormContext } from 'react-hook-form'

import { useNricValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { NricFieldSchema, SingleAnswerFieldInput } from '../types'

export interface NricFieldProps extends BaseFieldProps {
  schema: NricFieldSchema
  disableRequiredValidation?: boolean
}

export const NricField = ({
  schema,
  disableRequiredValidation,
  isHighContrast,
}: NricFieldProps): JSX.Element => {
  const validationRules = useNricValidationRules(
    schema,
    disableRequiredValidation,
  )

  const { register, setValue } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} isHighContrast={isHighContrast}>
      <Input
        aria-label={`${schema.questionNumber}. ${schema.title}`}
        defaultValue=""
        preventDefaultOnEnter
        isHighContrast={isHighContrast}
        {...register(schema._id, {
          ...validationRules,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            setValue(schema._id, event.target.value.trim()),
        })}
      />
    </FieldContainer>
  )
}
