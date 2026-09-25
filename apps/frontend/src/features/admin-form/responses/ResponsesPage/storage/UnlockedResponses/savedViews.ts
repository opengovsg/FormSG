import {
  DateString,
  FormSavedView,
  FormSavedViewInput,
  SavedViewSortDirection,
} from 'formsg-shared/types'

import { ResponseColumnOption } from './UnlockedResponsesProvider'

export interface ResponsesViewState {
  dateRange: DateString[]
  searchText: string
  excludedSearchColumnIds: string[]
  hiddenColumnIds: string[]
  sortColumnId?: string
  sortDirection: SavedViewSortDirection
}

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

  const searchColumnIds = known(view.filter.searchColumnIds)
  const columnIds = known(view.columnIds)
  const sortColumnId =
    view.sort && allIds.includes(view.sort.columnId)
      ? view.sort.columnId
      : undefined

  return {
    dateRange:
      view.filter.startDate && view.filter.endDate
        ? [view.filter.startDate, view.filter.endDate]
        : [],
    searchText: view.filter.searchText ?? '',
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
