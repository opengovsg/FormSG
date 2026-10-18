import {
  CSSProperties,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  CellProps,
  Column,
  Row,
  useFlexLayout,
  useGlobalFilter,
  usePagination,
  useResizeColumns,
  useSortBy,
  useTable,
} from 'react-table'
import {
  Box,
  Flex,
  Skeleton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import {
  FormResponseMode,
  SavedViewColumnFilter,
  SubmissionMetadata,
} from 'formsg-shared/types'
import { centsToDollars } from 'formsg-shared/utils/payments'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  formatResponseForCell,
  isDescribedFieldType,
} from '~features/admin-form/responses/common/utils/formatResponseForCell'
import {
  getPendingResponseAtString,
  getWorkflowStatusText,
  hasWorkflowSteps,
  hasWorkflowSubmission,
  MRF_STATUS,
} from '~features/admin-form/responses/common/utils/mrfSubmissionView'
import { getFieldColumnHeader } from '~features/admin-form/responses/common/utils/questionLabel'
import { matchesColumnFilters } from '~features/admin-form/responses/common/utils/responseSearch'
import { WorkflowStatusBadge } from '~features/admin-form/responses/components/WorkflowStatusBadge'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_REMINDERS_LABEL,
  MRF_RESPONSE_TIMESTAMP_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'
import { useDecryptedResponsesBySubmissionId } from '~features/admin-form/responses/queries'

import {
  EXPORT_FEES_COLUMN_ID,
  EXPORT_PAID_AMOUNT_COLUMN_ID,
  EXPORT_PAYER_EMAIL_COLUMN_ID,
  EXPORT_PAYOUT_DATE_COLUMN_ID,
  EXPORT_PENDING_RESPONSE_AT_COLUMN_ID,
  EXPORT_WORKFLOW_STATUS_COLUMN_ID,
} from '../../utils/csvExportView'
import { useColumnVirtualizer } from '../hooks/useColumnVirtualizer'
import { RESPONSE_NUMBER_COLUMN_ID } from '../savedViews'
import { useUnlockedResponses } from '../UnlockedResponsesProvider'

import { SendReminderButton } from './SendReminderButton'
import {
  FieldColumnSource,
  getFieldColumnSources,
  getIsPaymentsForm,
  getNetAmount,
  getReminderButtonState,
} from './utils'

type ResponseColumnData = SubmissionMetadata

const byServerOrder = (
  rowA: Row<ResponseColumnData>,
  rowB: Row<ResponseColumnData>,
) => rowB.index - rowA.index

const BASE_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: 'number',
    width: 80, // width is used for both the flex-basis and flex-grow
    minWidth: 80, // minWidth is only used as a limit for resizing
    maxWidth: 100, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Response ID',
    accessor: 'refNo',
    width: 300,
    minWidth: 300,
    maxWidth: 300,
  },
  {
    Header: 'Timestamp',
    accessor: 'submissionTime',
    sortType: byServerOrder,
    width: 250,
    minWidth: 250,
  },
]

const PAYMENT_COLUMNS: Column<ResponseColumnData>[] = [
  {
    id: EXPORT_PAYER_EMAIL_COLUMN_ID,
    Header: 'Email',
    accessor: ({ payments }) => {
      if (!payments?.email) {
        return ''
      }
      return payments.email
    },
    minWidth: 250,
    width: 250,
  },

  {
    id: EXPORT_PAID_AMOUNT_COLUMN_ID,
    Header: 'Paid Amount (S$)', //  (amt responder paid)
    accessor: ({ payments }) => {
      if (!payments) {
        return ''
      }
      return `${centsToDollars(payments.paymentAmt)}`
    },
    minWidth: 150,
    width: 150,
  },

  {
    id: EXPORT_FEES_COLUMN_ID,
    Header: 'Fees (S$)', //  (paid - net)
    accessor: ({ payments }) => {
      if (!payments?.transactionFee) {
        return ''
      }
      if (payments.transactionFee < 0) {
        return ''
      }

      return `${centsToDollars(payments.transactionFee)}`
    },
    minWidth: 150,
    width: 150,
  },

  {
    Header: 'Net Amount (S$)', //  (amt they receive in bank)
    accessor: ({ payments }) => getNetAmount(payments),
    minWidth: 150,
    width: 150,
  },

  {
    id: EXPORT_PAYOUT_DATE_COLUMN_ID,
    Header: 'Payout Date',
    accessor: ({ payments }) => {
      if (!payments) {
        return 'Pending'
      }
      return payments.payoutDate
    },
    minWidth: 200,
    width: 200,
    disableResizing: true,
  },
]

