/**
 * Opacity of the crease shadow for a given cut length.
 *
 * A bell curve over the fold's travel, not a ramp: flat paper throws no crease
 * at either end, and the shadow is deepest mid-turn where a real sheet is under
 * most tension. This is the reason the peel is tweened per frame rather than
 * handed to a CSS transition, which could only interpolate monotonically.
 *
 * Peaks a little past halfway, at roughly 0.575 of the travel.
 *
 * @param cut current cut length, in px
 * @param open the cut length at full open, in px. Zero means there is no travel
 *   to be partway through, so there is no crease.
 */
export const foldShadowOpacity = (cut: number, open: number): number => {
  if (open <= 0) return 0
  const t = cut / open
  return Math.max(0, 2.6 * t * (1.15 - t))
}
