import { useMemo, useState } from 'react'
import {
  Box,
  Container,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  Stack,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'

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
import CreateFormModal from './components/CreateFormModal'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceMenuHeader } from './components/WorkspaceSideMenu/WorkspaceMenuHeader'
import { WorkspaceMenuTabs } from './components/WorkspaceSideMenu/WorkspaceMenuTabs'
import { useDashboard, useWorkspace } from './queries'

export const WorkspacePage = (): JSX.Element => {
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')

  const shouldUseTopMenu = useBreakpointValue({
    base: true,
    xs: true,
    md: true,
    lg: false,
  })
  const createFormModal = useDisclosure()
  const mobileDrawer = useDisclosure()

  const { user, isLoading: isUserLoading } = useUser()
  const { data: dashboardForms, isLoading: isDashboardLoading } = useDashboard()
  const { data: workspaces } = useWorkspace()

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
      <>
        <CreateFormModal
          isOpen={createFormModal.isOpen}
          onClose={createFormModal.onClose}
        />
        <EmptyWorkspace
          isLoading={isDashboardLoading}
          handleOpenCreateFormModal={createFormModal.onOpen}
        />
      </>
    )
  }

  return (
    <>
      <Drawer
        placement="left"
        onClose={mobileDrawer.onClose}
        isOpen={mobileDrawer.isOpen}
      >
        <DrawerOverlay />
        <DrawerContent maxW="15.5rem">
          <DrawerHeader p={0}>
            <Flex pt="1rem" px="1rem" alignItems="center">
              <WorkspaceMenuHeader
                onMenuClick={mobileDrawer.onClose}
                shouldShowAddWorkspaceButton
                shouldShowMenuIcon
                justifyContent="space-between"
                w="100%"
                px={0}
              />
            </Flex>
          </DrawerHeader>
          <DrawerBody px={0} pt="1rem">
            <WorkspaceMenuTabs
              workspaces={workspaces ?? []}
              currWorkspace={currWorkspaceId}
              onClick={(id) => {
                setCurrWorkspaceId(id)
                mobileDrawer.onClose()
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Grid templateColumns={{ base: 'inherit', lg: '15.5rem 1fr' }} h="100vh">
        <Container gridArea="banner" maxW={CONTAINER_MAXW} pt="1.5rem">
          <AdminSwitchEnvMessage />
        </Container>
        {shouldUseTopMenu ? (
          <WorkspaceMenuHeader
            shouldShowMenuIcon
            onMenuClick={mobileDrawer.onOpen}
            borderBottom="1px"
            borderBottomColor="neutral.300"
            py="1rem"
          />
        ) : (
          <Box overflowY="scroll">
            <Stack
              borderRight="1px"
              borderRightColor="neutral.300"
              minH="100vh"
            >
              <WorkspaceMenuHeader shouldShowAddWorkspaceButton />
              <WorkspaceMenuTabs
                workspaces={workspaces ?? []}
                currWorkspace={currWorkspaceId}
                onClick={setCurrWorkspaceId}
              />
            </Stack>
          </Box>
        )}
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
