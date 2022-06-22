import { useMemo } from 'react'
import { Container, Grid, useDisclosure } from '@chakra-ui/react'

import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'

// TODO #4279: Remove after React rollout is complete
import { AdminSwitchEnvMessage } from './components/AdminSwitchEnvMessage'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { CONTAINER_MAXW, WorkspaceContent } from './WorkspaceContent'

export const WorkspacePage = (): JSX.Element => {
  const { user, isLoading: isUserLoading } = useUser()

  const ROLLOUT_ANNOUNCEMENT_KEY = useMemo(
    () => ROLLOUT_ANNOUNCEMENT_KEY_PREFIX + user?._id,
    [user],
  )
  const [hasSeenAnnouncement, setHasSeenAnnouncement] =
    useLocalStorage<boolean>(ROLLOUT_ANNOUNCEMENT_KEY)

  const isAnnouncementModalOpen = useMemo(
    () => !isUserLoading && !hasSeenAnnouncement,
    [isUserLoading, hasSeenAnnouncement],
  )

  const emergencyContactKey = useMemo(
    () => (user?._id ? EMERGENCY_CONTACT_KEY_PREFIX + user._id : null),
    [user],
  )

  const [hasSeenEmergencyContact, setHasSeenEmergencyContact] =
    useLocalStorage<boolean>(emergencyContactKey)

  const isEmergencyContactModalOpen = useMemo(
    () =>
      !isUserLoading &&
      // Open emergency contact modal after the rollout announcement modal
      Boolean(hasSeenAnnouncement) &&
      !hasSeenEmergencyContact &&
      !user?.contact,
    [isUserLoading, hasSeenAnnouncement, hasSeenEmergencyContact, user],
  )
  const createFormModalDisclosure = useDisclosure()
  // TODO (hans): Get totalFormCount and isLoading from GET workspaces API when it is implemented
  const totalFormCount = Math.round(Math.random())
  const isLoading = false

  return (
    <>
      {totalFormCount === 0 ? (
        <EmptyWorkspace
          handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
          isLoading={isLoading}
        />
      ) : (
        <Grid
          bg="neutral.100"
          templateColumns="1fr"
          templateRows="auto auto 1fr auto"
          minH="100vh"
          templateAreas="'banner' 'header' 'main' 'footer'"
        >
          <Container gridArea="banner" maxW={CONTAINER_MAXW} pt="1.5rem">
            <AdminSwitchEnvMessage />
          </Container>
          <WorkspaceContent />
          <RolloutAnnouncementModal
            onClose={() => setHasSeenAnnouncement(true)}
            isOpen={isAnnouncementModalOpen}
          />
          <EmergencyContactModal
            onClose={() => setHasSeenEmergencyContact(true)}
            isOpen={isEmergencyContactModalOpen}
          />
        </Grid>
      )}
    </>
  )
}
