import { useMemo } from 'react'
import { Box, Container, Flex, Grid, useDisclosure } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { ROLLOUT_ANNOUNCEMENT_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'
// TODO #4279: Remove after React rollout is complete
import { SwitchEnvIcon } from '~features/env/SwitchEnvIcon'
import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { useUser } from '~features/user/queries'

// TODO #4279: Remove after React rollout is complete
import { AdminSwitchEnvMessage } from './components/AdminSwitchEnvMessage'
import CreateFormModal from './components/CreateFormModal'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceFormRows } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useWorkspace } from './queries'

export const CONTAINER_MAXW = '69.5rem'

const useWorkspaceForms = () => {
  const { data: dashboardForms, isLoading } = useWorkspace()

  const createFormModalDisclosure = useDisclosure()

  return {
    isLoading,
    totalFormCount: dashboardForms?.length,
    sortedForms: dashboardForms ?? [], // Update when dashboardForms is actually sortable.
    createFormModalDisclosure,
  }
}

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

  const { isLoading, totalFormCount, sortedForms, createFormModalDisclosure } =
    useWorkspaceForms()
  const { user, isLoading: isUserLoading } = useUser()

  const ROLLOUT_ANNOUNCEMENT_KEY = useMemo(
    () => ROLLOUT_ANNOUNCEMENT_KEY_PREFIX + user?._id,
    [user],
  )
  const [hasSeenAnnouncement, setHasSeenAnnouncement] =
    useLocalStorage<boolean>(ROLLOUT_ANNOUNCEMENT_KEY, false)

  const isAnnouncementModalOpen = useMemo(
    () => !isUserLoading && hasSeenAnnouncement === false,
    [isUserLoading, hasSeenAnnouncement],
  )

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
        <SwitchEnvIcon />
        {totalFormCount === 0 ? (
          <EmptyWorkspace
            handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
            isLoading={isLoading}
          />
        ) : (
          <Grid
            flex={1}
            overflow="auto"
            bg="neutral.100"
            templateColumns="1fr"
            templateRows="auto auto 1fr"
            templateAreas="'banner' 'header' 'main'"
            py="1.5rem"
          >
            <Container gridArea="banner" maxW={CONTAINER_MAXW}>
              <AdminSwitchEnvMessage />
            </Container>
            <Container
              gridArea="header"
              maxW={CONTAINER_MAXW}
              borderBottom="1px solid var(--chakra-colors-neutral-300)"
              px="2rem"
              py="1rem"
            >
              <WorkspaceHeader
                isLoading={isLoading}
                totalFormCount={totalFormCount}
                handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
              />
            </Container>
            <Box gridArea="main">
              <RolloutAnnouncementModal
                onClose={() => setHasSeenAnnouncement(true)}
                isOpen={isAnnouncementModalOpen}
              />
              <WorkspaceFormRows rows={sortedForms} isLoading={isLoading} />
            </Box>
          </Grid>
        )}
      </Flex>
    </>
  )
}
