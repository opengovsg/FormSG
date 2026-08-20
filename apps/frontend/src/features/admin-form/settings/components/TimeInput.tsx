import { ChangeEventHandler, useCallback } from 'react'
import { forwardRef } from '@chakra-ui/react'

import Input, { InputProps } from '~components/Input'

/**
 * TEMPORARY — NOT THE FINAL TIME FIELD.
 *
 * A plain masked text input for a 24-hour time of day, built only to unblock the
 * scheduled form closure prototype while the real Time field is still being
 * designed. When that lands (as a `BasicField.Time` with a proper picker and its
 * own shared component), this file should be deleted outright rather than grown
 * into the real thing — it deliberately has no dropdown, no locale handling, no
 * seconds, and no AM/PM.
 *
 * Scope of what it does do: accepts `HH:MM` in 24-hour time, masks input to
 * digits, and reports validity to its parent. Validation of *when* the time is
 * (in the past, etc.) is the caller's job.
 */

/** Matches a 24-hour time of day: 00:00 through 23:59. */
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidTimeOfDay = (value: string): boolean =>
  TIME_OF_DAY_REGEX.test(value)

/**
 * Masks raw keystrokes into a partial `HH:MM` string. Keeps only digits so the
 * colon is positional rather than something the admin has to type, and caps at
 * four digits so overtyping a complete time is a no-op instead of silently
 * shifting the value.
 */
const maskTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export interface TimeInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'type'
> {
  /** Current value, as a partial or complete `HH:MM` string. */
  value: string
  /** Fired with the masked value on every keystroke. */
  onChange: (value: string) => void
}

export const TimeInput = forwardRef<TimeInputProps, 'input'>(
  ({ value, onChange, ...props }, ref) => {
    const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (e) => onChange(maskTimeInput(e.target.value)),
      [onChange],
    )

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder="HH:MM"
        inputMode="numeric"
        // 5 for HH:MM. The mask already enforces this; maxLength is belt and
        // braces for paste.
        maxLength={5}
        {...props}
      />
    )
  },
)
