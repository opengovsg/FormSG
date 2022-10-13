import { useMemo } from 'react'

import { FormAuthType } from '~shared/types'

import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'

import { usePublicFormContext } from '../PublicFormContext'

export const FormBanner = (): JSX.Element | null => {
  const {
    data: {
      siteBannerContentReact,
      isGeneralMaintenanceReact,
      isSPMaintenance,
      isCPMaintenance,
      myInfoBannerContent,
    } = {},
  } = useEnv()
  const { form } = usePublicFormContext()

  // TODO (#4279): Revert back to non-react banners post-migration.

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () =>
      siteBannerContentReact ||
      isGeneralMaintenanceReact ||
      (form?.authType === FormAuthType.SP && isSPMaintenance) ||
      (form?.authType === FormAuthType.CP && isCPMaintenance) ||
      (form?.authType === FormAuthType.MyInfo && myInfoBannerContent) ||
      undefined,
    [
      form?.authType,
      isCPMaintenance,
      isGeneralMaintenanceReact,
      isSPMaintenance,
      myInfoBannerContent,
      siteBannerContentReact,
    ],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent),
    [bannerContent],
  )

  if (!bannerProps) return null

  return (
    <Banner useMarkdown variant={bannerProps.variant}>
      {bannerProps.msg}
    </Banner>
  )
}
