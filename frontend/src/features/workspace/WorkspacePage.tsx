import { useMemo, useState } from 'react'
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  GridItem,
  Stack,
  useDisclosure,
} from '@chakra-ui/react'

import { Workspace } from '~shared/types/workspace'

import { AdminNavBar } from '~/app/AdminNavBar/AdminNavBar'

import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { useIsMobile } from '~hooks/useIsMobile'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'
import { WorkspaceContent } from '~features/workspace/WorkspaceContent'

import CreateFormModal from './components/CreateFormModal'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceMenuHeader } from './components/WorkspaceSideMenu/WorkspaceMenuHeader'
import { WorkspaceMenuTabs } from './components/WorkspaceSideMenu/WorkspaceMenuTabs'
import { useDashboard, useWorkspace } from './queries'
import { WorkspaceProvider } from './WorkspaceProvider'

export const WorkspacePage = (): JSX.Element => {
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')

  const createFormModal = useDisclosure()
  const mobileDrawer = useDisclosure()
  const isMobile = useIsMobile()

  const { user, isLoading: isUserLoading } = useUser()
  const { data: dashboardForms, isLoading: isDashboardLoading } = useDashboard()
  const { data: workspaces, isLoading: isWorkspaceLoading } = useWorkspace()

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

  const DEFAULT_WORKSPACE = useMemo(() => {
    return {
      _id: '',
      title: 'All forms',
      formIds: dashboardForms?.map(({ _id }) => _id),
      admin: user?._id,
    }
  }, [dashboardForms, user]) as Workspace

  if (isWorkspaceLoading || isDashboardLoading) return <></>

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
            <Flex pt="1rem" pl="1rem" pr="0.5rem" alignItems="center">
              <WorkspaceMenuHeader
                onMenuClick={mobileDrawer.onClose}
                shouldShowAddWorkspaceButton
                shouldShowMenuIcon
                w="100%"
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
              defaultWorkspace={DEFAULT_WORKSPACE}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Grid
        templateAreas={`
          "header header"
          "header2 header2"
          "nav main"
        `}
        gridTemplateRows={`auto 1fr`}
        gridTemplateColumns={{
          base: 'inherit',
          lg: '15.5rem 1fr',
        }}
        h="100vh"
      >
        <GridItem area="header">
          <AdminNavBar />
        </GridItem>
        {isMobile && (
          <GridItem area="header2">
            <WorkspaceMenuHeader
              shouldShowMenuIcon
              onMenuClick={mobileDrawer.onOpen}
              borderBottom="1px"
              borderBottomColor="neutral.300"
              py="1rem"
            />
          </GridItem>
        )}
        {!isMobile && (
          <GridItem area="nav">
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
                  defaultWorkspace={DEFAULT_WORKSPACE}
                />
              </Stack>
            </Box>
          </GridItem>
        )}
        <GridItem area="main">
          <WorkspaceProvider
            currentWorkspace={currWorkspaceId}
            defaultWorkspace={DEFAULT_WORKSPACE}
            setCurrentWorkspace={setCurrWorkspaceId}
          >
            <WorkspaceContent />
          </WorkspaceProvider>
        </GridItem>
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
