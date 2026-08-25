import { useCallback, useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from 'formsg-shared/types'
import { Meridiem } from 'formsg-shared/utils/time-validation'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput, TimeFieldSchema } from '../types'

import { fromCanonical, TimeInput, toCanonical } from './TimeInput'

export interface TimeFieldProps extends BaseFieldProps {
  schema: TimeFieldSchema
  disableRequiredValidation?: boolean
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const TimeField = ({
  schema,
  disableRequiredValidation,
  colorTheme = FormColorTheme.Blue,
  isHighContrast,
  ...fieldContainerProps
}: TimeFieldProps): JSX.Element => {
  const { control } = useFormContext<SingleAnswerFieldInput>()

  const { includeSeconds, use24HourFormat } = schema

  return (
    <FieldContainer
      schema={schema}
      isHighContrast={isHighContrast}
      {...fieldContainerProps}
    >
      <Controller
        control={control}
        name={schema._id}
        defaultValue=""
        rules={
          disableRequiredValidation || !schema.required
            ? undefined
            : {
                required: 'Please enter a time',
              }
        }
        render={({ field: { value, onChange, ...field } }) => (
          <TimeEntry
            value={value ?? ''}
            onChange={onChange}
            includeSeconds={includeSeconds}
            use24HourFormat={use24HourFormat}
            colorTheme={colorTheme}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}

/**
 * Holds what the respondent has typed, and reports only complete, in-range
 * times upward. The form's value is therefore always either canonical
 * `HH:MM:SS` or empty — never a half-entered string that would need
 * interpreting later.
 */
const TimeEntry = ({
  value,
  onChange,
  includeSeconds,
  use24HourFormat,
  // Accepted so it can be spread from the field, but the input takes its
  // colour from the surrounding theme rather than a prop.
  colorTheme: _colorTheme,
  ...rest
}: {
  value: string
  onChange: (next: string) => void
  includeSeconds: boolean
  use24HourFormat: boolean
  colorTheme?: FormColorTheme
} & Record<string, unknown>): JSX.Element => {
  const [digits, setDigits] = useState(
    () => fromCanonical(value, { includeSeconds, use24HourFormat }).digits,
  )
  const [meridiem, setMeridiem] = useState<Meridiem>(
    () => fromCanonical(value, { includeSeconds, use24HourFormat }).meridiem,
  )

  // An admin can flip either display setting while a draft is open. Re-derive
  // from the canonical value so a half-entered 12-hour time does not silently
  // become a different 24-hour one.
  useEffect(() => {
    const recovered = fromCanonical(value, { includeSeconds, use24HourFormat })
    if (recovered.digits) {
      setDigits(recovered.digits)
      setMeridiem(recovered.meridiem)
    }
    // Only when the display settings change, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSeconds, use24HourFormat])

  const report = useCallback(
    (nextDigits: string, nextMeridiem: Meridiem) =>
      onChange(
        toCanonical({
          digits: nextDigits,
          meridiem: nextMeridiem,
          includeSeconds,
          use24HourFormat,
        }),
      ),
    [includeSeconds, onChange, use24HourFormat],
  )

  const handleDigitsChange = useCallback(
    (nextDigits: string) => {
      setDigits(nextDigits)
      report(nextDigits, meridiem)
    },
    [meridiem, report],
  )

  const handleMeridiemChange = useCallback(
    (nextMeridiem: Meridiem) => {
      setMeridiem(nextMeridiem)
      report(digits, nextMeridiem)
    },
    [digits, report],
  )

  return (
    <TimeInput
      digits={digits}
      onDigitsChange={handleDigitsChange}
      meridiem={meridiem}
      onMeridiemChange={handleMeridiemChange}
      includeSeconds={includeSeconds}
      use24HourFormat={use24HourFormat}
      {...rest}
    />
  )
}
