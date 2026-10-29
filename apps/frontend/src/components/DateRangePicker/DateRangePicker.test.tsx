import { useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DateString } from 'formsg-shared/types'

import { theme } from '~theme/index'

import { DateRangePicker, dateRangePickerHelper } from '.'

const Harness = ({ initial }: { initial: DateString[] }) => {
  const [range, setRange] = useState(initial)
  return (
    <ChakraProvider theme={theme}>
      <DateRangePicker
        value={dateRangePickerHelper.dateStringToDatePickerValue(range)}
        onChange={(next) =>
          setRange(dateRangePickerHelper.datePickerValueToDateString(next))
        }
      />
      <button onClick={() => setRange([])}>Reset</button>
      <button
        onClick={() => setRange(['2026-09-01', '2026-09-02'] as DateString[])}
      >
        Apply view
      </button>
    </ChakraProvider>
  )
}

const inputs = () => screen.getAllByRole('textbox') as HTMLInputElement[]

describe('DateRangePicker', () => {
  it('empties its inputs when the value is cleared from outside', async () => {
    render(<Harness initial={['2026-10-06', '2026-10-08'] as DateString[]} />)
    expect(inputs().map((input) => input.value)).toEqual([
      '06/10/2026',
      '08/10/2026',
    ])

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(inputs().map((input) => input.value)).toEqual(['', ''])
  })

  it('shows a range set from outside', async () => {
    render(<Harness initial={[]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Apply view' }))

    expect(inputs().map((input) => input.value)).toEqual([
      '01/09/2026',
      '02/09/2026',
    ])
  })

  it('keeps a partly typed date while the value round-trips', async () => {
    render(<Harness initial={[]} />)
    const [start] = inputs()

    await userEvent.type(start, '06/10')

    expect(start.value).toMatch(/^06\/10/)
  })
})
