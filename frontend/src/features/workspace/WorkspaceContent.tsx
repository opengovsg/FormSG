import { useMemo } from 'react'
import { Box, Container, Grid, useDisclosure } from '@chakra-ui/react'

import { GUIDE_PAYMENTS_ENTRY } from '~constants/links'
import { ROLLOUT_ANNOUNCEMENT_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import InlineMessage from '~components/InlineMessage'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { useUser } from '~features/user/queries'

import CreateFormModal from './components/CreateFormModal'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceFormRows } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useWorkspaceContext } from './WorkspaceContext'

export const CONTAINER_MAXW = '69.5rem'

export const WorkspaceContent = (): JSX.Element => {
  const { isLoading, totalFormsCount, isDefaultWorkspace } =
    useWorkspaceContext()
  const createFormModalDisclosure = useDisclosure()
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

  const dashboardMessage = `Introducing payments! Citizens can now pay for fees and services directly on your form. [Learn more](${GUIDE_PAYMENTS_ENTRY})`

  return (
    <>
      <CreateFormModal
        isOpen={createFormModalDisclosure.isOpen}
        onClose={createFormModalDisclosure.onClose}
      />
      {totalFormsCount === 0 ? (
        <EmptyWorkspace
          handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
          isLoading={isLoading}
          isFolder={!isDefaultWorkspace}
        />
      ) : (
        <Grid
          bg="neutral.100"
          templateColumns="1fr"
          templateRows="auto 1fr auto"
          minH="100vh"
          templateAreas="'header' 'main' 'footer'"
          overflowY="scroll"
        >
          <Container
            gridArea="header"
            maxW={CONTAINER_MAXW}
            borderBottom="1px solid var(--chakra-colors-neutral-300)"
            px="2rem"
            py="1rem"
          >
            <InlineMessage useMarkdown mb="2rem" mx="-2rem">
              {dashboardMessage}
            </InlineMessage>
            <WorkspaceHeader
              handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
            />
          </Container>
          <Box gridArea="main">
            <RolloutAnnouncementModal
              onClose={() => setHasSeenAnnouncement(true)}
              isOpen={isAnnouncementModalOpen}
            />
            <WorkspaceFormRows />
          </Box>
          <Container
            gridArea="footer"
            pt={{ base: '1rem', md: '1.5rem' }}
            maxW={CONTAINER_MAXW}
          />
        </Grid>
      )}
    </>
  )
}
