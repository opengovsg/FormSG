import { useMemo } from 'react'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'
import InlineMessage from '~components/InlineMessage'

import { useEnv } from '~features/env/queries'

// TODO #4279: Remove after React rollout is complete
import CreateFormModal from './components/CreateFormModal'
import { WorkspacePageContent } from './components/WorkspacePageContent'
import { WorkspaceProvider } from './WorkspaceProvider'

export const CONTAINER_MAXW = '69.5rem'

export const WorkspacePage = (): JSX.Element => {
  const { data: { siteBannerContentReact, adminBannerContentReact } = {} } =
    useEnv()

  // TODO (#4279): Revert back to non-react banners post-migration.
  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContentReact || adminBannerContentReact,
    [adminBannerContentReact, siteBannerContentReact],
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
        <InlineMessage useMarkdown>
          Introducing FormSG Payments: Citizens can now pay for fees and
          services directly on your form. [Learn
          more](https://go.gov.sg/formsg-payment-overview)
        </InlineMessage>
        <WorkspaceProvider>
          <WorkspacePageContent
            handleCreateFormModalOpen={createFormModalDisclosure.onOpen}
          />
        </WorkspaceProvider>
      </Flex>
    </>
  )
}
