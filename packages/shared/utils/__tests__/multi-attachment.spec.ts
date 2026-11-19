import {
  findClashingFileName,
  formatAttachmentAnswer,
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
    [['a:b.pdf', 'ab.pdf'], 'ab.pdf'],
    [['a.pdf', ''], ''],
    [['Invoice 1\\2.pdf', 'other.pdf'], undefined],
  ])('finds the clash in %j', (names, expected) => {
    expect(findClashingFileName(names)).toBe(expected)
  })
})
