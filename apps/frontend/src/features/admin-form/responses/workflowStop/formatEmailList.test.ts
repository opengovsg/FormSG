import { formatEmailList } from './formatEmailList'

describe('formatEmailList', () => {
  it.each([
    [[], ''],
    [['a@x.sg'], 'a@x.sg'],
    [['a@x.sg', 'b@x.sg'], 'a@x.sg and b@x.sg'],
    [['a@x.sg', 'b@x.sg', 'c@x.sg'], 'a@x.sg, b@x.sg and c@x.sg'],
  ])('formats %j', (emails, expected) => {
    expect(formatEmailList(emails)).toBe(expected)
  })
})
