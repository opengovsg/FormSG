import { FocusEventHandler, useCallback, useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from 'formsg-shared/types'
import { Meridiem } from 'formsg-shared/utils/time-validation'

import { useTimeValidationRules } from '~utils/fieldValidation'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput, TimeFieldSchema } from '../types'

import {
  formatTimeEntry,
  meridiemOf,
  parseTimeEntry,
  TimeInput,
} from './TimeInput'

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
 * entry resolves to a real time, empty while the box is untouched, and a
 * deliberately non-canonical rendering of the entry in between — so validation
 * can tell "nothing yet" apart from "not a time", and neither can reach
 * storage.
 */
const TimeEntry = ({
  value,
  onChange,
  includeSeconds,
  use24HourFormat,
  // Accepted so it can be spread from the field, but the input takes its
  // colour from the surrounding theme rather than a prop.
  colorTheme: _colorTheme,
  onBlur,
  ...rest
}: {
  value: string
  onChange: (next: string) => void
  includeSeconds: boolean
  use24HourFormat: boolean
  colorTheme?: FormColorTheme
  onBlur?: FocusEventHandler<HTMLInputElement>
} & Record<string, unknown>): JSX.Element => {
  const display = { includeSeconds, use24HourFormat }

  const [text, setText] = useState(() => formatTimeEntry(value, display))
  const [meridiem, setMeridiem] = useState<Meridiem>(() => meridiemOf(value))

  // An admin can flip either display setting while a draft is open. Re-derive
  // from the canonical value so a half-entered 12-hour time does not silently
  // become a different 24-hour one.
  useEffect(() => {
    const recovered = formatTimeEntry(value, {
      includeSeconds,
      use24HourFormat,
    })
    if (recovered) {
      setText(recovered)
      setMeridiem(meridiemOf(value))
    }
    // Only when the display settings change, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSeconds, use24HourFormat])

  const report = useCallback(
    (nextText: string, nextMeridiem: Meridiem) => {
      const canonical = parseTimeEntry(nextText, {
        meridiem: nextMeridiem,
        includeSeconds,
        use24HourFormat,
      })
      if (canonical) return onChange(canonical)
      if (!nextText.trim()) return onChange('')

      // An entry that is not yet a time still has to go up, or an optional
      // field would silently discard a typo and a required one would say
      // "please enter a time" when something is plainly there.
      //
      // What goes up must never be mistakable for a canonical `HH:MM:SS`,
      // since that is the sole test validation applies. Stripping the
      // separators guarantees it: no digits-only string can match. The bare
      // text is used only when there are no digits at all, which for the same
      // reason cannot match either.
      const digits = nextText.replace(/\D/g, '')
      return onChange(digits || nextText)
    },
    [includeSeconds, onChange, use24HourFormat],
  )

  const handleTextChange = useCallback(
    (nextText: string) => {
      setText(nextText)
      report(nextText, meridiem)
    },
    [meridiem, report],
  )

  const handleMeridiemChange = useCallback(
    (nextMeridiem: Meridiem) => {
      setMeridiem(nextMeridiem)
      report(text, nextMeridiem)
    },
    [text, report],
  )

  // Formatting happens here rather than on each keystroke: "930" settles to
  // 09:30 once the respondent is done, not while they are still mid-time.
  const handleBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const canonical = parseTimeEntry(text, {
        meridiem,
        includeSeconds,
        use24HourFormat,
      })
      if (canonical) {
        setText(formatTimeEntry(canonical, { includeSeconds, use24HourFormat }))
        setMeridiem(meridiemOf(canonical))
        onChange(canonical)
      }
      // An entry that is not a time is left exactly as typed, so the validation
      // message points at something the respondent can see and fix.
      onBlur?.(e)
    },
    [includeSeconds, meridiem, onBlur, onChange, text, use24HourFormat],
  )

  return (
    <TimeInput
      text={text}
      onTextChange={handleTextChange}
      meridiem={meridiem}
      onMeridiemChange={handleMeridiemChange}
      includeSeconds={includeSeconds}
      use24HourFormat={use24HourFormat}
      onBlur={handleBlur}
      {...rest}
    />
  )
}
