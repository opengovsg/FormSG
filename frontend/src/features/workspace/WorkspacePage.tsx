import { useMemo, useState } from 'react'
import { Container, Grid, Stack, useDisclosure } from '@chakra-ui/react'

import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'
import {
  CONTAINER_MAXW,
  WorkspaceContent,
} from '~features/workspace/WorkspaceContent'

// TODO #4279: Remove after React rollout is complete
import { AdminSwitchEnvMessage } from './components/AdminSwitchEnvMessage'
import { WorkspaceMenuHeader } from './components/WorkspaceSideMenu/WorkspaceMenuHeader'
import { WorkspaceMenuTab } from './components/WorkspaceSideMenu/WorkspaceMenuTab'

// TODO (hans): Add mobile view for WorkspacePage, probably split the views
export const WorkspacePage = (): JSX.Element => {
  const { user, isLoading: isUserLoading } = useUser()
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')

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

  // TODO (hans): Get workspaces data from workspace API once it's implemented
  const MOCK_WORKSPACES_DATA = [
    {
      _id: '',
      title: 'All forms',
      numForms: 531159249035,
    },
    {
      _id: '2',
      title: 'Product feedback',
      numForms: 35002,
    },
    {
      _id: '3',
      title: 'Public sentiment',
      numForms: 12,
    },
    {
      _id: '4',
      title: 'Very long number of forms',
      numForms: 531159214021,
    },
  ]

  // TODO (hans): Add <EmptyWorkspace/> if totalFormCount === 0
  return (
    <>
      <Grid
        templateColumns="15.5rem 1fr"
        minH="100vh"
        templateAreas="'menu' 'content'"
      >
        <Container gridArea="banner" maxW={CONTAINER_MAXW} pt="1.5rem">
          <AdminSwitchEnvMessage />
        </Container>
        <Stack>
          <WorkspaceMenuHeader />
          {MOCK_WORKSPACES_DATA.map((workspace) => (
            <WorkspaceMenuTab
              key={workspace._id}
              label={workspace.title}
              numForms={workspace.numForms}
              isSelected={workspace._id === currWorkspaceId}
              onClick={() => setCurrWorkspaceId(workspace._id)}
            />
          ))}
        </Stack>
        <WorkspaceContent workspaceId={currWorkspaceId} />
      </Grid>

      <RolloutAnnouncementModal
        onClose={() => setHasSeenAnnouncement(true)}
        isOpen={isAnnouncementModalOpen}
      />
      <EmergencyContactModal
        onClose={() => setHasSeenEmergencyContact(true)}
        isOpen={isEmergencyContactModalOpen}
      />
    </>
  )
}
