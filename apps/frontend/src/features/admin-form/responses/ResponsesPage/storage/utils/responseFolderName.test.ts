import { describe, expect, it } from 'vitest'

import { getResponseFolderName } from './responseFolderName'

describe('getResponseFolderName', () => {
  it('names the folder by the response ID', () => {
    expect(getResponseFolderName({ refNo: 'abc' })).toBe('RefNo abc')
  })
})
