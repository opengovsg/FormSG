import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { ColumnsMenu } from './ColumnsMenu'

const mockSetAllColumnsVisible = vi.fn()
const mockToggleColumnVisibility = vi.fn()
let hiddenColumnIds: string[] = []

vi.mock('./UnlockedResponsesProvider', () => ({
  useUnlockedResponses: () => ({
    columnOptions: [
      { id: 'a', label: 'Response ID' },
      { id: 'b', label: 'Response timestamp' },
    ],
    hiddenColumnIds,
    setAllColumnsVisible: mockSetAllColumnsVisible,
    toggleColumnVisibility: mockToggleColumnVisibility,
  }),
}))

const openColumnsMenu = async () => {
  render(
    <ChakraProvider theme={theme}>
      <ColumnsMenu />
    </ChakraProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: /columns/i }))
  return screen.findByRole('checkbox', { name: 'All' })
}

describe('the Columns menu', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))
  afterEach(() => {
    hiddenColumnIds = []
    vi.clearAllMocks()
  })

  it('unselects all from checked and keeps the menu open', async () => {
    const all = await openColumnsMenu()
    expect(all).toBeChecked()
    await userEvent.click(all)
    expect(mockSetAllColumnsVisible).toHaveBeenCalledWith(false)
    expect(all).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Check all' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Uncheck all' }),
    ).not.toBeInTheDocument()
  })

  it('selects all from unchecked', async () => {
    hiddenColumnIds = ['a', 'b']
    const all = await openColumnsMenu()
    expect(all).not.toBeChecked()
    expect(all).not.toBePartiallyChecked()
    await userEvent.click(all)
    expect(mockSetAllColumnsVisible).toHaveBeenCalledWith(true)
  })

  it('selects all from partial using the keyboard', async () => {
    hiddenColumnIds = ['a']
    const all = await openColumnsMenu()
    expect(all).toBePartiallyChecked()
    all.focus()
    await userEvent.keyboard(' ')
    expect(mockSetAllColumnsVisible).toHaveBeenCalledWith(true)
  })

  it('ignores absent IDs and preserves individual toggles', async () => {
    hiddenColumnIds = ['removed-column']
    expect(await openColumnsMenu()).toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: /Response ID/ }))
    expect(mockToggleColumnVisibility).toHaveBeenCalledWith('a')
  })
})
