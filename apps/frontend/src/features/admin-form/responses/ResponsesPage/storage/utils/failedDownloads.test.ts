import { describe, expect, it } from 'vitest'

import { FailedDownload } from '../types'

import {
  getFailedDownloadsSummary,
  getTombstoneContent,
  getTombstoneName,
} from './failedDownloads'

const failure = (n: number): FailedDownload => ({
  refNo: `ref${n}`,
  name: `Question ${n} - file${n}.pdf`,
  reason: 'download',
})

describe('getTombstoneName', () => {
  it('marks the file as failed and swaps its extension for .txt', () => {
    expect(getTombstoneName('Question 3 - report.pdf')).toBe(
      '(FAILED TO DOWNLOAD) Question 3 - report.txt',
    )
  })

  it('keeps a name without an extension whole', () => {
    expect(getTombstoneName('Response')).toBe(
      '(FAILED TO DOWNLOAD) Response.txt',
    )
  })
})

describe('getTombstoneContent', () => {
  const read = (failed: FailedDownload) =>
    new TextDecoder().decode(getTombstoneContent(failed))

  it('says why the file is missing and which response it belongs to', () => {
    const text = read(failure(1))
    expect(text).toContain('could not be downloaded, even after retrying')
    expect(text).toContain('Response: ref1')
    expect(text).toContain('File: Question 1 - file1.pdf')
  })

  it('leaves out the file line for a whole response', () => {
    const text = read({ refNo: 'ref1', name: 'Response', reason: 'response' })
    expect(text).toContain('This response could not be downloaded.')
    expect(text).not.toContain('File:')
  })
})

describe('getFailedDownloadsSummary', () => {
  it('lists every failure when there are at most 5', () => {
    expect(getFailedDownloadsSummary([failure(1)])).toEqual({
      message: '1 file could not be downloaded:',
      items: ['RefNo ref1 · Question 1 - file1.pdf'],
    })
  })

  it('lists the first 5 and sums up the rest', () => {
    const { message, items } = getFailedDownloadsSummary(
      [1, 2, 3, 4, 5, 6, 7].map(failure),
    )
    expect(message).toBe('7 files could not be downloaded:')
    expect(items).toHaveLength(6)
    expect(items[4]).toBe('RefNo ref5 · Question 5 - file5.pdf')
    expect(items[5]).toBe('and 2 other files')
  })

  it('says "file" for one more', () => {
    const { items } = getFailedDownloadsSummary([1, 2, 3, 4, 5, 6].map(failure))
    expect(items.at(-1)).toBe('and 1 other file')
  })
})
