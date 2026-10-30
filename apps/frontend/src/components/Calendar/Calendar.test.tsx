import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { isSameDay, startOfDay } from 'date-fns'

import { theme } from '~theme/index'

import { Calendar } from '.'

const renderCalendar = (props: Parameters<typeof Calendar>[0]) =>
  render(
    <ChakraProvider theme={theme}>
      <Calendar {...props} />
    </ChakraProvider>,
  )

describe('Calendar', () => {
  it('selects today when Today is clicked', async () => {
    const onChange = vi.fn()
    renderCalendar({ onChange })

    await userEvent.click(
      screen.getByRole('button', { name: "Select today's date" }),
    )

    expect(onChange).toHaveBeenCalledWith(startOfDay(new Date()))
  })

  it('does not select today when today is unavailable', async () => {
    const onChange = vi.fn()
    renderCalendar({
      onChange,
      isDateUnavailable: (d) => isSameDay(d, new Date()),
    })

    await userEvent.click(
      screen.getByRole('button', { name: "Select today's date" }),
    )

    expect(onChange).not.toHaveBeenCalled()
  })
})
