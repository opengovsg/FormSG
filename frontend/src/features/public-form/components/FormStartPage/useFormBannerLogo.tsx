import { useMemo } from 'react'

import { AdminFormDto, PublicFormDto } from '~shared/types'
import { FormLogoState } from '~shared/types/form/form_logo'

import { useEnv } from '~features/env/queries'

export const useFormBannerLogo = (form?: AdminFormDto | PublicFormDto) => {
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const logoImgSrc = useMemo(() => {
    if (!form) return undefined
    const formLogo = form?.startPage.logo
    switch (formLogo.state) {
      case FormLogoState.None:
        return ''
      case FormLogoState.Default:
        return form.admin.agency.logo
      case FormLogoState.Custom:
        return logoBucketUrl ? `${logoBucketUrl}/${formLogo.fileId}` : undefined
    }
  }, [form, logoBucketUrl])

  const logoImgAlt = useMemo(
    () => (form ? `Logo for ${form.admin.agency.fullName}` : undefined),
    [form],
  )

  return {
    hasLogo: form?.startPage.logo.state !== FormLogoState.None,
    logoImgSrc,
    logoImgAlt,
  }
}
