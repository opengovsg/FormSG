import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { forwardRef, InputGroup, InputRightElement } from '@chakra-ui/react'

import Button from '~components/Button'
import Input, { InputProps } from '~components/Input'

/**
 * TEMPORARY: a text input for a time of day, to unblock scheduled form closure
 * until the real Time field lands. Delete it then.
 *
 * Admins read and write a 12-hour clock, but the value crossing this
 * component's boundary is always canonical 24-hour `HH:mm`.
 */

export type Meridiem = 'AM' | 'PM'

/**
 * Matches the canonical 24-hour value the component emits, not what the admin
 * types — see `parseTimeOfDay` for that.
 *
 * NOTE: in date-fns format strings `hh` is the 12-hour clock, so the format
 * strings that read and write this value must stay `HH:mm`.
 */
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidTimeOfDay = (value: string): boolean =>
  TIME_OF_DAY_REGEX.test(value)

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Canonical 24-hour `HH:mm` for a 12-hour reading. */
const to24Hour = (hours12: number, meridiem: Meridiem, minutes: number) => {
  const hours24 =
    meridiem === 'AM'
      ? hours12 === 12
        ? 0
        : hours12
      : hours12 === 12
        ? 12
        : hours12 + 12
  return `${pad2(hours24)}:${pad2(minutes)}`
}

/** Which half of the day a canonical `HH:mm` falls in. */
export const meridiemOf = (value: string): Meridiem =>
  isValidTimeOfDay(value) && Number(value.slice(0, 2)) >= 12 ? 'PM' : 'AM'

