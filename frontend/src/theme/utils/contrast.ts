// A bunch of utility functions to help with calculating the contrast ratio of two colours.
// Following WCAG AA guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
// Note that this is not a strict implementation of the WCAG guidelines, but rather a
// simplified version which always checks for contrast of >= 4.5 instead of differentiating by font size.

// Contrast magic numbers can be found here: https://www.w3.org/TR/WCAG20-TECHS/G17.html
// Discussion on why the above numbers can be found here: https://github.com/w3c/wcag/issues/695

type RgbColour = [r: number, g: number, b: number]

/**
 * Luminance flare. This is the a standard number to add to the luminance of the
 * colours to determine if the contrast is sufficient.
 * @see https://www.w3.org/TR/WCAG20-TECHS/G17.html
 *
 * This is because if the denominator of the ratio is pure black, you will be
 * dividing by zero (black has luminance of 0), leading to an invalid ratio.
 */
const LUM_FLARE = 0.05
const MIN_WCAG_AA_CONTRAST_RATIO = 4.5

/** Regex to expand shorthand form (e.g. '03F') to full form (e.g. '0033FF') */
const HEX_SHORTHAND_EXPAND_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
const HEX_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

/**
 * Converts hex colour values to RGB.
 * @param hex the hex colour value to convert
 * @returns the RGB value if the conversion is successful, otherwise returns `null`
 */
const hexToRgb = (hex: string): RgbColour | null => {
  // Expanding hex string to expanded form if available.
  // E.g. `'03F'` to full form `'0033FF'`
  const normalizedHex = hex.replace(
    HEX_SHORTHAND_EXPAND_REGEX,
    (_m, r, g, b) => r + r + g + g + b + b,
  )

  // E.g. `'0033FF'` to `[0033FF, 00, 33, FF]`
  const result = HEX_REGEX.exec(normalizedHex)
  if (!result) return null

  // Slice to remove the first element which is just the full matched string.
  return result.slice(1).map((block) => parseInt(block, 16)) as RgbColour
}

/**
 * Luminance function.
 * @see https://www.w3.org/TR/WCAG20-TECHS/G17.html
 * @param rgbColour rgb colour values
 * @returns luminance of colour
 */
const getLuminance = (rgbColour: RgbColour) => {
  const a = rgbColour.map((v) => {
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
  if (!contrast) return false
  return contrast >= MIN_WCAG_AA_CONTRAST_RATIO
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

  return (Math.max(lum1, lum2) + LUM_FLARE) / (Math.min(lum1, lum2) + LUM_FLARE)
}
