/**
 * Generates integer range, inclusive of start anding values
 * [start, end]
 */
export const generateIntRange = (start: number, end: number) => {
  const arr = new Array(end).fill(0)
  return arr.map((_, i) => i + 1).slice(start - 1)
}
