/**
 * The canonical persisted form of a Time field answer: 24-hour, zero-padded,
 * always including a seconds component. Answers are stored in this form
 * regardless of the field's `includeSeconds` setting.
 */
const CANONICAL_TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/

/**
 * What a respondent is permitted to type, before normalisation. The hour and
 * seconds components may be entered without a leading zero.
 */
const INPUT_TIME_FORMAT = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/

const isInRange = (value: number, max: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= max

/**
 * Validates whether a value is in the canonical persisted form for a Time
 * field — 24-hour `HH:MM:SS`, zero-padded.
 * @param value The value to be validated
 */
export const isCanonicalTime = (value: string): boolean =>
  CANONICAL_TIME_FORMAT.test(value)

/**
 * Normalises respondent input into the canonical persisted form. Accepts an
 * unpadded hour or seconds component, and accepts a value with no seconds
 * component (normalised to `00`).
 *
 * Returns `null` if the value is not a valid time of day, so callers can
 * distinguish "not normalisable" from a legitimately normalised value.
 *
 * @param value The raw respondent input
 * @param includeSeconds Whether the field collects a seconds component. When
 * false, a seconds component in the input is rejected.
 */
export const normalizeTime = (
  value: string,
  includeSeconds: boolean,
): string | null => {
  const parsed = value?.trim().match(INPUT_TIME_FORMAT)

  if (!parsed) return null

  const [, rawHours, rawMinutes, rawSeconds] = parsed

  // A seconds component is only permitted when the field collects one.
  if (!includeSeconds && rawSeconds !== undefined) return null

  const hours = Number(rawHours)
  const minutes = Number(rawMinutes)
  const seconds = rawSeconds === undefined ? 0 : Number(rawSeconds)

  if (
    !isInRange(hours, 23) ||
    !isInRange(minutes, 59) ||
    !isInRange(seconds, 59)
  ) {
    return null
  }

  const pad = (component: number) => String(component).padStart(2, '0')

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/** The two halves of a 12-hour clock. */
export type Meridiem = 'AM' | 'PM'

/**
 * Converts a 12-hour clock reading into the 24-hour hour component.
 *
 * The two ends of the dial are the ones worth being careful about: 12 AM is
 * midnight (00) and 12 PM is noon (12), which is the opposite of what the
 * arithmetic suggests.
 *
 * Returns `null` for an hour outside 1-12, so callers can distinguish an
 * unconvertible reading from a legitimate `0`.
 */
export const to24HourClock = (
  hour12: number,
  meridiem: Meridiem,
): number | null => {
  if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) return null
  if (meridiem === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

/**
 * Splits a 24-hour hour component into its 12-hour clock reading.
 * The inverse of `to24HourClock`.
 */
export const from24HourClock = (
  hour24: number,
): { hour12: number; meridiem: Meridiem } | null => {
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) return null
  const meridiem: Meridiem = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, meridiem }
}
