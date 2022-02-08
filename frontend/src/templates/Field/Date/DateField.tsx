import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import { DateFieldBase, FormFieldWithId } from '~shared/types/field'

import { createDateValidationRules } from '~utils/fieldValidation'
import DateInput from '~components/DatePicker'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type DateFieldSchema = FormFieldWithId<DateFieldBase>
export interface DateFieldProps extends BaseFieldProps {
  schema: DateFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DateField = ({
  schema,
  questionNumber,
}: DateFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDateValidationRules(schema),
    [schema],
  )

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        name={schema._id}
        rules={validationRules}
        render={({ field }) => <DateInput {...field} />}
      />
    </FieldContainer>
  )
}
