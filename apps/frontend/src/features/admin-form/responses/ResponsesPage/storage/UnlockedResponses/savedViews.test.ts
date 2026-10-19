import { FormSavedView, SavedViewSortDirection } from 'formsg-shared/types'

import {
  fromSavedView,
  matchesSavedView,
  normaliseSort,
  RESPONSE_NUMBER_COLUMN_ID,
  ResponsesViewState,
  toSavedViewInput,
  withColumnFilter,
} from './savedViews'

const COLUMN_OPTIONS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]

const STATE: ResponsesViewState = {
  dateRange: [],
  columnFilters: [{ columnId: 'a', text: 'pending' }],
  hiddenColumnIds: ['c', 'a'],
  sortColumnId: 'b',
  sortDirection: SavedViewSortDirection.Ascending,
}

const VIEW: FormSavedView = {
  _id: 'view-1',
  name: 'Pending',
  filter: { columnFilters: [{ columnId: 'a', text: 'pending' }] },
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
        { ...STATE, columnFilters: [], sortColumnId: undefined },
        [view],
        COLUMN_OPTIONS,
      ),
    ).toBe(true)
  })

  it('matches nothing when there are no saved views', () => {
    expect(matchesSavedView(STATE, [], COLUMN_OPTIONS)).toBe(false)
  })
})

describe('normaliseSort', () => {
  it('treats Response # descending as the default order', () => {
    expect(
      normaliseSort(
        RESPONSE_NUMBER_COLUMN_ID,
        SavedViewSortDirection.Descending,
      ),
    ).toEqual({
      sortColumnId: undefined,
      sortDirection: SavedViewSortDirection.Descending,
    })
  })

  it('keeps Response # ascending as a sort', () => {
    expect(
      normaliseSort(
        RESPONSE_NUMBER_COLUMN_ID,
        SavedViewSortDirection.Ascending,
      ),
    ).toEqual({
      sortColumnId: RESPONSE_NUMBER_COLUMN_ID,
      sortDirection: SavedViewSortDirection.Ascending,
    })
  })
})

describe('fromSavedView', () => {
  it('keeps a Response # sort, though # is not a column option', () => {
    const view: FormSavedView = {
      _id: 'view-3',
      name: 'Oldest first',
      sort: {
        columnId: RESPONSE_NUMBER_COLUMN_ID,
        direction: SavedViewSortDirection.Ascending,
      },
    }
    expect(fromSavedView(view, COLUMN_OPTIONS).sortColumnId).toBe(
      RESPONSE_NUMBER_COLUMN_ID,
    )
  })
})

describe('withColumnFilter', () => {
  it('keeps filters in column order, however they were added', () => {
    const filters = withColumnFilter(
      [{ columnId: 'c', text: 'x' }],
      'a',
      'y',
      COLUMN_OPTIONS,
    )
    expect(filters).toEqual([
      { columnId: 'a', text: 'y' },
      { columnId: 'c', text: 'x' },
    ])
  })

  it("replaces a column's filter", () => {
    expect(
      withColumnFilter(
        [{ columnId: 'a', text: 'old' }],
        'a',
        'new',
        COLUMN_OPTIONS,
      ),
    ).toEqual([{ columnId: 'a', text: 'new' }])
  })

  it("clears a column's filter on blank text", () => {
    expect(
      withColumnFilter(
        [{ columnId: 'a', text: 'old' }],
        'a',
        '   ',
        COLUMN_OPTIONS,
      ),
    ).toEqual([])
  })
})

describe('column filters in a saved view', () => {
  it('saves and restores them', () => {
    const input = toSavedViewInput('Pending', STATE, COLUMN_OPTIONS)
    expect(input.filter?.columnFilters).toEqual([
      { columnId: 'a', text: 'pending' },
    ])
    expect(
      fromSavedView({ _id: 'view-4', ...input }, COLUMN_OPTIONS).columnFilters,
    ).toEqual(STATE.columnFilters)
  })

  it('drops a filter on a column the table no longer has', () => {
    const view: FormSavedView = {
      _id: 'view-5',
      name: 'Gone',
      filter: { columnFilters: [{ columnId: 'deleted', text: 'x' }] },
    }
    expect(fromSavedView(view, COLUMN_OPTIONS).columnFilters).toEqual([])
  })

  it('ignores a view saved with the old search fields', () => {
    const view = {
      _id: 'view-6',
      name: 'Old',
      filter: { searchText: 'pending', searchColumnIds: ['a'] },
    } as unknown as FormSavedView
    expect(fromSavedView(view, COLUMN_OPTIONS).columnFilters).toEqual([])
  })
})
