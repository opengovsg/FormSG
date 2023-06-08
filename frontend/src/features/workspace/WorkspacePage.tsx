import { useMemo } from 'react'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'

// TODO #4279: Remove after React rollout is complete
import CreateFormModal from './components/CreateFormModal'
import { WorkspacePageContent } from './components/WorkspacePageContent'
import { WorkspaceProvider } from './WorkspaceProvider'

export const CONTAINER_MAXW = '69.5rem'

export const WorkspacePage = (): JSX.Element => {
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

  const createFormModalDisclosure = useDisclosure()

  return (
    <>
      <CreateFormModal
        isOpen={createFormModalDisclosure.isOpen}
        onClose={createFormModalDisclosure.onClose}
      />
      <Flex direction="column" css={fillHeightCss}>
        {bannerProps ? (
          <Banner useMarkdown variant={bannerProps.variant}>
            {bannerProps.msg}
          </Banner>
        ) : null}
        <AdminNavBar />
        <WorkspaceProvider>
          <WorkspacePageContent
            handleCreateFormModalOpen={createFormModalDisclosure.onOpen}
          />
        </WorkspaceProvider>
      </Flex>
    </>
  )
}
