import { useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { ColumnFilterRow } from './ColumnFilterRow'

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
