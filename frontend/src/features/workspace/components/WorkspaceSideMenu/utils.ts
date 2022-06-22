export const truncateLongTextWithEllipsis = (text: string): string => {
  const MAX_CHAR_LEN = 16
  return text.length > MAX_CHAR_LEN
    ? `${text.substring(0, MAX_CHAR_LEN)}...`
    : text
}

export const truncateLargeNumberWithPlus = (number: number): string => {
  const MAX_NUM = 100000
  return number > MAX_NUM
    ? `${MAX_NUM.toLocaleString()}+`
    : number.toLocaleString()
}
