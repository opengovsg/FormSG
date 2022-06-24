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
import { WorkspaceMenuHeader } from './components/WorkspaceSideMenu/WorkspaceMenuHeader'
import { WorkspaceMenuTabs } from './components/WorkspaceSideMenu/WorkspaceMenuTabs'

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

const WorkspaceMobilePage = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')

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
              workspaces={MOCK_WORKSPACES_DATA}
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

  return (
    <Grid templateColumns="15.5rem 1fr" minH="100vh">
      <Stack borderRight="1px" borderRightColor="neutral.300">
        <WorkspaceMenuHeader />
        <WorkspaceMenuTabs
          workspaces={MOCK_WORKSPACES_DATA}
          currWorkspace={currWorkspaceId}
          onClick={setCurrWorkspaceId}
        />
      </Stack>
      <WorkspaceContent workspaceId={currWorkspaceId} />
    </Grid>
  )
}

// TODO (hans): Add mobile view for WorkspacePage, probably split the views
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
  const isMobile = useIsMobile()

  // TODO (hans): Add <EmptyWorkspace/> if totalFormCount === 0
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
