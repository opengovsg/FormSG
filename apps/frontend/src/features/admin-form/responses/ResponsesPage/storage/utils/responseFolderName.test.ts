import { describe, expect, it } from 'vitest'

import { getResponseFolderName, toSafeZipEntryName } from './responseFolderName'

describe('getResponseFolderName', () => {
  it('names the folder by the response ID', () => {
    expect(getResponseFolderName({ refNo: 'abc' })).toBe('RefNo abc')
  })
})

describe('toSafeZipEntryName', () => {
  it('removes characters that would break a zip entry name', () => {
    expect(toSafeZipEntryName('Tan / Wei: "Ming"?.csv')).toBe(
      'Tan  Wei Ming.csv',
    )
  })
})
