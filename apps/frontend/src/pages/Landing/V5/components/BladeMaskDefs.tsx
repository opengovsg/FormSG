import { LANDING_V5_COLORS } from '../theme/tokens'

/**
 * The FormSG logo's own underside curve. Reused at every peel and cut corner,
 * which is what ties the paper conceit back to the brand mark: a corner lifts
 * along the blade's S-curve rather than along a straight 45 degree line.
 */
const BLADE_PATH =
  'M60.8527 77.448C60.8527 68.2825 68.2831 60.8525 77.4488 60.8525H116.577C122.262 60.8525 127.46 57.6401 130.003 52.5547V53.7831C130.003 58.2997 128.162 62.6211 124.905 65.7503L94.7364 94.7351L65.7507 124.903C62.6214 128.16 58.2999 130.001 53.7832 130.001H52.5547C57.6403 127.458 60.8527 122.26 60.8527 116.575V77.448Z'

/** The blade's own viewBox, cropped to the mark's lower-left quadrant. */
const BLADE_VIEW_BOX = '52 52 78.1 78.1'

const BLADE_SHAPE_ID = 'lv5-blade-shape'
const BLADE_GRADIENT_ID = 'lv5-blade-grad'

/**
 * Mounts the blade's gradient and shape once per page, for `Blade` to
 * reference. SVG `<use>` resolves against the document, so this has to be in
 * the tree before any blade renders — mount it at the page root.
 *
 * IDs are namespaced because they are document-global: a bare `bladeShape`
 * could collide with any other inline SVG the app renders.
 */
export const BladeMaskDefs = (): JSX.Element => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      {/* Bottom-left to top-right, so the blade catches light along the fold. */}
      <linearGradient id={BLADE_GRADIENT_ID} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor={LANDING_V5_COLORS.mint} />
        <stop offset="1" stopColor={LANDING_V5_COLORS.mintDeep} />
      </linearGradient>
      <symbol id={BLADE_SHAPE_ID} viewBox={BLADE_VIEW_BOX}>
        <path d={BLADE_PATH} fill={`url(#${BLADE_GRADIENT_ID})`} />
      </symbol>
    </defs>
  </svg>
)

export interface BladeProps {
  /**
   * Which corner the blade sits in. `tr` is rotated so the curve reads the
   * same way round; `br` is the shape's natural orientation.
   */
  corner: 'tr' | 'br'
}

/**
 * The mint blade filling a cut corner. Sizes itself from `--lv5-c`, so it grows
 * with the cut rather than needing its own dimension. Purely decorative.
 *
 * Pair it with `lv5-cut-tr` / `lv5-cut-br` on the element being cut, and set
 * `--lv5-c` on their common ancestor.
 */
export const Blade = ({ corner }: BladeProps): JSX.Element => (
  <svg className={`lv5-blade lv5-blade--${corner}`} aria-hidden="true">
    <use href={`#${BLADE_SHAPE_ID}`} />
  </svg>
)
