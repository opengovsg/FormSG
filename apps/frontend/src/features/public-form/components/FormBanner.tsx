import { useMemo } from 'react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { FormAuthType } from 'formsg-shared/types'

import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'

import { usePublicFormContext } from '../PublicFormContext'

export const FormBanner = (): JSX.Element | null => {
  const {
    data: {
      siteBannerContent,
      isGeneralMaintenance,
      isCPMaintenance,
      myInfoBannerContent,
    } = {},
  } = useEnv()
  const siteBannerContentGB = useFeatureValue('site-banner-content', '')
  const isGeneralMaintenanceGB = useFeatureValue('is-general-maintenance', '')
  const isCPMaintenanceGB = useFeatureValue('is-cp-maintenance', '')
  const myInfoBannerContentGB = useFeatureValue('myinfo-banner-content', '')
  const { form } = usePublicFormContext()

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () =>
      siteBannerContent ||
      isGeneralMaintenance ||
      (form?.authType === FormAuthType.CP && isCPMaintenance) ||
      (form?.authType === FormAuthType.MyInfo && myInfoBannerContent) ||
      undefined,
    [
      form?.authType,
      isCPMaintenance,
      isGeneralMaintenance,
      myInfoBannerContent,
      siteBannerContent,
    ],
  )

  const bannerContentGB = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () =>
      siteBannerContentGB ||
      isGeneralMaintenanceGB ||
      (form?.authType === FormAuthType.CP && isCPMaintenanceGB) ||
      (form?.authType === FormAuthType.MyInfo && myInfoBannerContentGB) ||
      undefined,
    [
      form?.authType,
      isCPMaintenanceGB,
      isGeneralMaintenanceGB,
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
