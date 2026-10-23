import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AnalyticsEventType,
  FormSavedView,
  Language,
  SavedViewSortDirection,
} from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { DownloadButton } from './DownloadButton'
import { ResponsesViewState } from './savedViews'

const FORM_ID = '0123456789abcdef01234567'

const mockLogAnalyticsEvent = vi.fn()
const mockMutate = vi.fn()
let mockIsDelightful = true
let mockContext: Record<string, unknown> = {}

vi.mock('~features/analytics/AnalyticsEventService', () => ({
  logAnalyticsEvent: (...args: unknown[]) => mockLogAnalyticsEvent(...args),
}))

vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => mockIsDelightful,
}))

vi.mock('./UnlockedResponsesProvider', () => ({
  useUnlockedResponses: () => mockContext,
}))

vi.mock('../StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({
    downloadParams: { responsesCount: 12 },
    dateRangeResponsesCount: 12,
  }),
}))

vi.mock('../useDecryptionWorkers', () => ({
  default: () => ({
    handleBulkDownloadMutation: { mutate: mockMutate, isLoading: false },
    abortDecryption: vi.fn(),
  }),
}))

vi.mock('~templates/NavigationPrompt', () => ({
  NavigationPrompt: () => null,
}))

vi.mock('./DownloadWithAttachmentModal', () => ({
  DownloadWithAttachmentModal: ({
    isOpen,
    onDownload,
  }: {
    isOpen: boolean
    onDownload: () => void
  }) =>
    isOpen ? <button onClick={onDownload}>Confirm download</button> : null,
}))

const COLUMN_OPTIONS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
]

const VIEW: FormSavedView = {
  _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
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

const renderButton = ({
  isDelightful = true,
  selectedViewId = 'all-responses',
  currentViewState = VIEW_STATE,
}: {
  isDelightful?: boolean
  selectedViewId?: string
  currentViewState?: ResponsesViewState
} = {}) => {
  mockIsDelightful = isDelightful
  mockContext = {
    visibleSubmissionIds: undefined,
    isFullyLoaded: false,
    columnFilters: currentViewState.columnFilters,
    sortColumnId: currentViewState.sortColumnId,
    sortDirection: currentViewState.sortDirection,
    hiddenColumnIds: currentViewState.hiddenColumnIds,
    columnOptions: COLUMN_OPTIONS,
    isShowingRecentOnly: false,
    savedViews: [VIEW],
    selectedViewId,
    currentViewState,
  }
  render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[`/admin/form/${FORM_ID}/results`]}>
        <Routes>
          <Route
            path="/admin/form/:formId/results"
            element={<DownloadButton />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  )
}

const startDownload = async (formatLabel: RegExp) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /download/i }))
  await user.click(await screen.findByRole('checkbox', { name: formatLabel }))
  await user.click(screen.getByRole('button', { name: /start download|next/i }))
  const confirm = screen.queryByRole('button', { name: 'Confirm download' })
  if (confirm) await user.click(confirm)
}

describe('DownloadButton analytics events', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))
  beforeEach(() => vi.clearAllMocks())

  it('logs a v1 CSV download with no saved view', async () => {
    renderButton({ isDelightful: false, selectedViewId: VIEW._id })

    await startDownload(/csv/i)

    expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(FORM_ID, {
      type: AnalyticsEventType.ResultsDownload,
      content: {
        dashboardVersion: 'v1',
        formats: ['csv'],
        scope: 'bulk',
        responsesCount: 12,
      },
    })
    expect(mockMutate).toHaveBeenCalled()
  })

  it('logs a v2 download from an unchanged saved view', async () => {
    renderButton({ selectedViewId: VIEW._id })

    await startDownload(/pdf/i)

    expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(FORM_ID, {
      type: AnalyticsEventType.ResultsDownload,
      content: {
        dashboardVersion: 'v2',
        formats: ['pdf'],
        scope: 'bulk',
        savedViewId: VIEW._id,
        isSavedViewModified: false,
        responsesCount: 12,
      },
    })
  })

  it('marks a v2 download from an edited saved view as modified', async () => {
    renderButton({
      selectedViewId: VIEW._id,
      currentViewState: { ...VIEW_STATE, hiddenColumnIds: ['b'] },
    })

    await startDownload(/pdf/i)

    expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(
      FORM_ID,
      expect.objectContaining({
        content: expect.objectContaining({
          savedViewId: VIEW._id,
          isSavedViewModified: true,
        }),
      }),
    )
  })

  it('logs a v2 download from All responses without a saved view', async () => {
    renderButton()

    await startDownload(/pdf/i)

    expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(
      FORM_ID,
      expect.objectContaining({
        content: expect.not.objectContaining({
          savedViewId: expect.anything(),
        }),
      }),
    )
  })
})
