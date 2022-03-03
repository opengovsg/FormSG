/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { EmailFieldBase, FormFieldWithId } from '~shared/types/field'

import { createEmailValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type EmailFieldSchema = FormFieldWithId<EmailFieldBase>
export interface EmailFieldProps extends BaseFieldProps {
  schema: EmailFieldSchema
}

export const EmailField = ({
  schema,
  questionNumber,
}: EmailFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createEmailValidationRules(schema),
    [schema],
  )

  const { register } = useFormContext()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Input
        aria-label={schema.title}
        autoComplete="email"
        {...register(schema._id, validationRules)}
      />
    </FieldContainer>
  )
}
