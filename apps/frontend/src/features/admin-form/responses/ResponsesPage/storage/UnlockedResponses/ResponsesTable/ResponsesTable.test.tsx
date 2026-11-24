import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'

import { SavedViewColumnFilter, SubmissionMetadata } from 'formsg-shared/types'

import { theme } from '~theme/index'

import { ResponsesTable } from './ResponsesTable'

const form = {
  form_fields: [],
  responseMode: 'encrypt',
  payments_field: { enabled: false },
}
const metadata = Array.from({ length: 125 }, (_, index) => ({
  refNo: `matching-${index}`,
  number: index + 1,
  submissionTime: '1 Jan 2026',
})) as SubmissionMetadata[]
const reportMatchingCount = vi.fn()
let scope: object = {}
let columnFilters: SavedViewColumnFilter[] = []
const callbacks = {
  setColumnOptions: vi.fn(),
  setRenderedRowCount: vi.fn(),
  setVisibleSubmissionIds: vi.fn(),
  onRowClick: vi.fn(),
}
const hiddenColumnIds: string[] = []
const decrypted = new Map()
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }))
vi.mock('@growthbook/growthbook-react', () => ({ useFeatureIsOn: () => true }))
vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: form }),
}))
vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => true,
}))
vi.mock('~features/admin-form/responses/queries', () => ({
  useDecryptedResponsesBySubmissionId: () => ({
    data: decrypted,
    isFetching: false,
  }),
}))
vi.mock('../hooks/useColumnVirtualizer', () => ({
  useColumnVirtualizer: () => ({
    tableRef: { current: null },
    columnWindow: {
      startIndex: 0,
      endIndex: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  }),
}))
vi.mock('../UnlockedResponsesProvider', () => ({
  useUnlockedResponses: () => ({
    ...callbacks,
    metadata,
    filteredMetadata: metadata,
    isInfiniteScroll: true,
    hiddenColumnIds,
    columnFilters,
    reportMatchingCount,
    responseCountScope: scope,
    renderLimit: 100,
    isTableLoading: false,
    sortDirection: 'desc',
  }),
}))

const table = () => (
  <ChakraProvider theme={theme}>
    <ResponsesTable />
  </ChakraProvider>
)

describe('matching row count reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    scope = {}
    columnFilters = [{ columnId: 'refNo', text: 'matching' }]
  })

  it('counts every match before the rendered row limit', () => {
    render(table())
    expect(screen.getAllByTestId(/^response-row-/)).toHaveLength(100)
    expect(reportMatchingCount).toHaveBeenLastCalledWith({ scope, count: 125 })
  })

  it('never labels rows filtered with old inputs as the new scope', () => {
    const { rerender } = render(table())
    reportMatchingCount.mockClear()
    scope = {}
    columnFilters = [{ columnId: 'refNo', text: 'no-match' }]
    rerender(table())
    expect(screen.queryAllByTestId(/^response-row-/)).toHaveLength(0)
    expect(reportMatchingCount).toHaveBeenCalledTimes(1)
    expect(reportMatchingCount).toHaveBeenLastCalledWith({ scope, count: 0 })
  })
})
