import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { ShowMoreRowsButton } from './ShowMoreRowsButton'

const mockUseUnlockedResponses = vi.fn()
const mockProvider = (overrides: Record<string, unknown> = {}) =>
  mockUseUnlockedResponses.mockReturnValue({
    isTableLoading: false,
    renderLimit: 50,
    renderedRowCount: 120,
    showMoreRows: vi.fn(),
    ...overrides,
  })

vi.mock('./UnlockedResponsesProvider', () => ({
  useUnlockedResponses: () => mockUseUnlockedResponses(),
}))

const renderButton = () =>
  render(
    <ChakraProvider theme={theme}>
      <ShowMoreRowsButton />
    </ChakraProvider>,
  )

describe('the show more rows button', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))

  it('reveals the next chunk of rows only when clicked', async () => {
    const showMoreRows = vi.fn()
    mockProvider({ showMoreRows })
    renderButton()

    expect(showMoreRows).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }))

    expect(showMoreRows).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['every row is rendered', { renderedRowCount: 120, renderLimit: 150 }],
    ['the rows exactly fill the limit', { renderedRowCount: 50 }],
    ['a search matches no rows', { renderedRowCount: 0 }],
    ['the table is still loading', { isTableLoading: true }],
  ])('is hidden when %s', (_, overrides) => {
    mockProvider(overrides)
    renderButton()

    expect(
      screen.queryByRole('button', { name: 'Show more' }),
    ).not.toBeInTheDocument()
  })
})
