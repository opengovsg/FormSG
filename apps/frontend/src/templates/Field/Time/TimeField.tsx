import { useCallback, useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from 'formsg-shared/types'
import { Meridiem } from 'formsg-shared/utils/time-validation'

import { useTimeValidationRules } from '~utils/fieldValidation'

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

  const validationRules = useTimeValidationRules(
    schema,
    disableRequiredValidation,
  )

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
        rules={validationRules}
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
 * Holds what the respondent has typed. Reports canonical `HH:MM:SS` once the
 * entry is complete and in range, empty while it is untouched, and the raw
 * masked entry in between — so validation can tell "nothing yet" apart from
 * "not a time", and neither can reach storage.
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
    (nextDigits: string, nextMeridiem: Meridiem) => {
      const canonical = toCanonical({
        digits: nextDigits,
        meridiem: nextMeridiem,
        includeSeconds,
        use24HourFormat,
      })
      // A half-entered or out-of-range time reports the bare digits rather
      // than collapsing to empty. Empty and invalid are different states: the
      // respondent deserves "please enter a time" for one and "that is not a
      // valid time" for the other, and reporting empty for both would let an
      // optional field silently discard a typo.
      //
      // The digits go up unseparated because a digits-only string can never be
      // mistaken for a canonical `HH:MM:SS`, which is the sole test validation
      // applies. The separated form is not safe here: in 12-hour mode `133045`
      // is rejected above — hour 13 has no meridiem reading — yet reads as a
      // valid 13:30:45 once the colons go in, and would submit.
      if (canonical || !nextDigits) return onChange(canonical)
      return onChange(nextDigits)
    },
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
