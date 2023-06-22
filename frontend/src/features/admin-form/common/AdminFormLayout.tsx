import { useMemo } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { get } from 'lodash'

import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import AdminForbiddenErrorPage from '~pages/AdminForbiddenError'
import NotFoundErrorPage from '~pages/NotFoundError'
import { useEnv } from '~features/env/queries'

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

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContent || adminBannerContent,
    [adminBannerContent, siteBannerContent],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent),
    [bannerContent],
  )

  const { error } = useAdminForm()

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
    </Flex>
  )
}
