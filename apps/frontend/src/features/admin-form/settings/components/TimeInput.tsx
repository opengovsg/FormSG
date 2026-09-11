import { ChangeEventHandler, useCallback } from 'react'
import { forwardRef } from '@chakra-ui/react'

import Input, { InputProps } from '~components/Input'

/**
 * TEMPORARY: a masked text input for a 24-hour time of day, to unblock
 * scheduled form closure until the real Time field lands. Delete it then.
 */

/**
 * Matches 00:00 through 23:59. The lowercase `hh:mm` shown to admins is a
 * placeholder, not a date-fns format string — date-fns `hh` is the 12-hour
 * clock, so format strings reading this value must stay `HH:mm`.
 */
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidTimeOfDay = (value: string): boolean =>
  TIME_OF_DAY_REGEX.test(value)

// Keeps only digits, so the colon is positional rather than typed.
const maskTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export interface TimeInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'type'
> {
  /** A partial or complete `hh:mm` string. */
  value: string
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
        placeholder="hh:mm"
        inputMode="numeric"
        maxLength={5}
        {...props}
      />
    )
  },
)
