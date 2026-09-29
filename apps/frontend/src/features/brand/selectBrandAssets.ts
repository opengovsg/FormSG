import hortColourUrl from '~assets/svgs/brand/brand-hort-colour.svg'
import HortColourSvg from '~assets/svgs/brand/brand-hort-colour.svg?react'
import hortDarkUrl from '~assets/svgs/brand/brand-hort-dark.svg'
import HortDarkSvg from '~assets/svgs/brand/brand-hort-dark.svg?react'
import hortLightMonoUrl from '~assets/svgs/brand/brand-hort-lightmono.svg'
import HortLightMonoSvg from '~assets/svgs/brand/brand-hort-lightmono.svg?react'
import markColourUrl from '~assets/svgs/brand/brand-mark-colour.svg'
import MarkColourSvg from '~assets/svgs/brand/brand-mark-colour.svg?react'
import markDarkUrl from '~assets/svgs/brand/brand-mark-dark.svg'
import MarkDarkSvg from '~assets/svgs/brand/brand-mark-dark.svg?react'
import hortColourUrlV2 from '~assets/svgs/brand/v2/brand-hort-colour.svg'
import HortColourSvgV2 from '~assets/svgs/brand/v2/brand-hort-colour.svg?react'
import hortDarkUrlV2 from '~assets/svgs/brand/v2/brand-hort-dark.svg'
import HortDarkSvgV2 from '~assets/svgs/brand/v2/brand-hort-dark.svg?react'
import hortLightMonoUrlV2 from '~assets/svgs/brand/v2/brand-hort-lightmono.svg'
import HortLightMonoSvgV2 from '~assets/svgs/brand/v2/brand-hort-lightmono.svg?react'
import markColourUrlV2 from '~assets/svgs/brand/v2/brand-mark-colour.svg'
import MarkColourSvgV2 from '~assets/svgs/brand/v2/brand-mark-colour.svg?react'
import markDarkUrlV2 from '~assets/svgs/brand/v2/brand-mark-dark.svg'
import MarkDarkSvgV2 from '~assets/svgs/brand/v2/brand-mark-dark.svg?react'

export interface BrandAsset {
  Svg: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  url: string
}

export interface BrandAssets {
  markColour: BrandAsset
  hortColour: BrandAsset
  markDark: BrandAsset
  hortDark: BrandAsset
  hortLightMono: BrandAsset
}

const OLD_BRAND_ASSETS: BrandAssets = {
  markColour: { Svg: MarkColourSvg, url: markColourUrl },
  hortColour: { Svg: HortColourSvg, url: hortColourUrl },
  markDark: { Svg: MarkDarkSvg, url: markDarkUrl },
  hortDark: { Svg: HortDarkSvg, url: hortDarkUrl },
  hortLightMono: { Svg: HortLightMonoSvg, url: hortLightMonoUrl },
}

const V2_BRAND_ASSETS: BrandAssets = {
  markColour: { Svg: MarkColourSvgV2, url: markColourUrlV2 },
  hortColour: { Svg: HortColourSvgV2, url: hortColourUrlV2 },
  markDark: { Svg: MarkDarkSvgV2, url: markDarkUrlV2 },
  hortDark: { Svg: HortDarkSvgV2, url: hortDarkUrlV2 },
  hortLightMono: { Svg: HortLightMonoSvgV2, url: hortLightMonoUrlV2 },
}

/**
 * Picks the old or new (v2) brand asset set. Pure so it can be unit tested
 * without rendering anything.
 */
export const selectBrandAssets = (isOn: boolean): BrandAssets =>
  isOn ? V2_BRAND_ASSETS : OLD_BRAND_ASSETS