const MRF_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: 'number',
    width: 80,
    minWidth: 80,
    maxWidth: 100,
  },
  {
    Header: 'Response ID',
    accessor: 'refNo',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
  },
  {
    id: EXPORT_WORKFLOW_STATUS_COLUMN_ID,
    Header: MRF_WORKFLOW_STATUS_LABEL,
    // RATIONALE: the accessor returns text so search and sort can read the
    // status, matching the CSV export; the Cell turns it back into a badge.
    accessor: ({ mrf }) => getWorkflowStatusText(mrf),
    Cell: ({ value }: CellProps<ResponseColumnData, MRF_STATUS | ''>) =>
      value ? <WorkflowStatusBadge status={value} /> : null,
    width: 160,
    minWidth: 160,
    maxWidth: 160,
  },
  {
    id: EXPORT_PENDING_RESPONSE_AT_COLUMN_ID,
    Header: MRF_PENDING_RESPONSE_AT_LABEL,
    accessor: ({ mrf }) => {
      if (mrf?.stoppedAt) return '-'
      const workflowStatus = mrf?.workflowStatus
      const workflowCurrentStepNumber = mrf?.workflowCurrentStepNumber
      const workflowNumTotalSteps = mrf?.workflowNumTotalSteps
      if (
        workflowStatus === undefined ||
        workflowCurrentStepNumber === undefined ||
        workflowNumTotalSteps === undefined
      ) {
        return ''
      }
      return getPendingResponseAtString({
        workflowStatus,
        workflowCurrentStepNumber,
        workflowNumTotalSteps,
      })
    },
    width: 180,
    minWidth: 180,
    maxWidth: 180,
  },
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    accessor: 'submissionTime',
    sortType: byServerOrder,
    // TODO(FRM-1933): using submissionTime as we are undecided on showing first submission vs lastSubmittedAt
    // accessor: ({ mrf }) =>
    //   mrf?.lastSubmittedAt
    //     ? formatInTimeZone(
    //         mrf.lastSubmittedAt,
    //         'Asia/Singapore',
    //         'do MMM yyyy, hh:mm:ss a',
    //       )
    //     : '',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
  },
  {
    Header: MRF_REMINDERS_LABEL,
    Cell: ({ row }) => {
      const reminderButtonState = getReminderButtonState(row.original.mrf)
      return reminderButtonState === 'hidden' ? null : (
        <SendReminderButton
          submissionId={row.original.refNo}
          isDisabled={reminderButtonState === 'disabled'}
        />
      )
    },
    minWidth: 160,
    width: 160,
  },
]

const PAYMENT_RESPONSE_TABLE_COLUMNS =
  BASE_RESPONSE_TABLE_COLUMNS.concat(PAYMENT_COLUMNS)

const WORKFLOW_PREFIX_COLUMNS = MRF_RESPONSE_TABLE_COLUMNS.filter(
  ({ Header }) => Header !== MRF_REMINDERS_LABEL,
)

const SingleLineCell = ({ value }: CellProps<ResponseColumnData>) => (
  <Text noOfLines={1} title={String(value ?? '')}>
    {value}
  </Text>
)

