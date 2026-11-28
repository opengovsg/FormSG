import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { describe, expect, it } from 'vitest'

import {
  getFolderNameAnswer,
  getResponseFolderName,
  toSafeZipEntryName,
} from './responseFolderName'

describe('getResponseFolderName', () => {
  it('names the folder by the response ID', () => {
    expect(getResponseFolderName({ refNo: 'abc' })).toBe('RefNo abc')
  })

  it('puts the answer before the response ID', () => {
    expect(getResponseFolderName({ refNo: 'abc', answer: 'Tan Ah Kow' })).toBe(
      'Tan Ah Kow - RefNo abc',
    )
  })

  it('removes unsafe characters and extra whitespace', () => {
    expect(
      getResponseFolderName({
        refNo: 'abc',
        answer: ' Tan/Ah:Kow*?  "Jr" <ok>|\n\\ ',
      }),
    ).toBe('Tan Ah Kow Jr ok - RefNo abc')
  })

  it('caps the answer at 50 characters without splitting an emoji', () => {
    expect(
      getResponseFolderName({ refNo: 'abc', answer: `${'a'.repeat(49)}😀b` }),
    ).toBe(`${'a'.repeat(49)}😀 - RefNo abc`)
  })

  it('falls back to the response ID when the answer is blank', () => {
    expect(getResponseFolderName({ refNo: 'abc', answer: ' / ' })).toBe(
      'RefNo abc',
    )
  })
})

describe('getFolderNameAnswer', () => {
  const responses: FormField[] = [
    { _id: 'name', question: 'Name', fieldType: 'textfield', answer: 'Tan' },
  ]

  it('finds the answer to the chosen field', () => {
    expect(getFolderNameAnswer(responses, 'name')).toBe('Tan')
  })

  it('returns nothing when no field is chosen or it is missing', () => {
    expect(getFolderNameAnswer(responses, undefined)).toBeUndefined()
    expect(getFolderNameAnswer(responses, 'deleted')).toBeUndefined()
  })
})

describe('toSafeZipEntryName', () => {
  it('removes characters that would break a zip entry name', () => {
    expect(toSafeZipEntryName('Tan / Wei: "Ming"?.csv')).toBe(
      'Tan  Wei Ming.csv',
    )
  })
})
