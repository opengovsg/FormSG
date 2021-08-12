// Transforms a number to a well formatted percentage to display
// Formats to integer precision
export const formatAsPercentage = (num: number): string => {
  return `${Math.round(num * 100).toString()}%`
}
