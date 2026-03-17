export const truncateLargeNumberWithPlus = (number: number): string => {
  const MAX_NUM = 100000
  return number > MAX_NUM
    ? `${MAX_NUM.toLocaleString()}+`
    : number.toLocaleString()
}
