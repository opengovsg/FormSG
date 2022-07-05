import { useMemo, useState } from 'react'
import { BiMenuAltLeft } from 'react-icons/bi'
import {
  Container,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'
import IconButton from '~components/IconButton'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'
import {
  CONTAINER_MAXW,
  WorkspaceContent,
} from '~features/workspace/WorkspaceContent'

// TODO #4279: Remove after React rollout is complete
import { AdminSwitchEnvMessage } from './components/AdminSwitchEnvMessage'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceMenuHeader } from './components/WorkspaceSideMenu/WorkspaceMenuHeader'
import { WorkspaceMenuTabs } from './components/WorkspaceSideMenu/WorkspaceMenuTabs'
import { useDashboard, useWorkspace } from './queries'

const WorkspaceMobilePage = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')
  const { data: workspaces, isLoading: isWorkspaceLoading } = useWorkspace()
  if (isWorkspaceLoading || !workspaces) return <></>

  return (
    <>
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent maxW="15.5rem">
          <DrawerHeader p={0}>
            <Flex pt="1rem" px="1rem" alignItems="center">
              <IconButton
                icon={<BiMenuAltLeft />}
                onClick={onClose}
                aria-label="close workspace drawer"
                variant="clear"
                colorScheme="secondary"
              />
              <WorkspaceMenuHeader mt={0} px={0} w="100%" />
            </Flex>
          </DrawerHeader>
          <DrawerBody px={0} pt="1rem">
            <WorkspaceMenuTabs
              workspaces={workspaces}
              currWorkspace={currWorkspaceId}
              onClick={(id) => {
                setCurrWorkspaceId(id)
                onClose()
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Flex
        pl={'1.25rem'}
        alignItems="center"
        borderBottomWidth="1px"
        borderBottomColor="neutral.300"
        py="0.5rem"
      >
        <IconButton
          icon={<BiMenuAltLeft />}
          onClick={onOpen}
          aria-label="open workspace drawer"
          variant="clear"
          colorScheme="secondary"
        />
        <Text textStyle="h4" color="secondary.700">
          Workspaces
        </Text>
      </Flex>
      <WorkspaceContent workspaceId={currWorkspaceId} />
    </>
  )
}
const WorkspaceDesktopPage = (): JSX.Element => {
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')
  const { data: workspaces, isLoading: isWorkspaceLoading } = useWorkspace()
  if (isWorkspaceLoading || !workspaces) return <></>

  return (
    <Grid templateColumns="15.5rem 1fr" minH="100vh">
      <Stack borderRight="1px" borderRightColor="neutral.300">
        <WorkspaceMenuHeader />
        <WorkspaceMenuTabs
          workspaces={workspaces}
          currWorkspace={currWorkspaceId}
          onClick={setCurrWorkspaceId}
        />
      </Stack>
      <WorkspaceContent workspaceId={currWorkspaceId} />
    </Grid>
  )
}

export const WorkspacePage = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { user, isLoading: isUserLoading } = useUser()
  const createFormModalDisclosure = useDisclosure()
  const { data: dashboardForms, isLoading: isDashboardLoading } = useDashboard()

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

  if (dashboardForms?.length === 0) {
    return (
      <EmptyWorkspace
        isLoading={isDashboardLoading}
        handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
      />
    )
  }

  return (
    <>
      <Container gridArea="banner" maxW={CONTAINER_MAXW} pt="1.5rem">
        <AdminSwitchEnvMessage />
      </Container>
      {isMobile ? <WorkspaceMobilePage /> : <WorkspaceDesktopPage />}
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