const NO_WORKFLOW_PREFIX_COLUMNS: Column<ResponseColumnData>[] = [
  BASE_RESPONSE_TABLE_COLUMNS[0],
  {
    ...BASE_RESPONSE_TABLE_COLUMNS[1],
    Cell: SingleLineCell,
    minWidth: 240,
    maxWidth: 400,
  },
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    Cell: SingleLineCell,
    accessor: 'submissionTime',
    sortType: byServerOrder,
    width: 250,
    minWidth: 200,
    maxWidth: 400,
  },
]

const SKELETON_ROW_COUNT = 10

// Columns held either side of the viewport, so a drag has a buffer to eat
// before it reaches the spacer.
const COLUMN_OVERSCAN = 6

const FIELD_COLUMN_WIDTH = 200
/** Matches the px on a Td, so the drawn cells sit where real ones would. */
const CELL_PADDING_PX = 16
const SKELETON_CELL_HEIGHT = '1rem'
const ROW_HEIGHT = '2.75rem'

const TABLE_SCROLLBAR_SX = {
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'neutral.200',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'neutral.400',
    borderRadius: '4px',
    '&:hover': {
      background: 'neutral.500',
    },
  },
}

// react-table derives an id from an explicit id, then a string accessor, then
// a string Header.
const getColumnId = (column: Column<ResponseColumnData>): string =>
  column.id ??
  (typeof column.accessor === 'string' ? column.accessor : undefined) ??
  String(column.Header)

