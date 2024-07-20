import { useMemo } from 'react'
import { Box, Container, Grid, useDisclosure } from '@chakra-ui/react'

import { ROLLOUT_ANNOUNCEMENT_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import InlineMessage from '~components/InlineMessage'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { useUser } from '~features/user/queries'

import CreateFormModal from './components/CreateFormModal'
import {
  EmptyDefaultWorkspace,
  EmptyNewWorkspace,
} from './components/EmptyWorkspace'
import { WorkspaceFormRows } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useWorkspaceContext } from './WorkspaceContext'

/**
 * Dashboard Message
 * TODO: move to growthbook
 *
 * Example usage DASHBOARD_MESSAGE = `Introducing payments! Citizens can now pay for fees and services directly on your form. [Learn more](${GUIDE_PAYMENTS_ENTRY})`
 */
const DASHBOARD_MESSAGE = ``

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

  return (
    <>
      <CreateFormModal
        isOpen={createFormModalDisclosure.isOpen}
        onClose={createFormModalDisclosure.onClose}
      />
      {totalFormsCount === 0 && isDefaultWorkspace ? (
        <EmptyDefaultWorkspace
          handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
          isLoading={isLoading}
        />
      ) : (
        <Grid
          bg="neutral.100"
          templateColumns="1fr"
          templateRows="auto 1fr auto"
          minH="100vh"
          templateAreas=" 'header' 'main'"
          overflowY="auto"
        >
          <Container
            gridArea="header"
            maxW="100%"
            borderBottom="1px solid var(--chakra-colors-neutral-300)"
            px={{ base: '2rem', md: '4rem' }}
            py="1rem"
          >
            {isDefaultWorkspace && DASHBOARD_MESSAGE && (
              <InlineMessage
                useMarkdown
                mb="2rem"
                mx="-2rem"
                justifyContent="center"
              >
                {DASHBOARD_MESSAGE}
              </InlineMessage>
            )}
            <WorkspaceHeader
              handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
            />
          </Container>
          {totalFormsCount === 0 && !isDefaultWorkspace ? (
            <EmptyNewWorkspace isLoading={isLoading} />
          ) : (
            <Box gridArea="main">
              <RolloutAnnouncementModal
                onClose={() => setHasSeenAnnouncement(true)}
                isOpen={isAnnouncementModalOpen}
              />
              <WorkspaceFormRows />
            </Box>
          )}

          <Container pt={{ base: '1rem', md: '1.5rem' }} />
        </Grid>
      )}
    </>
  )
}
