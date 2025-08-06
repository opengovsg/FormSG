/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useFormContext } from 'react-hook-form'

import { useUenValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput, UenFieldSchema } from '../types'

export interface UenFieldProps extends BaseFieldProps {
  schema: UenFieldSchema
  disableRequiredValidation?: boolean
}

export const UenField = ({
  schema,
  disableRequiredValidation,
  isHighContrast,
}: UenFieldProps): JSX.Element => {
  const validationRules = useUenValidationRules(
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
