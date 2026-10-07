const listFormatter = new Intl.ListFormat('en-GB', {
  style: 'long',
  type: 'conjunction',
})

export const formatEmailList = (emails: string[]): string =>
  listFormatter.format(emails)
