import { MAX_ATTACHMENT_NAME_BYTES } from '../../constants/attachment'
import {
  findClashingFileName,
  findInvalidFileName,
  formatAttachmentAnswer,
  getAttachmentDownloadPrefix,
  toSafeZipEntryName,
} from '../multi-attachment'

describe('formatAttachmentAnswer', () => {
  it.each([
    [
      { answer: 'Question 2.zip', answerArray: ['a.pdf', 'b.jpg'] },
      'a.pdf;b.jpg',
    ],
    [{ answer: 'a.pdf' }, 'a.pdf'],
    [{}, ''],
  ])('formats %j as %j', (response, expected) => {
    expect(formatAttachmentAnswer(response)).toBe(expected)
  })
})

describe('toSafeZipEntryName', () => {
  it('removes characters that would break a zip entry name', () => {
    expect(toSafeZipEntryName('Tan / Wei: "Ming"?.csv')).toBe(
      'Tan  Wei Ming.csv',
    )
  })
})

describe('findClashingFileName', () => {
  it.each([
    [['a.pdf', 'b.pdf'], undefined],
    [['a.pdf', 'a.pdf'], 'a.pdf'],
    [['A.pdf', 'a.pdf'], 'a.pdf'],
    [['caf\u00e9.pdf', 'cafe\u0301.pdf'], 'cafe\u0301.pdf'],
    [['a:b.pdf', 'ab.pdf'], 'ab.pdf'],
    [['a.pdf', ''], ''],
    [['Invoice 1\\2.pdf', 'other.pdf'], undefined],
  ])('finds the clash in %j', (names, expected) => {
    expect(findClashingFileName(names)).toBe(expected)
  })
})

describe('findInvalidFileName', () => {
  it.each([
    [['a.pdf', 'caf\u00e9.pdf'], undefined],
    [['a.pdf', 'run.exe\u0000.pdf'], 'run.exe\u0000.pdf'],
    [['a'.repeat(196) + '.pdf'], undefined],
    [['a'.repeat(197) + '.pdf'], 'a'.repeat(197) + '.pdf'],
    [['\u4e00'.repeat(67) + '.pdf'], '\u4e00'.repeat(67) + '.pdf'],
  ])('finds the invalid name in %j', (names, expected) => {
    expect(findInvalidFileName(names)).toBe(expected)
  })
})

describe('MAX_ATTACHMENT_NAME_BYTES', () => {
  it('fits a downloaded file name in the 255 bytes file systems allow', () => {
    const longestPrefix = getAttachmentDownloadPrefix(Number.MAX_SAFE_INTEGER)

    expect(longestPrefix.length + MAX_ATTACHMENT_NAME_BYTES).toBeLessThan(255)
  })
})