/** Renders a canonical `HH:mm` as 12-hour text, without the meridiem. */
export const formatTimeOfDay = (value: string): string => {
  if (!isValidTimeOfDay(value)) return ''
  const hours24 = Number(value.slice(0, 2))
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${pad2(hours12)}:${value.slice(3)}`
}

/**
 * Parses what an admin typed into a canonical 24-hour `HH:mm`, or `null` if it
 * is not a time at all. Runs on blur, so nothing is reformatted mid-keystroke.
 *
 * Accepted, with `meridiem` supplying the half of the day when the text alone
 * does not settle it:
 *   "1"      -> 01:00        bare hour
 *   "123"    -> 01:23        3 digits read as h:mm
 *   "1234"   -> 12:34        4 digits read as hh:mm
 *   "1:23"   -> 01:23        explicit colon
 *   "1:3"    -> 01:03        a lone minute digit is the tens column, as written
 *   "3:00pm" -> 15:00        typed meridiem wins over the toggle
 *   "14:00"  -> 14:00        24-hour input is accepted and shown back as 02:00 PM
 */
export const parseTimeOfDay = (
  raw: string,
  meridiem: Meridiem = 'AM',
): string | null => {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!cleaned) return null

  const typedMeridiem: Meridiem | null = cleaned.endsWith('pm')
    ? 'PM'
    : cleaned.endsWith('am')
      ? 'AM'
      : null
  const body = typedMeridiem ? cleaned.slice(0, -2) : cleaned

  let hourPart: string
  let minutePart: string

  if (body.includes(':')) {
    const parts = body.split(':')
    if (parts.length !== 2) return null
    ;[hourPart, minutePart] = parts
    if (!/^\d{1,2}$/.test(hourPart) || !/^\d{1,2}$/.test(minutePart))
      return null
  } else {
    if (!/^\d{1,4}$/.test(body)) return null
    if (body.length <= 2) {
      hourPart = body
      minutePart = '0'
    } else if (body.length === 3) {
      hourPart = body.slice(0, 1)
      minutePart = body.slice(1)
    } else {
      hourPart = body.slice(0, 2)
      minutePart = body.slice(2)
    }
  }

  const hours = Number(hourPart)
  const minutes = Number(minutePart)
  if (minutes > 59) return null

  // "14:00pm" is a contradiction, not something to guess at.
  if (typedMeridiem) {
    if (hours < 1 || hours > 12) return null
    return to24Hour(hours, typedMeridiem, minutes)
  }

  if (hours > 23) return null
  // 0 and 13-23 are unambiguous on their own; the toggle does not get a say.
  if (hours === 0 || hours > 12) return `${pad2(hours)}:${pad2(minutes)}`
  return to24Hour(hours, meridiem, minutes)
}

/** Keystrokes that could still become a time. Anything else is dropped. */
const stripUntypeable = (raw: string): string =>
  raw.replace(/[^\d:apmAPM\s]/g, '').slice(0, 8)

export interface TimeInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'type'
> {
  /** Canonical 24-hour `HH:mm`, or `''` when there is no valid time. */
  value: string
  /** Fired on every keystroke, with `''` while the text is not yet a time. */
  onChange: (value: string) => void
  /**
   * Fired on blur and on toggling the meridiem, with the canonical value or
   * `null`. Save and show errors from here rather than from `onChange`. The
   * value is passed rather than read from `value`, since a normalising blur
   * emits and commits in the same tick.
   */
  onCommit?: (value: string | null) => void
}

export const TimeInput = forwardRef<TimeInputProps, 'input'>(
  ({ value, onChange, onCommit, onBlur, isDisabled, ...props }, ref) => {
    const [text, setText] = useState(() => formatTimeOfDay(value))
    const [meridiem, setMeridiem] = useState<Meridiem>(() => meridiemOf(value))

    // The box holds raw keystrokes, so it cannot simply mirror `value`. Adopt
    // `value` only when it changes for some reason other than this component
    // reporting it, so a half-typed time survives a re-render.
    const reported = useRef(value)
    useEffect(() => {
      if (value === reported.current) return
      reported.current = value
      setText(formatTimeOfDay(value))
      setMeridiem(meridiemOf(value))
    }, [value])

    const report = useCallback(
      (next: string | null) => {
        reported.current = next ?? ''
        onChange(next ?? '')
        return next
      },
      [onChange],
    )

    const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (e) => {
        const nextText = stripUntypeable(e.target.value)
        setText(nextText)
        report(parseTimeOfDay(nextText, meridiem))
      },
      [meridiem, report],
    )

    const handleBlur: FocusEventHandler<HTMLInputElement> = useCallback(
      (e) => {
        const parsed = parseTimeOfDay(text, meridiem)
        if (parsed) {
          setText(formatTimeOfDay(parsed))
          setMeridiem(meridiemOf(parsed))
        }
        report(parsed)
        onCommit?.(parsed)
        onBlur?.(e)
      },
      [meridiem, onBlur, onCommit, report, text],
    )

    const handleToggleMeridiem = useCallback(() => {
      const next: Meridiem = meridiem === 'AM' ? 'PM' : 'AM'
      setMeridiem(next)

      // Toggling is only a time change if there is a time to change.
      const parsed = parseTimeOfDay(text, next)
      if (!parsed) return
      setText(formatTimeOfDay(parsed))
      report(parsed)
      onCommit?.(parsed)
    }, [meridiem, onCommit, report, text])

    return (
      <InputGroup>
        <Input
          ref={ref}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          isDisabled={isDisabled}
          placeholder="hh:mm"
          inputMode="numeric"
          // Room for the meridiem toggle pinned at the right edge.
          sx={{ pr: '3.75rem' }}
          {...props}
        />
        <InputRightElement w="3.75rem">
          <Button
            variant="clear"
            size="sm"
            px="0.5rem"
            h="2rem"
            fontSize="1rem"
            colorScheme="secondary"
            isDisabled={isDisabled}
            // Keep focus in the box, so this does not commit twice.
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleMeridiem}
            aria-label={`${meridiem}, change to ${meridiem === 'AM' ? 'PM' : 'AM'}`}
          >
            {meridiem}
          </Button>
        </InputRightElement>
      </InputGroup>
    )
  },
)
