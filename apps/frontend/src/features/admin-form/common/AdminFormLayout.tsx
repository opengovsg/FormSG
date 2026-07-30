import { useMemo } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react'
import { get } from 'lodash'

import { featureFlags } from 'formsg-shared/constants'

import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import AdminForbiddenErrorPage from '~pages/AdminForbiddenError'
import NotFoundErrorPage from '~pages/NotFoundError'
import { useEnv } from '~features/env/queries'
import { useUser } from '~features/user/queries'
import AdminFeedbackContainer from '~features/workspace/components/AdminFeedbackContainer'

import { StorageResponsesProvider } from '../responses/ResponsesPage/storage/StorageResponsesProvider'

import AdminFormNavbar from './components/AdminFormNavbar'
import { useAdminForm } from './queries'

/**
 * Page for rendering subroutes via `Outlet` component for admin form pages.
 */
export const AdminFormLayout = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { data: { siteBannerContent, adminBannerContent } = {} } = useEnv()
  const siteBannerContentGB = useFeatureValue('site-banner-content', '')
  const adminBannerContentGB = useFeatureValue('admin-banner-content', '')

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContent || adminBannerContent,
    [adminBannerContent, siteBannerContent],
  )

  const bannerContentGB = useMemo(
    () => siteBannerContentGB || adminBannerContentGB,
    [adminBannerContentGB, siteBannerContentGB],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent || bannerContentGB),
    [bannerContent, bannerContentGB],
  )

  const isFiveStarEnabled = useFeatureIsOn(featureFlags.fiveStarAdminRating)

  const { error } = useAdminForm()
  const { user } = useUser()

  if (get(error, 'code') === 404 || get(error, 'code') === 410) {
    return <NotFoundErrorPage />
  }
  if (get(error, 'code') === 403) {
    return <AdminForbiddenErrorPage message={error?.message} />
  }

  return (
    <Flex
      flexDir="column"
      css={fillHeightCss}
      overflow="hidden"
      pos="relative"
      sx={{
        '@media print': {
          overflow: 'visible !important',
          display: 'block !important',
        },
      }}
    >
      {bannerProps ? (
        <Banner useMarkdown variant={bannerProps.variant}>
          {bannerProps.msg}
        </Banner>
      ) : null}
      <AdminFormNavbar />
      <StorageResponsesProvider>
        <Outlet />
      </StorageResponsesProvider>
      {user && isFiveStarEnabled && (
        <AdminFeedbackContainer userId={user._id} />
      )}
    </Flex>
  )
}
