import { useCallback, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'
import { DateSelectedValidation } from '~shared/types/field'

import {
  isDateAfterToday,
  isDateAnInvalidDay,
  isDateBeforeToday,
  isDateOutOfRange,
} from '~utils/date'
import { createDateValidationRules } from '~utils/fieldValidation'
import DateInput from '~components/DatePicker'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DateFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DateFieldProps extends BaseFieldProps {
  schema: DateFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DateField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
}: DateFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDateValidationRules(schema),
    [schema],
  )

  const isDateUnavailable = useCallback(
    (date: Date) => {
      const { selectedDateValidation } = schema.dateValidation
      const selectedInvalidDays = schema.invalidDays ?? []

      // All dates available.
      if (!selectedDateValidation && !!selectedInvalidDays.length) return false

      let isDateUnavailable = false
      let isDayUnavailable = false

      switch (selectedDateValidation) {
        case DateSelectedValidation.NoPast:
          isDateUnavailable = isDateBeforeToday(date)
          break
        case DateSelectedValidation.NoFuture:
          isDateUnavailable = isDateAfterToday(date)
          break
        case DateSelectedValidation.Custom: {
          const { customMinDate, customMaxDate } = schema.dateValidation
          isDateUnavailable = isDateOutOfRange(
            date,
            customMinDate,
            customMaxDate,
          )
          break
        }
        default:
          isDateUnavailable = false
      }

      isDayUnavailable = isDateAnInvalidDay(date, selectedInvalidDays)
      return isDateUnavailable || isDayUnavailable
    },
    [schema.dateValidation, schema.invalidDays],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Controller
        control={control}
        name={schema._id}
        rules={validationRules}
        render={({ field }) => (
          <DateInput
            colorScheme={`theme-${colorTheme}`}
            {...field}
            isDateUnavailable={isDateUnavailable}
          />
        )}
      />
    </FieldContainer>
  )
}
