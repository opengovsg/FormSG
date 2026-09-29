import { useMemo } from 'react'

import { AgencyBase, FormColorTheme } from 'formsg-shared/types'
import { FormLogo, FormLogoState } from 'formsg-shared/types/form/form_logo'

import { useBrandAssets } from '~features/brand/useBrandAssets'

interface UseFormBannerLogoInputs {
  colorTheme: FormColorTheme | undefined
  logoBucketUrl?: string
  logo?: FormLogo
  agency?: AgencyBase
  showDefaultLogoIfNoLogo?: boolean
}

export const useFormBannerLogo = ({
  colorTheme = FormColorTheme.Blue,
  logoBucketUrl,
  logo,
  agency,
  showDefaultLogoIfNoLogo,
}: UseFormBannerLogoInputs) => {
  const { hortColour } = useBrandAssets()
  const defaultFormLogo = hortColour.url

  const logoImgSrc = useMemo(() => {
    if (!logo) return

    switch (logo.state) {
      case FormLogoState.None:
        return showDefaultLogoIfNoLogo ? defaultFormLogo : undefined
      case FormLogoState.Default:
        return agency?.logo
      case FormLogoState.Custom:
        return logoBucketUrl ? `${logoBucketUrl}/${logo.fileId}` : undefined
    }
  }, [
    agency?.logo,
    defaultFormLogo,
    logo,
    logoBucketUrl,
    showDefaultLogoIfNoLogo,
  ])

  const logoImgAlt = useMemo(() => {
    if (!logo) return

    switch (logo.state) {
      case FormLogoState.None:
        return showDefaultLogoIfNoLogo ? 'Form logo' : undefined
      case FormLogoState.Default:
        return agency ? `Logo for ${agency.fullName}` : undefined
      case FormLogoState.Custom:
        return 'Custom form logo'
    }
  }, [agency, logo, showDefaultLogoIfNoLogo])

  return {
    hasLogo: !!logoImgSrc,
    logoImgSrc,
    logoImgAlt,
    colorTheme,
  }
}
