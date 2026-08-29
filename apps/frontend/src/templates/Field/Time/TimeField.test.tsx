import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from './TimeField.stories'

const { TwentyFourHour, TwelveHourWithSeconds, Optional } =
  composeStories(stories)

const typeInto = async (value: string) => {
  const input = screen.getByPlaceholderText(/hh:mm/i) as HTMLInputElement
  await act(async () => userEvent.type(input, value))
  return input
}

const submit = async () =>
  act(async () =>
    userEvent.click(screen.getByRole('button', { name: /submit/i })),
  )

describe('required field', () => {
  it('renders the required error when nothing is entered', async () => {
    await act(async () => {
      render(<TwentyFourHour defaultValue={undefined} />)
    })

    await submit()

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('renders the invalid error when the entry is not a time', async () => {
    await act(async () => {
      render(<TwentyFourHour defaultValue={undefined} />)
    })

    await typeInto('99')
    await submit()

    // Not the required error: something *was* entered, it is just not a time.
    expect(screen.getByText('Please enter a valid time')).toBeInTheDocument()
    expect(screen.queryByText('This field is required')).toBeNull()
  })

  it('completes a bare hour to the top of that hour', async () => {
    await act(async () => {
      render(<TwentyFourHour defaultValue={undefined} />)
    })

    await typeInto('12')
    await submit()

    expect(screen.getByText('Submitted: 12:00:00')).toBeInTheDocument()
  })

  it('reads three digits as h:mm rather than refusing them', async () => {
    await act(async () => {
      render(<TwentyFourHour defaultValue={undefined} />)
    })

    await typeInto('930')
    await submit()

    expect(screen.getByText('Submitted: 09:30:00')).toBeInTheDocument()
  })

  it('renders the invalid error when the entry is out of range', async () => {
    await act(async () => {
      render(<TwentyFourHour defaultValue={undefined} />)
    })

    await typeInto('2599')
    await submit()

    expect(screen.getByText('Please enter a valid time')).toBeInTheDocument()
  })

  it('submits the canonical value when the entry is valid', async () => {
    await act(async () => {
      render(<TwentyFourHour defaultValue={undefined} />)
    })

    await typeInto('1430')
    await submit()

    expect(screen.getByText('Submitted: 14:30:00')).toBeInTheDocument()
    expect(screen.queryByText('Please enter a valid time')).toBeNull()
  })
})

describe('optional field', () => {
  it('submits when nothing is entered', async () => {
    await act(async () => {
      render(<Optional defaultValue={undefined} />)
    })

    await submit()

    expect(screen.getByText(/nothing was entered/i)).toBeInTheDocument()
  })

  it('rejects an unusable entry rather than silently dropping it', async () => {
    await act(async () => {
      render(<Optional defaultValue={undefined} />)
    })

    await typeInto('99')
    await submit()

    expect(screen.getByText('Please enter a valid time')).toBeInTheDocument()
    expect(screen.queryByText(/nothing was entered/i)).toBeNull()
  })
})

describe('12-hour entry', () => {
  // An hour of 13 has only one possible reading, so it is taken at face value
  // rather than refused — a respondent typing it out of 24-hour habit means
  // half past one in the afternoon.
  it('accepts a 24-hour hour typed into a 12-hour field', async () => {
    await act(async () => {
      render(<TwelveHourWithSeconds defaultValue={undefined} />)
    })

    await typeInto('133045')
    await submit()

    expect(screen.getByText('Submitted: 13:30:45')).toBeInTheDocument()
  })

  // The guard that matters: an entry the parser refuses must never reach
  // validation looking like a canonical HH:MM:SS, or it would pass and submit
  // an answer the input never accepted.
  it('never submits an entry the input refused', async () => {
    await act(async () => {
      render(<TwelveHourWithSeconds defaultValue={undefined} />)
    })

    await typeInto('253045')
    await submit()

    expect(screen.getByText('Please enter a valid time')).toBeInTheDocument()
    expect(screen.queryByText(/submitted:/i)).toBeNull()
  })

  it('submits the 24-hour equivalent of a PM time', async () => {
    await act(async () => {
      render(<TwelveHourWithSeconds defaultValue={undefined} />)
    })

    await typeInto('013045')
    await act(async () =>
      userEvent.click(screen.getByRole('button', { name: /change to pm/i })),
    )
    await submit()

    expect(screen.getByText('Submitted: 13:30:45')).toBeInTheDocument()
  })
})
