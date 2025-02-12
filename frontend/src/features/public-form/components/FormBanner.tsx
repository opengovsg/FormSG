import { useMemo } from 'react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { FormAuthType } from '~shared/types'

import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'

import { usePublicFormContext } from '../PublicFormContext'

export const FormBanner = (): JSX.Element | null => {
  const {
    data: {
      siteBannerContent,
      isGeneralMaintenance,
      isSPMaintenance,
      isCPMaintenance,
      myInfoBannerContent,
    } = {},
  } = useEnv()
  const siteBannerContentGB = useFeatureValue('site-banner-content', '')
  const isGeneralMaintenanceGB = useFeatureValue('is-general-maintenance', '')
  const isSPMaintenanceGB = useFeatureValue('is-sp-maintenance', '')
  const isCPMaintenanceGB = useFeatureValue('is-cp-maintenance', '')
  const myInfoBannerContentGB = useFeatureValue('myinfo-banner-content', '')
  const { form } = usePublicFormContext()

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () =>
      siteBannerContent ||
      isGeneralMaintenance ||
      (form?.authType === FormAuthType.SP && isSPMaintenance) ||
      (form?.authType === FormAuthType.CP && isCPMaintenance) ||
      (form?.authType === FormAuthType.MyInfo && myInfoBannerContent) ||
      undefined,
    [
      form?.authType,
      isCPMaintenance,
      isGeneralMaintenance,
      isSPMaintenance,
      myInfoBannerContent,
      siteBannerContent,
    ],
  )

  const bannerContentGB = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () =>
      siteBannerContentGB ||
      isGeneralMaintenanceGB ||
      (form?.authType === FormAuthType.SP && isSPMaintenanceGB) ||
      (form?.authType === FormAuthType.CP && isCPMaintenanceGB) ||
      (form?.authType === FormAuthType.MyInfo && myInfoBannerContentGB) ||
      undefined,
    [
      form?.authType,
      isCPMaintenanceGB,
      isGeneralMaintenanceGB,
      isSPMaintenanceGB,
      myInfoBannerContentGB,
      siteBannerContentGB,
    ],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent || bannerContentGB),
    [bannerContent, bannerContentGB],
  )

  if (!bannerProps) return null

  return (
    <Banner useMarkdown variant={bannerProps.variant}>
      {bannerProps.msg}
    </Banner>
  )
}
