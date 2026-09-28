import {
  matchesSearchQuery,
  normaliseSearchQuery,
  searchableColumnIds,
} from './responseSearch'

describe('normaliseSearchQuery', () => {
  it('trims and lowercases, so the match is case-insensitive', () => {
    expect(normaliseSearchQuery('  Tan Wei Ming  ')).toBe('tan wei ming')
  })

  it('reduces a whitespace-only query to nothing', () => {
    expect(normaliseSearchQuery('   ')).toBe('')
  })
})

describe('searchableColumnIds', () => {
  it('drops the columns the admin excluded', () => {
    expect(searchableColumnIds(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
  })

  it('keeps every column when none are excluded', () => {
    expect(searchableColumnIds(['a', 'b'], [])).toEqual(['a', 'b'])
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
