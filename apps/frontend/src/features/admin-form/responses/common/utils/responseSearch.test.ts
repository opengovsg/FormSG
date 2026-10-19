import {
  matchesColumnFilters,
  matchesSearchQuery,
  normaliseSearchQuery,
} from './responseSearch'

describe('normaliseSearchQuery', () => {
  it('trims and lowercases, so the match is case-insensitive', () => {
    expect(normaliseSearchQuery('  Tan Wei Ming  ')).toBe('tan wei ming')
  })

  it('reduces a whitespace-only query to nothing', () => {
    expect(normaliseSearchQuery('   ')).toBe('')
  })
})

describe('matchesSearchQuery', () => {
  it('matches on a substring of any value', () => {
    expect(matchesSearchQuery(['Tan Wei Ming', 'Engineer'], 'wei')).toBe(true)
  })

  it('does not match when no value contains the query', () => {
    expect(matchesSearchQuery(['Tan Wei Ming', 'Engineer'], 'lim')).toBe(false)
  })

  it('matches everything on an empty query', () => {
    expect(matchesSearchQuery([], '')).toBe(true)
    expect(matchesSearchQuery([undefined], '')).toBe(true)
  })

  it('ignores values that are not strings', () => {
    expect(matchesSearchQuery([undefined, 'Engineer'], 'engineer')).toBe(true)
    expect(matchesSearchQuery([undefined], 'engineer')).toBe(false)
  })
})

describe('matchesColumnFilters', () => {
  const row: Record<string, string | undefined> = {
    name: 'Tan Wei Ming',
    status: 'Pending',
    notes: undefined,
  }
  const getValue = (columnId: string) => row[columnId]

  it('matches when every filtered column contains its text, ignoring case', () => {
    expect(
      matchesColumnFilters(getValue, [
        { columnId: 'name', text: 'wei' },
        { columnId: 'status', text: 'PENDING' },
      ]),
    ).toBe(true)
  })

  it('does not match when any one filter fails', () => {
    expect(
      matchesColumnFilters(getValue, [
        { columnId: 'name', text: 'wei' },
        { columnId: 'status', text: 'completed' },
      ]),
    ).toBe(false)
  })

  it('only looks in the filtered column', () => {
    expect(
      matchesColumnFilters(getValue, [{ columnId: 'status', text: 'wei' }]),
    ).toBe(false)
  })

  it('does not match a column with no value', () => {
    expect(
      matchesColumnFilters(getValue, [{ columnId: 'notes', text: 'a' }]),
    ).toBe(false)
  })

  it('matches every row with no filters', () => {
    expect(matchesColumnFilters(getValue, [])).toBe(true)
  })
})
