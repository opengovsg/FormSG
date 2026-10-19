import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MAX_SAVED_VIEWS } from 'formsg-shared/constants'
import {
  FormSavedView,
  Language,
  SavedViewSortDirection,
} from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { ResponsesToolbar } from './ResponsesToolbar'
import { ResponsesViewState } from './savedViews'
import { ALL_RESPONSES_VIEW_ID } from './UnlockedResponsesProvider'

const mockCreateView = vi.fn()
const mockUpdateView = vi.fn()
let mockContext: Record<string, unknown> = {}

vi.mock('./UnlockedResponsesProvider', () => ({
  ALL_RESPONSES_VIEW_ID: 'all-responses',
  useUnlockedResponses: () => mockContext,
}))

vi.mock('./useSavedViewMutation', () => ({
  useSavedViewMutation: () => ({ mutate: mockCreateView, isLoading: false }),
  useUpdateSavedViewMutation: () => ({
    mutate: mockUpdateView,
    isLoading: false,
  }),
}))

vi.mock('./FilterMenu', () => ({ FilterMenu: () => null }))
vi.mock('./SortMenu', () => ({ SortMenu: () => null }))
vi.mock('./ColumnsMenu', () => ({ ColumnsMenu: () => null }))
vi.mock('./DownloadButton', () => ({ DownloadButton: () => null }))

const COLUMN_OPTIONS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
]

const VIEW: FormSavedView = {
  _id: 'view-1',
  name: 'Pending approvals',
  filter: { columnFilters: [{ columnId: 'a', text: 'pending' }] },
}

const VIEW_STATE: ResponsesViewState = {
  dateRange: [],
  columnFilters: [{ columnId: 'a', text: 'pending' }],
  hiddenColumnIds: [],
  sortColumnId: undefined,
  sortDirection: SavedViewSortDirection.Descending,
}

const renderToolbar = ({
  selectedViewId,
  currentViewState,
  savedViews = [VIEW],
}: {
  selectedViewId: string
  currentViewState: ResponsesViewState
  savedViews?: FormSavedView[]
}) => {
  mockContext = {
    columnOptions: COLUMN_OPTIONS,
    currentViewState,
    hasActiveFilters: true,
    savedViews,
    selectedViewId,
  }
  render(
    <ChakraProvider theme={theme}>
      <ResponsesToolbar />
    </ChakraProvider>,
  )
}

const saveViewButton = () => screen.getByRole('button', { name: /save view/i })

describe('the save view button', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))
  beforeEach(() => vi.clearAllMocks())

  it('saves changes to the selected view in place, under its own name', async () => {
    renderToolbar({
      selectedViewId: VIEW._id,
      currentViewState: { ...VIEW_STATE, hiddenColumnIds: ['b'] },
    })

    await userEvent.setup().click(saveViewButton())

    expect(mockUpdateView).toHaveBeenCalledWith({
      savedViewId: VIEW._id,
      savedView: {
        name: VIEW.name,
        filter: { columnFilters: [{ columnId: 'a', text: 'pending' }] },
        columnIds: ['a'],
      },
    })
    expect(mockCreateView).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cannot save the selected view when nothing has changed', () => {
    renderToolbar({ selectedViewId: VIEW._id, currentViewState: VIEW_STATE })

    expect(saveViewButton()).toBeDisabled()
  })

  it('saves changes to the selected view even when the form has the most views allowed', () => {
    renderToolbar({
      selectedViewId: VIEW._id,
      currentViewState: {
        ...VIEW_STATE,
        columnFilters: [{ columnId: 'a', text: 'approved' }],
      },
      savedViews: Array.from({ length: MAX_SAVED_VIEWS }, (_, i) => ({
        ...VIEW,
        _id: i === 0 ? VIEW._id : `view-${i + 1}`,
      })),
    })

    expect(saveViewButton()).toBeEnabled()
  })

  it('asks for a name and saves a new view from All responses', async () => {
    renderToolbar({
      selectedViewId: ALL_RESPONSES_VIEW_ID,
      currentViewState: {
        ...VIEW_STATE,
        columnFilters: [{ columnId: 'a', text: 'approved' }],
      },
    })
    const user = userEvent.setup()

    await user.click(saveViewButton())
    await user.type(await screen.findByRole('textbox'), 'Approved')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(mockCreateView).toHaveBeenCalledWith({
      name: 'Approved',
      filter: { columnFilters: [{ columnId: 'a', text: 'approved' }] },
    })
    expect(mockUpdateView).not.toHaveBeenCalled()
  })

  it('cannot save a new view from All responses that matches a saved one', () => {
    renderToolbar({
      selectedViewId: ALL_RESPONSES_VIEW_ID,
      currentViewState: VIEW_STATE,
    })

    expect(saveViewButton()).toBeDisabled()
  })
})
