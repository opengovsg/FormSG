import { ChangeEventHandler, KeyboardEventHandler, useCallback } from 'react'
import { Button, forwardRef, HStack } from '@chakra-ui/react'

import {
  from24HourClock,
  isCanonicalTime,
  Meridiem,
  to24HourClock,
} from 'formsg-shared/utils/time-validation'

import Input, { InputProps } from '~components/Input'

/**
 * The respondent-facing input for a Time field.
 *
 * Its value is always the canonical persisted form — 24-hour `HH:MM:SS` — or
 * the empty string while the entry is incomplete. Everything the display
 * settings do happens inside here: the surrounding form only ever sees
 * canonical time, which is why neither setting reaches the backend.
 *
 * The meridiem is a button rather than a text input on purpose. Letting anyone
 * type it would mean parsing free text ("pm", "P.M.", "evening"), and that is
 * exactly the mess the field exists to remove — issue #7824 is an agency asking
 * for a field precisely because respondents type whatever they like.
 */

/** Digits the entry accepts, by whether seconds are collected. */
const digitsWanted = (includeSeconds: boolean) => (includeSeconds ? 6 : 4)

/** Inserts the separators positionally, so the respondent only types digits. */
const maskDigits = (digits: string): string => {
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)]
  return parts.filter((part) => part.length > 0).join(':')
}

/** Strips everything but digits, capped at what the field collects. */
const extractDigits = (raw: string, includeSeconds: boolean): string =>
  raw.replace(/\D/g, '').slice(0, digitsWanted(includeSeconds))

/**
 * Builds the canonical value from what has been typed, or `''` if the entry is
 * not yet a complete, in-range time. Returning empty rather than a partial
 * value keeps the form's notion of "answered" honest.
 */
export const toCanonical = ({
  digits,
  meridiem,
  includeSeconds,
  use24HourFormat,
}: {
  digits: string
  meridiem: Meridiem
  includeSeconds: boolean
  use24HourFormat: boolean
}): string => {
  if (digits.length < digitsWanted(includeSeconds)) return ''

  const hoursTyped = Number(digits.slice(0, 2))
  const minutes = Number(digits.slice(2, 4))
  const seconds = includeSeconds ? Number(digits.slice(4, 6)) : 0

  const hours = use24HourFormat
    ? hoursTyped
    : to24HourClock(hoursTyped, meridiem)

  if (hours === null || hours > 23 || minutes > 59 || seconds > 59) return ''

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/**
 * Recovers the typed digits and meridiem from a canonical value, so an answer
 * restored from a draft shows in the field's own format rather than the stored
 * one.
 */
export const fromCanonical = (
  value: string,
  { includeSeconds, use24HourFormat }: DisplayOptions,
): { digits: string; meridiem: Meridiem } => {
  if (!isCanonicalTime(value)) return { digits: '', meridiem: 'AM' }

  const [hours, minutes, seconds] = value.split(':')
  const split = from24HourClock(Number(hours))
  const displayHours = use24HourFormat
    ? hours
    : String(split?.hour12 ?? 12).padStart(2, '0')

  return {
    digits: `${displayHours}${minutes}${includeSeconds ? seconds : ''}`,
    meridiem: split?.meridiem ?? 'AM',
  }
}

export interface DisplayOptions {
  includeSeconds: boolean
  use24HourFormat: boolean
}

export interface TimeInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type'>, DisplayOptions {
  /** The digits typed so far, unseparated. */
  digits: string
  onDigitsChange: (digits: string) => void
  meridiem: Meridiem
  onMeridiemChange: (meridiem: Meridiem) => void
}

export const TimeInput = forwardRef<TimeInputProps, 'input'>(
  (
    {
      digits,
      onDigitsChange,
      meridiem,
      onMeridiemChange,
      includeSeconds,
      use24HourFormat,
      isDisabled,
      ...props
    },
    ref,
  ) => {
    const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (e) => onDigitsChange(extractDigits(e.target.value, includeSeconds)),
      [includeSeconds, onDigitsChange],
    )

    const toggleMeridiem = useCallback(
      () => onMeridiemChange(meridiem === 'AM' ? 'PM' : 'AM'),
      [meridiem, onMeridiemChange],
    )

    // Typing a or p while the toggle has focus is faster than hunting for it,
    // and costs nothing to support.
    const handleMeridiemKeyDown: KeyboardEventHandler<HTMLButtonElement> =
      useCallback(
        (e) => {
          const key = e.key.toLowerCase()
          if (key !== 'a' && key !== 'p') return
          e.preventDefault()
          onMeridiemChange(key === 'a' ? 'AM' : 'PM')
        },
        [onMeridiemChange],
      )

    return (
      <HStack spacing="0.5rem" align="stretch">
        <Input
          ref={ref}
          value={maskDigits(digits)}
          onChange={handleChange}
          placeholder={includeSeconds ? 'hh:mm:ss' : 'hh:mm'}
          inputMode="numeric"
          // The mask already caps this; maxLength is for paste.
          maxLength={includeSeconds ? 8 : 5}
          isDisabled={isDisabled}
          {...props}
        />
        {!use24HourFormat && (
          <Button
            variant="outline"
            onClick={toggleMeridiem}
            onKeyDown={handleMeridiemKeyDown}
            isDisabled={isDisabled}
            aria-label={`Change to ${meridiem === 'AM' ? 'PM' : 'AM'}`}
            // Announce the change to a screen reader without stealing focus.
            aria-live="polite"
            flexShrink={0}
          >
            {meridiem}
          </Button>
        )}
      </HStack>
    )
  },
)
