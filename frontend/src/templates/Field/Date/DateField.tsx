import { useCallback, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'
import { DateSelectedValidation } from '~shared/types/field'
import { isDateAnInvalidDay } from '~shared/utils/date-validation'

import {
  isDateAfterToday,
  isDateBeforeToday,
  isDateOutOfRange,
  loadDateFromNormalizedDate,
} from '~utils/date'
import { createDateValidationRules } from '~utils/fieldValidation'
import { DatePicker } from '~components/DatePicker'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DateFieldSchema, SingleAnswerFieldInput } from '../types'

export const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy'
export const DATE_PARSE_FORMAT = 'dd/MM/yyyy'
export const MYINFO_DATE_FORMAT = 'yyyy-MM-dd'

export interface DateFieldProps extends BaseFieldProps {
  schema: DateFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DateField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
  ...fieldContainerProps
}: DateFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDateValidationRules(schema),
    [schema],
  )

  const isDateUnavailable = useCallback(
    (date: Date) => {
      const { selectedDateValidation } = schema.dateValidation
      const selectedInvalidDays = schema.invalidDays ?? []
      let isDateUnavailable = false

      switch (selectedDateValidation) {
        case DateSelectedValidation.NoPast:
          isDateUnavailable = isDateBeforeToday(date)
          break
        case DateSelectedValidation.NoFuture:
          isDateUnavailable = isDateAfterToday(date)
          break
        case DateSelectedValidation.Custom: {
          const { customMinDate, customMaxDate } = schema.dateValidation
          // customMinDate and customMaxDate are in UTC from the server,
          // need to convert to local time but with the same date as UTC.
          isDateUnavailable = isDateOutOfRange(
            date,
            loadDateFromNormalizedDate(customMinDate),
            loadDateFromNormalizedDate(customMaxDate),
          )
          break
        }
        default:
          break
      }

      return isDateUnavailable || isDateAnInvalidDay(date, selectedInvalidDays)
    },
    [schema.dateValidation, schema.invalidDays],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <Controller
        control={control}
        name={schema._id}
        rules={validationRules}
        defaultValue=""
        render={({ field: { value, onChange, ...field } }) => (
          <DatePicker
            displayFormat={DATE_DISPLAY_FORMAT}
            dateFormat={DATE_PARSE_FORMAT}
            onInputValueChange={onChange}
            inputValue={value}
            colorScheme={`theme-${colorTheme}`}
            {...field}
            isDateUnavailable={isDateUnavailable}
          />
        )}
      />
    </FieldContainer>
  )
}
