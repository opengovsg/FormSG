import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render } from '~/test-utils'

import {
  formatTimeOfDay,
  isValidTimeOfDay,
  meridiemOf,
  parseTimeOfDay,
  TimeInput,
} from './TimeInput'

/**
 * `isValidTimeOfDay` guards the canonical value, not what the admin types.
 * That matters more than it looks: `toCloseAt` builds the instant with
 * `date-fns`' `set`, which coerces rather than rejecting — so an unguarded
 * partial value does not throw, it silently persists the wrong deadline.
 * "09:3" becomes 09:03, and an empty field becomes midnight.
 */
describe('isValidTimeOfDay', () => {
  it.each(['00:00', '09:30', '13:05', '23:59'])('should accept %s', (v) => {
    expect(isValidTimeOfDay(v)).toBe(true)
  })

  it.each([
    ['', 'empty'],
    ['0', 'single digit'],
    ['09', 'hours only'],
    ['09:', 'trailing colon'],
    ['09:3', 'one minute digit'],
    ['1430', 'unpunctuated digits'],
    ['24:00', 'hour out of range'],
    ['23:60', 'minute out of range'],
    ['9:30', 'unpadded hour'],
    ['ab:cd', 'letters'],
    ['09:30 PM', 'meridiem — canonical values are 24-hour'],
  ])('should reject %j (%s)', (v) => {
    expect(isValidTimeOfDay(v)).toBe(false)
  })
})

/**
 * `parseTimeOfDay` is where the field stops fighting the admin. The old mask
 * inserted the colon after the second digit, so typing 1, 2, 3 for "1:23"
 * produced "12:3" and then refused to save it. Everything below is a shape an
 * admin can reasonably type and expect to be understood on blur.
 */
describe('parseTimeOfDay', () => {
  describe('with the meridiem toggle on AM', () => {
    it.each([
      ['1', '01:00', 'bare hour'],
      ['12', '00:00', 'bare two-digit hour — 12 AM is midnight'],
      ['123', '01:23', 'three digits read as h:mm'],
      ['934', '09:34', 'three digits, two-digit minutes'],
      ['0934', '09:34', 'four digits read as hh:mm'],
      ['1234', '00:34', 'four digits, and 12 AM is still midnight'],
      ['1:23', '01:23', 'the reported complaint — 1:23 stays 1:23'],
      ['01:23', '01:23', 'already padded'],
      ['1:3', '01:03', 'a lone minute digit means 3 minutes, not 30'],
      ['9:05', '09:05', 'unpadded hour'],
      ['12:30', '00:30', '12 AM is midnight, not noon'],
      [' 1:23 ', '01:23', 'surrounding whitespace'],
    ])('should parse %j as %s (%s)', (raw, expected) => {
      expect(parseTimeOfDay(raw, 'AM')).toBe(expected)
    })
  })

  describe('with the meridiem toggle on PM', () => {
    it.each([
      ['1:23', '13:23', 'the toggle supplies the half of the day'],
      ['12:30', '12:30', '12 PM is noon, not midnight'],
      ['11:59', '23:59', 'last minute of the day'],
    ])('should parse %j as %s (%s)', (raw, expected) => {
      expect(parseTimeOfDay(raw, 'PM')).toBe(expected)
    })
  })

  describe('when the text settles the half of the day itself', () => {
    it.each([
      ['3:00pm', 'AM', '15:00', 'a typed meridiem outranks the toggle'],
      ['3:00 PM', 'AM', '15:00', 'spaced and upper case'],
      ['11:59pm', 'AM', '23:59', 'typed PM near midnight'],
      ['12:30am', 'PM', '00:30', 'typed AM outranks a PM toggle'],
      ['14:00', 'AM', '14:00', '24-hour entry is still accepted'],
      ['2359', 'AM', '23:59', 'four 24-hour digits'],
      ['0030', 'PM', '00:30', 'a leading zero hour is 12:30 AM, not PM'],
    ])('should parse %j (toggle %s) as %s — %s', (raw, meridiem, expected) => {
      expect(parseTimeOfDay(raw, meridiem as 'AM' | 'PM')).toBe(expected)
    })
  })

  it.each([
    ['', 'empty'],
    ['   ', 'whitespace only'],
    [':', 'bare colon'],
    ['1:', 'trailing colon'],
    [':30', 'leading colon'],
    ['1:2:3', 'two colons'],
    ['12345', 'too many digits'],
    ['abc', 'letters'],
    ['pm', 'meridiem with no time'],
    ['1:60', 'minute out of range'],
    ['25:00', 'hour out of range'],
    ['24:00', 'hour out of range — 24-hour clock stops at 23'],
    ['14:00pm', 'a 24-hour hour contradicts an explicit meridiem'],
    [
      '0:00am',
      'hour 0 contradicts an explicit meridiem — 12am is how to say it',
    ],
  ])('should reject %j (%s)', (raw) => {
    expect(parseTimeOfDay(raw, 'AM')).toBeNull()
  })
})

