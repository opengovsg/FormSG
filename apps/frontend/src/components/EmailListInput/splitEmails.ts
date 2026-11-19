export const splitEmails = (text: string): string[] =>
  text.split(/[\s,]+/).filter(Boolean)
