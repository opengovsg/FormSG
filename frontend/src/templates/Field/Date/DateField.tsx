import { useCallback, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'
import { DateSelectedValidation } from '~shared/types/field'

import {
  isDateAfterToday,
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
  ...fieldContainerProps
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

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <Controller
        control={control}
        name={schema._id}
        rules={validationRules}
        defaultValue=""
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
