import { MAX_SUBMISSION_METADATA_PAGE_SIZE } from 'formsg-shared/types'

import { TABLE_DECRYPTION_LIMIT } from '../../../constants'

import { exceedsTableLimit, TABLE_RESPONSE_LIMIT } from './responseLimit'

describe('the responses table limit', () => {
  it('never asks for a larger page than the server allows', () => {
    expect(TABLE_RESPONSE_LIMIT).toBeLessThanOrEqual(
      MAX_SUBMISSION_METADATA_PAGE_SIZE,
    )
    expect(TABLE_RESPONSE_LIMIT).toBeLessThanOrEqual(TABLE_DECRYPTION_LIMIT)
  })

  it.each([
    [undefined, false],
    [0, false],
    [TABLE_RESPONSE_LIMIT - 1, false],
    [TABLE_RESPONSE_LIMIT, false],
    [TABLE_RESPONSE_LIMIT + 1, true],
    [200_000, true],
  ])('reads a count of %s as over the limit: %s', (count, expected) => {
    expect(exceedsTableLimit(count)).toBe(expected)
  })
})
