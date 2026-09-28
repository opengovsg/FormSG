import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { DeleteViewModal } from './DeleteViewModal'
import { ResponseViewTabs } from './ResponseViewTabs'

const VIEWS = [
  { id: 'view-1', name: 'Pending approvals' },
  { id: 'view-2', name: 'Last quarter' },
]

const renderWithTheme = (ui: JSX.Element) =>
  render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)

describe('the saved view tabs', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))

  it('offers a delete button on every saved view, but not on All responses', () => {
    renderWithTheme(<ResponseViewTabs views={VIEWS} />)

    expect(
      screen.getByRole('button', { name: /^all responses$/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /delete view all responses/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /delete view pending approvals/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /delete view last quarter/i }),
    ).toBeInTheDocument()
  })

  it('asks to delete the view the button belongs to, without selecting it', async () => {
    const onDeleteView = vi.fn()
    const onSelectView = vi.fn()
    renderWithTheme(
      <ResponseViewTabs
        views={VIEWS}
        onDeleteView={onDeleteView}
        onSelectView={onSelectView}
      />,
    )

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /delete view last quarter/i }))

    expect(onDeleteView).toHaveBeenCalledWith('view-2')
    expect(onSelectView).not.toHaveBeenCalled()
  })

  it('still selects the view when its label is clicked', async () => {
    const onSelectView = vi.fn()
    renderWithTheme(
      <ResponseViewTabs views={VIEWS} onSelectView={onSelectView} />,
    )

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /^pending approvals$/i }))

    expect(onSelectView).toHaveBeenCalledWith('view-1')
  })
})

describe('the delete view modal', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))

  const setup = () => {
    const onDelete = vi.fn()
    const onClose = vi.fn()
    renderWithTheme(
      <DeleteViewModal
        isOpen
        onClose={onClose}
        onDelete={onDelete}
        viewName="Pending approvals"
      />,
    )
    return { onDelete, onClose, ui: userEvent.setup() }
  }

  it('names the view it is about to delete', () => {
    setup()

    expect(screen.getByText('Delete Pending approvals?')).toBeInTheDocument()
  })

  it('deletes on Delete and dismisses on Cancel', async () => {
    const { onDelete, onClose, ui } = setup()

    await ui.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()

    await ui.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onDelete).toHaveBeenCalled()
  })
})
