import { useMemo } from 'react'
import { Box, Container, Flex, Grid, useDisclosure } from '@chakra-ui/react'

import { AdminNavBar } from '~/app/AdminNavBar'

import { ROLLOUT_ANNOUNCEMENT_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

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
      <Flex direction="column" h="100vh">
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
