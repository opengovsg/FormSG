import { useCallback, useMemo } from 'react'
import { Controller } from 'react-hook-form'

import {
  DateFieldBase,
  DateSelectedValidation,
  FormFieldWithId,
} from '~shared/types/field'

import {
  isDateAfterToday,
  isDateBeforeToday,
  isDateOutOfRange,
} from '~utils/date'
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

  const isDateUnavailable = useCallback(
    (date: Date) => {
      const { selectedDateValidation } = schema.dateValidation
      // All dates available.
      if (!selectedDateValidation) return false

      switch (selectedDateValidation) {
        case DateSelectedValidation.NoPast:
          return isDateBeforeToday(date)
        case DateSelectedValidation.NoFuture:
          return isDateAfterToday(date)
        case DateSelectedValidation.Custom: {
          const { customMinDate, customMaxDate } = schema.dateValidation
          return isDateOutOfRange(date, customMinDate, customMaxDate)
        }
        default:
          return false
      }
    },
    [schema.dateValidation],
  )

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        name={schema._id}
        rules={validationRules}
        render={({ field }) => (
          <DateInput {...field} isDateUnavailable={isDateUnavailable} />
        )}
      />
    </FieldContainer>
  )
}
