import { FormSavedView, SavedViewSortDirection } from 'formsg-shared/types'

import { matchesSavedView, ResponsesViewState } from './savedViews'

const COLUMN_OPTIONS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]

const STATE: ResponsesViewState = {
  dateRange: [],
  searchText: 'pending',
  excludedSearchColumnIds: [],
  hiddenColumnIds: ['c', 'a'],
  sortColumnId: 'b',
  sortDirection: SavedViewSortDirection.Ascending,
}

const VIEW: FormSavedView = {
  _id: 'view-1',
  name: 'Pending',
  filter: { searchText: 'pending' },
  sort: { columnId: 'b', direction: SavedViewSortDirection.Ascending },
  columnIds: ['b'],
}

describe('matchesSavedView', () => {
  it('matches the view the state was saved as, whatever order columns were hidden in', () => {
    expect(matchesSavedView(STATE, [VIEW], COLUMN_OPTIONS)).toBe(true)
  })

  it('stops matching once the state is changed', () => {
    expect(
      matchesSavedView(
        { ...STATE, sortDirection: SavedViewSortDirection.Descending },
        [VIEW],
        COLUMN_OPTIONS,
      ),
    ).toBe(false)
    expect(
      matchesSavedView(
        { ...STATE, hiddenColumnIds: ['c'] },
        [VIEW],
        COLUMN_OPTIONS,
      ),
    ).toBe(false)
  })

  it('reads a view stored without a filter', () => {
    const view: FormSavedView = {
      _id: 'view-2',
      name: 'Columns',
      columnIds: ['b'],
    }
    expect(
      matchesSavedView(
        { ...STATE, searchText: '', sortColumnId: undefined },
        [view],
        COLUMN_OPTIONS,
      ),
    ).toBe(true)
  })

  it('matches nothing when there are no saved views', () => {
    expect(matchesSavedView(STATE, [], COLUMN_OPTIONS)).toBe(false)
  })
})
