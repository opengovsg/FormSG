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
 * Everything the display settings do happens inside here: a submitted answer
 * is always the canonical persisted form — 24-hour `HH:MM:SS` — which is why
 * neither setting reaches the backend.
 *
 * The meridiem is a button rather than a text input on purpose. Letting anyone
 * type it as free text would mean interpreting "P.M.", "evening" and the rest,
 * and that is exactly the mess the field exists to remove — issue #7824 is an
 * agency asking for a field precisely because respondents type whatever they
 * like. A trailing "am"/"pm" is understood, because it is unambiguous and
 * people type it out of habit; anything looser is not.
 *
 * Nothing is reformatted while the respondent types. The box holds what they
 * typed and `parseTimeEntry` runs on blur, so entering "930" is not rewritten
 * mid-keystroke into something they then have to correct.
 */

export interface DisplayOptions {
  includeSeconds: boolean
  use24HourFormat: boolean
}

const pad2 = (n: number | string) => String(n).padStart(2, '0')

/**
 * Splits an unpunctuated run of digits into hour, minute and second parts.
 *
 * The groupings are the conventional readings: three digits are h:mm rather
 * than hh:m, four are hh:mm, and a bare hour means the top of that hour.
 * Returns `null` for a length that has no sensible reading.
 */
const groupDigits = (
  digits: string,
  includeSeconds: boolean,
): [string, string, string] | null => {
  const { length } = digits
  if (length < 1) return null

  if (length <= 2) return [digits, '0', '0']
  if (length === 3) return [digits.slice(0, 1), digits.slice(1), '0']
  if (length === 4) return [digits.slice(0, 2), digits.slice(2), '0']

  if (!includeSeconds) return null
  if (length === 5)
    return [digits.slice(0, 1), digits.slice(1, 3), digits.slice(3)]
  if (length === 6)
    return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
  return null
}

/**
 * Resolves the typed hour onto the 24-hour clock, or `null` if it has no
 * reading in the current mode.
 */
const resolveHours = (
  hoursTyped: number,
  typedMeridiem: Meridiem | null,
  toggleMeridiem: Meridiem,
  use24HourFormat: boolean,
): number | null => {
  // A typed "am"/"pm" is a 12-hour reading in either mode, and outranks the
  // toggle — the respondent said which half of the day they meant.
  if (typedMeridiem) return to24HourClock(hoursTyped, typedMeridiem)

  if (hoursTyped > 23) return null
  if (use24HourFormat) return hoursTyped

  // 12-hour mode. 0 and 13-23 have only one possible reading, so they are
  // taken at face value rather than refused: someone typing 1400 out of habit
  // means two in the afternoon, and the field shows it back as 02:00 PM.
  if (hoursTyped === 0 || hoursTyped > 12) return hoursTyped
  return to24HourClock(hoursTyped, toggleMeridiem)
}

/**
 * Turns what the respondent typed into the canonical persisted form, or `null`
 * if it is not a complete, in-range time.
 *
 * Deliberately permissive about shape, because the respondent is not the one
 * who should be learning the format:
 *   "930"     -> 09:30:00
 *   "9:30"    -> 09:30:00
 *   "9"       -> 09:00:00
 *   "0930"    -> 09:30:00
 *   "9:30pm"  -> 21:30:00
 *   "93015"   -> 09:30:15   (only when the field collects seconds)
 *
 * A seconds component is refused outright when the field does not collect one,
 * matching `normalizeTime` on the shared contract.
 */
export const parseTimeEntry = (
  raw: string,
  {
    meridiem,
    includeSeconds,
    use24HourFormat,
  }: DisplayOptions & { meridiem: Meridiem },
): string | null => {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!cleaned) return null

  const typedMeridiem: Meridiem | null = cleaned.endsWith('pm')
    ? 'PM'
    : cleaned.endsWith('am')
      ? 'AM'
      : null
  const body = typedMeridiem ? cleaned.slice(0, -2) : cleaned

  let parts: [string, string, string] | null
  if (body.includes(':')) {
    const split = body.split(':')
    if (split.length < 2 || split.length > 3) return null
    if (split.some((part) => !/^\d{1,2}$/.test(part))) return null
    parts = [split[0], split[1], split[2] ?? '0']
    if (split.length === 3 && !includeSeconds) return null
  } else {
    if (!/^\d+$/.test(body)) return null
    parts = groupDigits(body, includeSeconds)
  }
  if (!parts) return null

  const minutes = Number(parts[1])
  const seconds = Number(parts[2])
  if (minutes > 59 || seconds > 59) return null

  const hours = resolveHours(
    Number(parts[0]),
    typedMeridiem,
    meridiem,
    use24HourFormat,
  )
  if (hours === null) return null

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
}

/**
 * Renders a canonical value as the text shown in the box — the field's own
 * format, not the stored one. The meridiem is not included; it lives in the
 * toggle beside the text.
 */
export const formatTimeEntry = (
  value: string,
  { includeSeconds, use24HourFormat }: DisplayOptions,
): string => {
  if (!isCanonicalTime(value)) return ''

  const [hours, minutes, seconds] = value.split(':')
  const split = from24HourClock(Number(hours))
  const displayHours = use24HourFormat ? hours : pad2(split?.hour12 ?? 12)

  return includeSeconds
    ? `${displayHours}:${minutes}:${seconds}`
    : `${displayHours}:${minutes}`
}

/** Which half of the day a canonical value falls in. */
export const meridiemOf = (value: string): Meridiem =>
  (isCanonicalTime(value) &&
    from24HourClock(Number(value.slice(0, 2)))?.meridiem) ||
  'AM'

/** Characters that could still become a time. Anything else is dropped. */
export const stripUntypeable = (raw: string): string =>
  raw.replace(/[^\d:apmAPM\s]/g, '').slice(0, 11)

export interface TimeInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type'>, DisplayOptions {
  /** Exactly what the respondent has typed, unformatted. */
  text: string
  onTextChange: (text: string) => void
  meridiem: Meridiem
  onMeridiemChange: (meridiem: Meridiem) => void
}

export const TimeInput = forwardRef<TimeInputProps, 'input'>(
  (
    {
      text,
      onTextChange,
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
      (e) => onTextChange(stripUntypeable(e.target.value)),
      [onTextChange],
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
          value={text}
          onChange={handleChange}
          placeholder={includeSeconds ? 'hh:mm:ss' : 'hh:mm'}
          inputMode="numeric"
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
