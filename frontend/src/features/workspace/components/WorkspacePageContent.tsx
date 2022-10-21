import { useMemo } from 'react'
import { Box, Container, Grid } from '@chakra-ui/react'

import { ROLLOUT_ANNOUNCEMENT_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

// TODO #4279: Remove after React rollout is complete
import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { useUser } from '~features/user/queries'

import { useWorkspaceContext } from '../WorkspaceContext'
import { CONTAINER_MAXW } from '../WorkspacePage'

// TODO #4279: Remove after React rollout is complete
import { AdminSwitchEnvMessage } from './AdminSwitchEnvMessage'
import { EmptyWorkspace } from './EmptyWorkspace'
import { WorkspaceFormRows } from './WorkspaceFormRow'
import { WorkspaceHeader } from './WorkspaceHeader'

export interface WorkspacePageContentProps {
  handleCreateFormModalOpen: () => void
}

export const WorkspacePageContent = ({
  handleCreateFormModalOpen,
}: WorkspacePageContentProps): JSX.Element => {
  const { user, isLoading: isUserLoading } = useUser()

  const { isLoading, totalFormsCount } = useWorkspaceContext()

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

  return totalFormsCount === 0 ? (
    <EmptyWorkspace
      handleOpenCreateFormModal={handleCreateFormModalOpen}
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
          handleOpenCreateFormModal={handleCreateFormModalOpen}
        />
      </Container>
      <Box gridArea="main">
        <RolloutAnnouncementModal
          onClose={() => setHasSeenAnnouncement(true)}
          isOpen={isAnnouncementModalOpen}
        />
        <WorkspaceFormRows />
      </Box>
    </Grid>
  )
}