/** What the admin sees in the box: 12-hour, zero-padded, no meridiem. */
describe('formatTimeOfDay', () => {
  it.each([
    ['00:00', '12:00'],
    ['00:30', '12:30'],
    ['01:23', '01:23'],
    ['09:05', '09:05'],
    ['12:00', '12:00'],
    ['13:23', '01:23'],
    ['23:59', '11:59'],
  ])('should render %s as %s', (value, expected) => {
    expect(formatTimeOfDay(value)).toBe(expected)
  })

  it('should render nothing for a value that is not a time', () => {
    expect(formatTimeOfDay('')).toBe('')
    expect(formatTimeOfDay('nonsense')).toBe('')
  })
})

describe('meridiemOf', () => {
  it.each([
    ['00:00', 'AM'],
    ['11:59', 'AM'],
    ['12:00', 'PM'],
    ['23:59', 'PM'],
  ])('should read %s as %s', (value, expected) => {
    expect(meridiemOf(value)).toBe(expected)
  })
})

/**
 * Round-tripping is the property that keeps the box honest: whatever the admin
 * types, the text shown back and the toggle beside it must re-parse to the same
 * instant, or blurring twice would walk the value.
 */
describe('round-tripping', () => {
  it.each(['00:00', '00:30', '09:05', '12:00', '13:23', '23:59'])(
    'should re-parse the displayed form of %s unchanged',
    (canonical) => {
      const displayed = formatTimeOfDay(canonical)
      expect(parseTimeOfDay(displayed, meridiemOf(canonical))).toBe(canonical)
    },
  )
})

/**
 * The behaviour above is what the field computes; this is what the admin
 * experiences. Worth testing at this level because the complaint that prompted
 * the rewrite was not a wrong result — it was the field reformatting text out
 * from under someone mid-keystroke.
 */
describe('<TimeInput />', () => {
  const setup = (value = '09:30') => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    render(
      <TimeInput
        value={value}
        onChange={onChange}
        onCommit={onCommit}
        aria-label="Expiry time"
      />,
    )
    return {
      user: userEvent.setup(),
      input: screen.getByLabelText('Expiry time') as HTMLInputElement,
      onChange,
      onCommit,
    }
  }

  it('should show a stored 24-hour value on a 12-hour clock', () => {
    setup('13:23')
    expect(screen.getByLabelText('Expiry time')).toHaveValue('01:23')
    expect(screen.getByRole('button')).toHaveTextContent('PM')
  })

  it('should leave keystrokes alone while the admin is still typing', async () => {
    const { user, input } = setup()
    await user.clear(input)
    await user.type(input, '123')

    // The old mask turned this into "12:3" on the third keystroke, which is the
    // bug being fixed. Nothing is reformatted until blur.
    expect(input).toHaveValue('123')
  })

  it('should format a partial time once the admin leaves the field', async () => {
    const { user, input, onCommit } = setup()
    await user.clear(input)
    await user.type(input, '123')
    await user.tab()

    expect(input).toHaveValue('01:23')
    expect(onCommit).toHaveBeenLastCalledWith('01:23')
  })

  it('should keep an unparseable entry on screen and report it as invalid', async () => {
    const { user, input, onCommit } = setup()
    await user.clear(input)
    await user.type(input, '99:99')
    await user.tab()

    // Left as typed rather than reverted, so the admin can see what to fix.
    expect(input).toHaveValue('99:99')
    expect(onCommit).toHaveBeenLastCalledWith(null)
  })

  it('should move the stored time by twelve hours when the meridiem is toggled', async () => {
    const { user, onCommit } = setup('09:30')
    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('PM')
    expect(screen.getByLabelText('Expiry time')).toHaveValue('09:30')
    expect(onCommit).toHaveBeenLastCalledWith('21:30')
  })

  it('should let a typed meridiem set the toggle', async () => {
    const { user, input, onCommit } = setup('09:30')
    await user.clear(input)
    await user.type(input, '3:00pm')
    await user.tab()

    expect(input).toHaveValue('03:00')
    expect(screen.getByRole('button')).toHaveTextContent('PM')
    expect(onCommit).toHaveBeenLastCalledWith('15:00')
  })
})
