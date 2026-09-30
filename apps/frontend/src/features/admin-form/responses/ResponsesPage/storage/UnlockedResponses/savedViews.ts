import { isEqual } from 'lodash'

import {
  DateString,
  FormSavedView,
  FormSavedViewInput,
  SavedViewSortDirection,
} from 'formsg-shared/types'

import { ResponseColumnOption } from './UnlockedResponsesProvider'

export const RESPONSE_NUMBER_COLUMN_ID = 'number'

export interface ResponsesViewState {
  dateRange: DateString[]
  searchText: string
  excludedSearchColumnIds: string[]
  hiddenColumnIds: string[]
  sortColumnId?: string
  sortDirection: SavedViewSortDirection
}

export const normaliseSort = (
  columnId: string | undefined,
  direction: SavedViewSortDirection,
): Pick<ResponsesViewState, 'sortColumnId' | 'sortDirection'> => ({
  sortColumnId:
    columnId === RESPONSE_NUMBER_COLUMN_ID &&
    direction === SavedViewSortDirection.Descending
      ? undefined
      : columnId,
  sortDirection: direction,
})

export const hasActiveViewState = ({
  dateRange,
  searchText,
  excludedSearchColumnIds,
  hiddenColumnIds,
  sortColumnId,
}: ResponsesViewState): boolean =>
  dateRange.length > 0 ||
  searchText.trim().length > 0 ||
  excludedSearchColumnIds.length > 0 ||
  hiddenColumnIds.length > 0 ||
  !!sortColumnId

/**
 * Inclusion lists are stored so a view means "these columns", and an omitted
 * list means the view placed no constraint.
 */
export const toSavedViewInput = (
  name: string,
  state: ResponsesViewState,
  columnOptions: ResponseColumnOption[],
): FormSavedViewInput => {
  const allIds = columnOptions.map(({ id }) => id)
  const [startDate, endDate] = state.dateRange
  const searchColumnIds = allIds.filter(
    (id) => !state.excludedSearchColumnIds.includes(id),
  )
  const columnIds = allIds.filter((id) => !state.hiddenColumnIds.includes(id))

  return {
    name,
    filter: {
      ...(startDate && endDate ? { startDate, endDate } : {}),
      ...(state.searchText.trim() ? { searchText: state.searchText } : {}),
      ...(state.excludedSearchColumnIds.length ? { searchColumnIds } : {}),
    },
    ...(state.sortColumnId
      ? {
          sort: {
            columnId: state.sortColumnId,
            direction: state.sortDirection,
          },
        }
      : {}),
    ...(state.hiddenColumnIds.length ? { columnIds } : {}),
  }
}

/**
 * Ids that no longer match a column are dropped, so a view outlives the fields
 * it was saved against.
 */
export const fromSavedView = (
  view: FormSavedView,
  columnOptions: ResponseColumnOption[],
): ResponsesViewState => {
  const allIds = columnOptions.map(({ id }) => id)
  const known = (ids?: string[]) =>
    ids ? ids.filter((id) => allIds.includes(id)) : undefined

  const filter = view.filter ?? {}
  const searchColumnIds = known(filter.searchColumnIds)
  const columnIds = known(view.columnIds)
  const sortColumnId =
    view.sort &&
    (allIds.includes(view.sort.columnId) ||
      view.sort.columnId === RESPONSE_NUMBER_COLUMN_ID)
      ? view.sort.columnId
      : undefined

  return {
    dateRange:
      filter.startDate && filter.endDate
        ? [filter.startDate, filter.endDate]
        : [],
    searchText: filter.searchText ?? '',
    excludedSearchColumnIds: searchColumnIds
      ? allIds.filter((id) => !searchColumnIds.includes(id))
      : [],
    hiddenColumnIds: columnIds
      ? allIds.filter((id) => !columnIds.includes(id))
      : [],
    sortColumnId,
    sortDirection: view.sort?.direction ?? SavedViewSortDirection.Descending,
  }
}

export const matchesSavedView = (
  state: ResponsesViewState,
  savedViews: FormSavedView[],
  columnOptions: ResponseColumnOption[],
): boolean => {
  const current = toSavedViewInput('', state, columnOptions)
  return savedViews.some((view) =>
    isEqual(
      toSavedViewInput('', fromSavedView(view, columnOptions), columnOptions),
      current,
    ),
  )
}
