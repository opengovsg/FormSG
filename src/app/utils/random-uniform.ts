/**
 * Generates a random integer between min and max (both inclusive).
 * If min/max are not integers, the ceiling and floor are taken respectively.
 * @param min
 * @param max
 * @returns Integer generated uniformly in interval
 */
export const randomUniform = (min: number, max: number): number => {
  const roundedMin = Math.ceil(min)
  const roundedMax = Math.floor(max)
  return Math.floor(Math.random() * (roundedMax - roundedMin + 1)) + roundedMin
}
