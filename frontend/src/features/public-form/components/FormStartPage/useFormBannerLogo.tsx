import { useMemo } from 'react'

import { AgencyBase } from '~shared/types'
import { FormLogo, FormLogoState } from '~shared/types/form/form_logo'

interface UseFormBannerLogoInputs {
  logoBucketUrl?: string
  logo?: FormLogo
  agency?: AgencyBase
}

export const useFormBannerLogo = ({
  logoBucketUrl,
  logo,
  agency,
}: UseFormBannerLogoInputs) => {
  const logoImgSrc = useMemo(() => {
    if (!logo) return undefined
    switch (logo.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return agency?.logo
      case FormLogoState.Custom:
        return logoBucketUrl ? `${logoBucketUrl}/${logo.fileId}` : undefined
    }
  }, [agency?.logo, logo, logoBucketUrl])

  const logoImgAlt = useMemo(() => {
    if (!logo) return undefined
    switch (logo.state) {
      case FormLogoState.None:
        return undefined
      case FormLogoState.Default:
        return agency ? `Logo for ${agency.fullName}` : undefined
      case FormLogoState.Custom:
        return `Form logo`
    }
  }, [agency, logo])

  return {
    hasLogo: logo?.state !== FormLogoState.None,
    logoImgSrc,
    logoImgAlt,
  }
}
