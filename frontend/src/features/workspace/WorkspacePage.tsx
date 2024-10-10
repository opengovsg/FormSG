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
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { PAPERLESS_FORMSG_RESEARCH_LINK } from '~shared/constants'
import { Workspace } from '~shared/types/workspace'

import { AdminNavBar } from '~/app/AdminNavBar/AdminNavBar'

import { useIsMobile } from '~hooks/useIsMobile'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { useEnv } from '~features/env/queries'
import { useUser } from '~features/user/queries'
import { WorkspaceContent } from '~features/workspace/WorkspaceContent'

import AdminFeedbackContainer from './components/AdminFeedbackContainer'
import { WorkspaceMenuHeader } from './components/WorkspaceSideMenu/WorkspaceMenuHeader'
import { WorkspaceMenuTabs } from './components/WorkspaceSideMenu/WorkspaceMenuTabs'
import { useDashboard, useWorkspace } from './queries'
import { WorkspaceProvider } from './WorkspaceProvider'

export const WorkspacePage = (): JSX.Element => {
  const [currWorkspaceId, setCurrWorkspaceId] = useState<string>('')
  const { data: { siteBannerContent, adminBannerContent } = {} } = useEnv()

  const mobileDrawer = useDisclosure()
  const isMobile = useIsMobile()

  const { user } = useUser()
  const { data: dashboardForms, isLoading: isDashboardLoading } = useDashboard()
  const { data: workspaces, isLoading: isWorkspaceLoading } = useWorkspace()

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContent || adminBannerContent,
    [adminBannerContent, siteBannerContent],
  )
  const bannerProps = useMemo(
    () => getBannerProps(bannerContent),
    [bannerContent],
  )

  const DEFAULT_WORKSPACE = useMemo(() => {
    return {
      _id: '',
      title: 'All forms',
      formIds: dashboardForms ? dashboardForms.map(({ _id }) => _id) : [],
      admin: user?._id,
    }
  }, [dashboardForms, user]) as Workspace

  if (isWorkspaceLoading || isDashboardLoading) return <></>

  return (
    <>
      {isMobile && (
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
      )}

      <Grid
        templateAreas={`
          "header header"
          "header2 header2"
          ${isMobile ? `"main main"` : `"nav main"`}
        `}
        gridTemplateRows={`auto 1fr`}
        gridTemplateColumns={{
          base: 'inherit',
          md: '15.5rem 1fr',
        }}
        h="100vh"
      >
        <GridItem area="header">
          {bannerProps ? (
            <Banner useMarkdown variant={bannerProps.variant}>
              {bannerProps.msg}
            </Banner>
          ) : null}
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
          <GridItem area="nav" borderRight="1px" borderRightColor="neutral.300">
            <Box overflowY="auto">
              <Stack minH="100vh">
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
        <GridItem area="main" bg="neutral.100">
          <WorkspaceProvider
            currentWorkspace={currWorkspaceId}
            defaultWorkspace={DEFAULT_WORKSPACE}
            setCurrentWorkspace={setCurrWorkspaceId}
          >
            <InlineMessage>
              <Text>
                Do you still have paper forms in your agency?{' '}
                <Link href={PAPERLESS_FORMSG_RESEARCH_LINK} target="_blank">
                  Tell us more so that we can help you digitalise them.
                </Link>
              </Text>
            </InlineMessage>
            <WorkspaceContent />
          </WorkspaceProvider>
        </GridItem>
      </Grid>
      {user && <AdminFeedbackContainer userId={user._id} />}
    </>
  )
}