export const ResponsesTable = () => {
  const { data: form } = useAdminForm()
  const isPaymentsForm = getIsPaymentsForm(form)
  const isMultiRespondentForm =
    form?.responseMode === FormResponseMode.Multirespondent

  const {
    currentPage: currentPage1Indexed,
    metadata,
    filteredMetadata,
    submissionId,
    onRowClick,
    isInfiniteScroll,
    setColumnOptions,
    hiddenColumnIds,
    columnFilters,
    setFilterResultCount,
    renderLimit,
    setRenderedRowCount,
    isTableLoading,
    sortColumnId,
    sortDirection,
    setVisibleSubmissionIds,
  } = useUnlockedResponses()
  const isDelightfulDashboard = useIsDelightfulDashboard()
  const { t } = useTranslation()
  const verifiedLabel = t('features.common.verified')

  const { data: responsesBySubmissionId, isFetching: isDecrypting } =
    useDecryptedResponsesBySubmissionId({ enabled: isDelightfulDashboard })

  const navigate = useNavigate()

  const currentPage = useMemo(
    () => (currentPage1Indexed ?? 1) - 1,
    [currentPage1Indexed],
  )

  const hasWorkflow = useMemo(
    () => hasWorkflowSteps(form) && hasWorkflowSubmission(metadata),
    [form, metadata],
  )

  const isWorkflowActionsOn = useFeatureIsOn(featureFlags.workflowActions)

  const metadataToUse = useMemo(() => {
    const rows = submissionId ? filteredMetadata : metadata
    if (isWorkflowActionsOn) return rows
    return rows.map((row) =>
      row.mrf?.stoppedAt
        ? { ...row, mrf: { ...row.mrf, stoppedAt: undefined } }
        : row,
    )
  }, [filteredMetadata, metadata, submissionId, isWorkflowActionsOn])

  const legacyColumns = useMemo(() => {
    if (isMultiRespondentForm) {
      return isPaymentsForm
        ? MRF_RESPONSE_TABLE_COLUMNS.concat(PAYMENT_COLUMNS)
        : MRF_RESPONSE_TABLE_COLUMNS
    }
    if (isPaymentsForm) {
      return PAYMENT_RESPONSE_TABLE_COLUMNS
    }
    return BASE_RESPONSE_TABLE_COLUMNS
  }, [isMultiRespondentForm, isPaymentsForm])

  const fieldColumnSources = useMemo(() => {
    if (!isDelightfulDashboard || !form) return []
    return getFieldColumnSources({
      formFields: form.form_fields,
      responsesBySubmissionId,
      submissionIdsNewestFirst: metadata.map(({ refNo }) => refNo),
    })
  }, [form, isDelightfulDashboard, metadata, responsesBySubmissionId])

  // A field still on the form is labelled as the drawer labels it; a deleted
  // field keeps the question its newest response stored, prefix included.
  const getFieldColumnLabel = useCallback(
    (source: FieldColumnSource) => {
      const formField = form?.form_fields.find(({ _id }) => _id === source.id)
      return formField
        ? getFieldColumnHeader(formField, verifiedLabel)
        : source.title
    },
    [form, verifiedLabel],
  )

  const prefixColumns = useMemo(() => {
    if (hasWorkflow) return WORKFLOW_PREFIX_COLUMNS
    return isPaymentsForm
      ? NO_WORKFLOW_PREFIX_COLUMNS.concat(PAYMENT_COLUMNS)
      : NO_WORKFLOW_PREFIX_COLUMNS
  }, [hasWorkflow, isPaymentsForm])

  const fieldColumns = useMemo((): Column<ResponseColumnData>[] => {
    return fieldColumnSources.map((formField) => ({
      id: formField.id,
      Header: getFieldColumnLabel(formField),
      accessor: ({ refNo }: ResponseColumnData) => {
        const responses = responsesBySubmissionId?.get(refNo)
        if (!responses) return undefined
        return formatResponseForCell(
          responses.find((response) => response._id === formField.id),
        )
      },
      Cell: ({ value }: { value?: string }) => (
        <Skeleton isLoaded={value !== undefined || !isDecrypting} w="100%">
          <Text
            noOfLines={1}
            title={value}
            fontStyle={
              isDescribedFieldType(formField.fieldType) ? 'italic' : undefined
            }
          >
            {value ?? ''}
          </Text>
        </Skeleton>
      ),
      width: FIELD_COLUMN_WIDTH,
      minWidth: 120,
      maxWidth: 400,
    }))
  }, [
    fieldColumnSources,
    getFieldColumnLabel,
    isDecrypting,
    responsesBySubmissionId,
  ])

  const columns = useMemo(() => {
    if (!isDelightfulDashboard) return legacyColumns
    return prefixColumns.concat(fieldColumns)
  }, [fieldColumns, isDelightfulDashboard, legacyColumns, prefixColumns])

  // RATIONALE: react-table's global filter carries the column filters, as its
  // per-column filters would each need wiring to a header control we do not
  // render.
  const globalFilter = useCallback(
    (
      rowsToFilter: Row<ResponseColumnData>[],
      _columnIds: string[],
      filters: SavedViewColumnFilter[],
    ) =>
      filters.length
        ? rowsToFilter.filter((row) =>
            matchesColumnFilters((columnId) => {
              const value = row.values[columnId]
              return typeof value === 'string' ? value : undefined
            }, filters),
          )
        : rowsToFilter,
    [],
  )

  const columnOptions = useMemo(() => {
    if (!isDelightfulDashboard) return []
    return prefixColumns
      .map((column) => ({
        id: getColumnId(column),
        label: String(column.Header),
      }))
      .filter(({ id }) => id !== RESPONSE_NUMBER_COLUMN_ID)
      .concat(
        fieldColumnSources.map((source) => ({
          id: source.id,
          label: getFieldColumnLabel(source),
        })),
      )
  }, [
    fieldColumnSources,
    getFieldColumnLabel,
    isDelightfulDashboard,
    prefixColumns,
  ])

  useEffect(() => {
    setColumnOptions(columnOptions)
  }, [columnOptions, setColumnOptions])

  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    gotoPage,
    setHiddenColumns,
    setGlobalFilter,
    setSortBy,
    visibleColumns,
    state: { columnResizing },
  } = useTable<ResponseColumnData>(
    {
      columns,
      data: metadataToUse,
      // The columns array is rebuilt as answers decrypt; without this the
      // reset would undo the admin's column choices every few hundred ms.
      autoResetHiddenColumns: false,
      autoResetGlobalFilter: false,
      autoResetSortBy: false,
      globalFilter,
      // Server side pagination.
      manualPagination: true,
      pageCount: currentPage,
      initialState: {
        pageIndex: currentPage,
        pageSize: 10,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useResizeColumns,
    useFlexLayout,
  )

  useEffect(() => {
    if (isInfiniteScroll) return
    gotoPage(currentPage)
  }, [currentPage, gotoPage, isInfiniteScroll])

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setHiddenColumns(hiddenColumnIds)
  }, [hiddenColumnIds, isDelightfulDashboard, setHiddenColumns])

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setGlobalFilter(columnFilters)
  }, [columnFilters, isDelightfulDashboard, setGlobalFilter])

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setSortBy(
      sortColumnId
        ? [{ id: sortColumnId, desc: sortDirection === 'desc' }]
        : [],
    )
  }, [isDelightfulDashboard, setSortBy, sortColumnId, sortDirection])

  const columnWidthsKey = visibleColumns
    .map((column) => column.totalWidth || Number(column.width) || 0)
    .join(',')
  const columnWidths = useMemo(
    () => (columnWidthsKey ? columnWidthsKey.split(',').map(Number) : []),
    [columnWidthsKey],
  )

  // Without real widths every column measures as outside the viewport, so the
  // safe reading of an unmeasured table is to render all of it.
  const isColumnVirtualized =
    isDelightfulDashboard &&
    columnWidths.reduce((total, width) => total + width, 0) > 0

  const { tableRef, columnWindow } = useColumnVirtualizer<HTMLDivElement>({
    columnWidths,
    enabled: isColumnVirtualized,
    overscan: COLUMN_OVERSCAN,
  })

  const hasColumnWindow =
    isColumnVirtualized && columnWindow.endIndex > columnWindow.startIndex

  const sliceToWindow = useCallback(
    <TItem,>(items: TItem[]): TItem[] =>
      hasColumnWindow
        ? items.slice(columnWindow.startIndex, columnWindow.endIndex)
        : items,
    [columnWindow.endIndex, columnWindow.startIndex, hasColumnWindow],
  )

  // Scrolling outruns the window by a frame, so the spacer is what the admin
  // sees at the edge of a fast drag, and it should read as cells not yet here.
  // Drawn as a repeating background rather than one element per hidden column,
  // which would cost exactly what the window is there to avoid. Anchored to the
  // edge the real columns are on, so the pattern lines up with them.
  const columnSpacer = (width: number, anchor: 'left' | 'right') =>
    hasColumnWindow && width > 0 ? (
      <Box
        flexShrink={0}
        w={`${width}px`}
        backgroundRepeat="no-repeat"
        backgroundPosition={`${anchor} center`}
        backgroundSize={`100% ${SKELETON_CELL_HEIGHT}`}
        backgroundImage={`repeating-linear-gradient(to ${anchor}, transparent 0 ${CELL_PADDING_PX}px, var(--chakra-colors-neutral-300) ${CELL_PADDING_PX}px ${FIELD_COLUMN_WIDTH - CELL_PADDING_PX}px, transparent ${FIELD_COLUMN_WIDTH - CELL_PADDING_PX}px ${FIELD_COLUMN_WIDTH}px)`}
      />
    ) : null

  const leftSpacer = columnSpacer(columnWindow.paddingLeft, 'right')
  const rightSpacer = columnSpacer(columnWindow.paddingRight, 'left')

  const visibleRows = useMemo(
    () => (isInfiniteScroll ? rows.slice(0, renderLimit) : page),
    [isInfiniteScroll, page, renderLimit, rows],
  )

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setFilterResultCount(columnFilters.length ? rows.length : undefined)
  }, [
    columnFilters.length,
    isDelightfulDashboard,
    rows.length,
    setFilterResultCount,
  ])

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setVisibleSubmissionIds(rows.map((row) => row.original.refNo))
  }, [isDelightfulDashboard, rows, setVisibleSubmissionIds])

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setRenderedRowCount(rows.length)
  }, [isDelightfulDashboard, rows.length, setRenderedRowCount])

  const columnWidthVars = Object.fromEntries([
    ...visibleColumns.flatMap((column, index) => [
      [`--col-${index}-width`, `${column.totalWidth}px`],
      [
        `--col-${index}-grow`,
        String((column as { totalFlexWidth?: number }).totalFlexWidth ?? 0),
      ],
    ]),
    [
      '--row-width',
      `${visibleColumns.reduce((total, column) => total + column.totalWidth, 0)}px`,
    ],
  ]) as CSSProperties

  const columnIndexById = useMemo(
    () => new Map(visibleColumns.map((column, index) => [column.id, index])),
    [visibleColumns],
  )

  const withLiveWidth = useCallback(
    (columnId: string, style?: CSSProperties): CSSProperties | undefined => {
      if (!isDelightfulDashboard) return style
      const index = columnIndexById.get(columnId)
      if (index === undefined) return style
      return {
        ...style,
        width: `var(--col-${index}-width)`,
        flex: `var(--col-${index}-grow) 0 auto`,
      }
    },
    [columnIndexById, isDelightfulDashboard],
  )

  const handleRowClick = useCallback(
    (submissionId: string, responseNumber: number) => {
      onRowClick()
      return navigate(submissionId, {
        state: {
          responseNumber,
        },
      })
    },
    [navigate, onRowClick],
  )

  const headerViewportRef = useRef<HTMLDivElement>(null)
  const syncHeaderScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    if (headerViewportRef.current) {
      headerViewportRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }, [])

  const frozenBodyRef = useRef<JSX.Element | null>(null)
  const isResizingColumn = !!columnResizing.isResizingColumn
  const renderTableBody = () => (
    <Tbody as="div" {...getTableBodyProps()}>
      {isDelightfulDashboard && isTableLoading
        ? Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <Tr as="div" key={`skeleton-${index}`} display="flex" minW="100%">
              {leftSpacer}
              {sliceToWindow(visibleColumns).map((column) => (
                <Td
                  as="div"
                  {...column.getHeaderProps()}
                  style={withLiveWidth(
                    column.id,
                    column.getHeaderProps().style,
                  )}
                  key={column.id}
                  display="flex"
                  alignItems="center"
                  h={ROW_HEIGHT}
                  py={0}
                  minW={0}
                  flexShrink={0}
                  overflow="hidden"
                >
                  <Skeleton h={SKELETON_CELL_HEIGHT} w="100%" />
                </Td>
              ))}
              {rightSpacer}
            </Tr>
          ))
        : null}
      {isDelightfulDashboard && isTableLoading
        ? null
        : visibleRows.map((row) => {
            prepareRow(row)
            return (
              <Tr
                as="div"
                {...row.getRowProps()}
                key={row.getRowProps().key}
                px={0}
                onClick={() =>
                  handleRowClick(row.values.refNo, row.values.number)
                }
                cursor="pointer"
                display="flex"
                minW="100%"
                role="group"
                {...(isDelightfulDashboard
                  ? {
                      style: {
                        ...row.getRowProps().style,
                        minWidth: 'var(--row-width)',
                      },
                      sx: {
                        contentVisibility: 'auto',
                        containIntrinsicHeight: ROW_HEIGHT,
                      },
                    }
                  : {})}
              >
                {leftSpacer}
                {sliceToWindow(row.cells).map((cell) => {
                  return (
                    <Td
                      as="div"
                      {...cell.getCellProps()}
                      style={withLiveWidth(
                        cell.column.id,
                        cell.getCellProps().style,
                      )}
                      key={cell.getCellProps().key}
                      display="flex"
                      alignItems="center"
                      minW={0}
                      flexShrink={0}
                      overflow="hidden"
                      transitionProperty="background"
                      transitionDuration="normal"
                      _groupHover={{ bg: 'primary.100' }}
                      _groupActive={{ bg: 'primary.200' }}
                      h={ROW_HEIGHT}
                      py={0}
                    >
                      {cell.render('Cell')}
                    </Td>
                  )
                })}
                {rightSpacer}
              </Tr>
            )
          })}
    </Tbody>
  )
  const tableBody =
    isDelightfulDashboard && isResizingColumn && frozenBodyRef.current
      ? frozenBodyRef.current
      : renderTableBody()
  frozenBodyRef.current = tableBody

  const tableHeader = (
    <Thead
      as="div"
      pos="sticky"
      top={0}
      {...(isDelightfulDashboard
        ? { ref: headerViewportRef, zIndex: 1, overflow: 'hidden' }
        : {})}
    >
      {headerGroups.map((headerGroup) => (
        <Tr
          as="div"
          {...headerGroup.getHeaderGroupProps()}
          key={headerGroup.getHeaderGroupProps().key}
          {...(isDelightfulDashboard
            ? {
                style: {
                  ...headerGroup.getHeaderGroupProps().style,
                  minWidth: 'var(--row-width)',
                },
              }
            : {})}
          // To toggle _groupHover styles to show divider when header is hovered.
          data-group
        >
          {headerGroup.headers.map((column) => (
            <Th
              as="div"
              pos="relative"
              {...column.getHeaderProps()}
              key={column.getHeaderProps().key}
              minW={0}
              flexShrink={0}
              overflow="hidden"
            >
              <Flex align="center">{column.render('Header')}</Flex>

              {column.disableResizing ? null : (
                <Flex
                  {...column.getResizerProps()}
                  justify="center"
                  top={0}
                  right={0}
                  zIndex={2}
                  transitionProperty="background"
                  transitionDuration="normal"
                  pos="absolute"
                  h="100%"
                  borderX="8px solid"
                  borderColor="secondary.500"
                  _hover={{
                    bg: column.isResizing ? 'white' : 'secondary.200',
                  }}
                  _groupHover={{
                    bg: column.isResizing ? 'white' : 'secondary.300',
                    _hover: {
                      bg: column.isResizing ? 'white' : 'secondary.200',
                    },
                  }}
                  w="17px"
                  sx={{
                    touchAction: 'none',
                  }}
                />
              )}
            </Th>
          ))}
        </Tr>
      ))}
    </Thead>
  )

  if (isDelightfulDashboard) {
    // RATIONALE: an element with overflow-x: auto is also a scroll container
    // vertically, and it is what position: sticky sticks to. Wrapping the whole
    // table in the horizontal scroller pinned the header to a box that never
    // scrolls vertically, so it left with the page. Here only the body scrolls
    // sideways; the header sits outside that box and sticks to the page
    // scroller (FormResultsLayout), clipping its own overflow and following the
    // body's scrollLeft so the columns stay aligned.
    return (
      <Table
        as="div"
        variant="solid"
        colorScheme="secondary"
        {...getTableProps()}
        w="100%"
        // Not the flex layout's minWidth: the table must stay as wide as the
        // page so the body, not the page, is what scrolls sideways.
        style={columnWidthVars}
      >
        {tableHeader}
        <Box
          overflowX="auto"
          onScroll={syncHeaderScroll}
          sx={TABLE_SCROLLBAR_SX}
        >
          {/* Inside the scroller, as the column virtualizer looks for it
              among the ancestors of tableRef. */}
          <Box ref={tableRef}>{tableBody}</Box>
        </Box>
      </Table>
    )
  }

  return (
    <Table
      as="div"
      ref={tableRef}
      variant="solid"
      colorScheme="secondary"
      {...getTableProps()}
      minW="fit-content"
      w="100%"
    >
      {tableHeader}
      {tableBody}
    </Table>
  )
}
