import { useMemo } from 'react'

import { AgencyBase, FormColorTheme } from '~shared/types'
import { FormLogo, FormLogoState } from '~shared/types/form/form_logo'

import defaultFormLogo from '../../../../assets/svgs/brand/brand-hort-colour.svg'

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
  }, [agency?.logo, logo, logoBucketUrl, showDefaultLogoIfNoLogo])

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
