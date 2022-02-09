// A bunch of utility functions to help with calculating the contrast ratio of two colours.

type RgbColor = {
  r: number
  g: number
  b: number
}

/**
 * Converts hex colour values to RGB.
 * @param hex the hex colour value to convert
 * @returns the RGB value if the conversion is successful, otherwise returns `null`
 */
const hexToRgb = (hex: string): RgbColor | null => {
  // Expand shorthand form (e.g. '03F') to full form (e.g. '0033FF')
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i

  hex = hex.replace(shorthandRegex, (_m, r, g, b) => {
    return r + r + g + g + b + b
  })

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

const getLuminance = (rgbColor: RgbColor) => {
  const a = [rgbColor.r, rgbColor.g, rgbColor.b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

/**
 * Whether given foreground and background colours meets WCAG 2.0 AA contrast ratio.
 * @param foreground the foreground colour
 * @param background the background colour
 * @returns true if the contrast ratio is greater than 4.5; false otherwise (or if one of the colours are invalid)
 */
export const meetsWcagAaRatio = (
  foreground: string,
  background: string,
): boolean => {
  const contrast = getContrast(foreground, background)
  console.log(background, foreground, contrast)
  if (!contrast) return false
  return contrast >= 4.5
}

/**
 * Get the contrast ratio between two colours.
 * @param foreground the foreground colour
 * @param background the background colour
 * @returns the contrast ratio, or null if the colours are invalid
 */
export const getContrast = (
  foreground: string,
  background: string,
): number | null => {
  const rgb1 = hexToRgb(foreground)
  const rgb2 = hexToRgb(background)

  if (!rgb1 || !rgb2) return null

  const lum1 = getLuminance(rgb1)
  const lum2 = getLuminance(rgb2)

  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05)
}
