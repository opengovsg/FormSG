/**
 * Formats a stat for a die-cut sticker: `167`, `413K`, `271M`.
 *
 * The current landing page uses `toLocaleString()`, which is right for its
 * layout but not for this one — "413,208" at 84px is nearly twice the width of
 * "413K" and would not fit the sticker.
 *
 * `Intl` does the abbreviating rather than hand-rolled division, so the
 * thresholds and rounding are the platform's. Note it rounds rather than
 * truncates: 1,500 reads as "2K". At the magnitudes these three stats actually
 * carry, that is not visible.
 *
 * Returns an em dash for a missing value, so a sticker awaiting the API keeps
 * its shape instead of collapsing.
 */
const compactFormatter = new Intl.NumberFormat('en-SG', {
  notation: 'compact',
  maximumFractionDigits: 0,
})

export const STAT_PLACEHOLDER = '—'

export const formatCompactStat = (value?: number): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return STAT_PLACEHOLDER
  }
  return compactFormatter.format(value)
}
