import { chakra } from '@chakra-ui/react'

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

type BrandSvgComponent = React.FunctionComponent<
  React.ComponentProps<'svg'> & { title?: string }
>

export interface BrandAsset {
  Svg: ReturnType<typeof chakra<BrandSvgComponent>>
  url: string
}

export interface BrandAssets {
  markColour: BrandAsset
  hortColour: BrandAsset
  markDark: BrandAsset
  hortDark: BrandAsset
  hortLightMono: BrandAsset
}

/** Wraps a raw svgr component with chakra() once, at module scope. */
const asset = (Svg: BrandSvgComponent, url: string): BrandAsset => ({
  Svg: chakra(Svg),
  url,
})

const OLD_BRAND_ASSETS: BrandAssets = {
  markColour: asset(MarkColourSvg, markColourUrl),
  hortColour: asset(HortColourSvg, hortColourUrl),
  markDark: asset(MarkDarkSvg, markDarkUrl),
  hortDark: asset(HortDarkSvg, hortDarkUrl),
  hortLightMono: asset(HortLightMonoSvg, hortLightMonoUrl),
}

const V2_BRAND_ASSETS: BrandAssets = {
  markColour: asset(MarkColourSvgV2, markColourUrlV2),
  hortColour: asset(HortColourSvgV2, hortColourUrlV2),
  markDark: asset(MarkDarkSvgV2, markDarkUrlV2),
  hortDark: asset(HortDarkSvgV2, hortDarkUrlV2),
  hortLightMono: asset(HortLightMonoSvgV2, hortLightMonoUrlV2),
}

/**
 * Picks the old or new (v2) brand asset set. Pure so it can be unit tested
 * without rendering anything.
 */
export const selectBrandAssets = (isOn: boolean): BrandAssets =>
  isOn ? V2_BRAND_ASSETS : OLD_BRAND_ASSETS
