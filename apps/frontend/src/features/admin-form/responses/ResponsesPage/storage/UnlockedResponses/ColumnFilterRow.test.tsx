import { useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { ColumnFilterRow, ColumnValuesFilterRow } from './ColumnFilterRow'

const Harness = ({
  initialText = '',
  onFilter,
}: {
  initialText?: string
  onFilter: (text: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState(initialText)
  return (
    <ColumnFilterRow
      label="Name"
      text={text}
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      onFilter={(next) => {
        setText(next)
        onFilter(next)
      }}
    />
  )
}

const renderRow = (props: Parameters<typeof Harness>[0]) =>
  render(
    <ChakraProvider theme={theme}>
      <Harness {...props} />
    </ChakraProvider>,
  )

describe('a column in the Filter menu', () => {
  beforeAll(async () => {
    await i18n.changeLanguage(Language.ENGLISH)
  })

  it('opens a field for the column when clicked', async () => {
    renderRow({ onFilter: vi.fn() })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /name/i }))

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveFocus()
  })

  it('applies the typed text as the column filter without a submit', async () => {
    const onFilter = vi.fn()
    renderRow({ onFilter })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /name/i }))
    await user.type(await screen.findByRole('textbox'), 'tan')

    await waitFor(() => expect(onFilter).toHaveBeenLastCalledWith('tan'))
  })

  it('shows that a filter is applied once the field closes', async () => {
    renderRow({ onFilter: vi.fn() })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /name/i }))
    await user.type(await screen.findByRole('textbox'), 'tan{Enter}')

    await waitFor(() =>
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Filter applied')).toBeInTheDocument()
  })

  it('closes the field and applies its text when the column is clicked again', async () => {
    const onFilter = vi.fn()
    renderRow({ onFilter })
    const user = userEvent.setup()
    const column = screen.getByRole('button', { name: /name/i })

    await user.click(column)
    await user.type(await screen.findByRole('textbox'), 'tan')
    await user.click(column)

    expect(onFilter).toHaveBeenLastCalledWith('tan')
    // The lazy popover unmounts its field only after the exit animation ends.
    await waitFor(() =>
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument(),
    )
    expect(column).toHaveAttribute('aria-expanded', 'false')
  })

  it('clears the filter when the text is emptied', async () => {
    const onFilter = vi.fn()
    renderRow({ initialText: 'tan', onFilter })
    const user = userEvent.setup()
    expect(screen.getByText('Filter applied')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /name/i }))
    await user.clear(await screen.findByRole('textbox'))
    await user.keyboard('{Escape}')

    expect(onFilter).toHaveBeenLastCalledWith('')
    expect(screen.queryByText('Filter applied')).not.toBeInTheDocument()
  })

  it('clears the text from a button that shows only once text is typed', async () => {
    const onFilter = vi.fn()
    renderRow({ onFilter })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /name/i }))
    const field = await screen.findByRole('textbox')
    expect(
      screen.queryByRole('button', { name: 'Clear filter' }),
    ).not.toBeInTheDocument()

    await user.type(field, 'tan')
    await user.click(screen.getByRole('button', { name: 'Clear filter' }))

    expect(field).toHaveValue('')
    expect(field).toHaveFocus()
    expect(onFilter).toHaveBeenLastCalledWith('')
  })
})

const STATUSES = ['Pending', 'Approved', 'Not approved']

const ValuesHarness = ({
  initialValues,
  onFilter,
}: {
  initialValues?: string[]
  onFilter: (values: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [values, setValues] = useState(initialValues)
  return (
    <ColumnValuesFilterRow
      label="Status"
      filterValues={STATUSES}
      values={values}
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      onFilter={(next) => {
        const isEveryValue = next.length === STATUSES.length
        setValues(isEveryValue ? undefined : next)
        onFilter(next)
      }}
    />
  )
}

const renderValuesRow = (props: Parameters<typeof ValuesHarness>[0]) =>
  render(
    <ChakraProvider theme={theme}>
      <ValuesHarness {...props} />
    </ChakraProvider>,
  )

describe('a column in the Filter menu with a fixed set of values', () => {
  beforeAll(async () => {
    await i18n.changeLanguage(Language.ENGLISH)
  })

  it('opens a checkbox per value, all checked, instead of a field', async () => {
    renderValuesRow({ onFilter: vi.fn() })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /status/i }))

    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes).toEqual(
      STATUSES.map((name) => screen.getByRole('checkbox', { name })),
    )
    checkboxes.forEach((box) => expect(box).toBeChecked())
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Filter applied')).not.toBeInTheDocument()
  })

  it('filters to the values left checked once one is unchecked', async () => {
    const onFilter = vi.fn()
    renderValuesRow({ onFilter })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /status/i }))
    await user.click(
      await screen.findByRole('checkbox', { name: 'Not approved' }),
    )

    expect(onFilter).toHaveBeenLastCalledWith(['Pending', 'Approved'])
    expect(screen.getByText('Filter applied')).toBeInTheDocument()
  })

  it('shows only the filtered values as checked', async () => {
    renderValuesRow({ initialValues: ['Approved'], onFilter: vi.fn() })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /status/i }))

    expect(
      await screen.findByRole('checkbox', { name: 'Approved' }),
    ).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Pending' })).not.toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Not approved' }),
    ).not.toBeChecked()
  })

  it('clears the filter once every value is checked again', async () => {
    const onFilter = vi.fn()
    renderValuesRow({
      initialValues: ['Pending', 'Approved'],
      onFilter,
    })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /status/i }))
    await user.click(
      await screen.findByRole('checkbox', { name: 'Not approved' }),
    )

    expect(onFilter).toHaveBeenLastCalledWith(STATUSES)
    expect(screen.queryByText('Filter applied')).not.toBeInTheDocument()
  })
})
