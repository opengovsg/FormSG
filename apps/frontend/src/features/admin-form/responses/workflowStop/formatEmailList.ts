const listFormatter = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
})

/** "a", "a and b", "a, b and c". */
export const formatEmailList = (emails: string[]): string =>
  listFormatter.format(emails)
