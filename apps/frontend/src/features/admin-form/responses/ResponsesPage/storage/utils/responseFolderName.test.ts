import { describe, expect, it } from 'vitest'

import {
  getResponseFolderName,
  removeInvalidFileNameCharacters,
} from './responseFolderName'

describe('getResponseFolderName', () => {
  it('names the folder by the response ID', () => {
    expect(getResponseFolderName({ refNo: 'abc' })).toBe('RefNo abc')
  })
})

describe('removeInvalidFileNameCharacters', () => {
  it('removes characters that would break a zip entry name', () => {
    expect(removeInvalidFileNameCharacters('Tan / Wei: "Ming"?.csv')).toBe(
      'Tan  Wei Ming.csv',
    )
  })
})
