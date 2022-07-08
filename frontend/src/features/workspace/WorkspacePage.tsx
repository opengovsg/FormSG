import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Container, Grid, useDisclosure } from '@chakra-ui/react'
import { chunk } from 'lodash'

import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import Pagination from '~components/Pagination'

import { RolloutAnnouncementModal } from '~features/rollout-announcement/RolloutAnnouncementModal'
import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'

import CreateFormModal from './components/CreateFormModal'
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceFormRows } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useWorkspace } from './queries'

const PAGE_DEFAULTS = {
  size: 20,
  pageNumber: 1,
}

export const CONTAINER_MAXW = '69.5rem'

const useWorkspaceForms = () => {
  const { data: dashboardForms, isLoading } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortedForms, setSortedForms] = useState(dashboardForms)
  const [isManipulating, setIsManipulating] = useState(false)

  const createFormModalDisclosure = useDisclosure()

  const topRef = useRef<HTMLDivElement>(null)

  const currentPage = Number(
    searchParams.get('page') ?? PAGE_DEFAULTS.pageNumber,
  )
  const pageSize = Number(searchParams.get('size') ?? PAGE_DEFAULTS.size)
  const sort = searchParams.get('sort')

  const setSortOrder = useCallback(
    (sort: string) => {
      setSearchParams({ sort })
    },
    [setSearchParams],
  )

  const setPageNumber = useCallback(
    (page: number) => {
      setSearchParams({ page: String(page) })
    },
    [setSearchParams],
  )

  useEffect(() => {
    setIsManipulating(true)
    // TODO: Perform actual sorts
    setIsManipulating(false)
    setSortedForms(dashboardForms)

    // Only run when sort changes
  }, [dashboardForms, sort])

  const chunkedData = useMemo(
    () => chunk(sortedForms, pageSize),
    [pageSize, sortedForms],
  )

  useLayoutEffect(() => {
    // Scroll to top on workspace list page on change
    topRef.current?.scrollIntoView()
  }, [currentPage])

  const paginatedData = useMemo(() => {
    if (currentPage < 1 || currentPage > chunkedData.length) {
      return []
    }
    return chunkedData[currentPage - 1]
  }, [chunkedData, currentPage])

  return {
    isLoading: isLoading || isManipulating,
    currentPage,
    totalFormCount: dashboardForms?.length,
    paginatedData,
    setPageNumber,
    setSortOrder,
    topRef,
    createFormModalDisclosure,
  }
}

export const WorkspacePage = (): JSX.Element => {
  const {
    isLoading,
    totalFormCount,
    paginatedData,
    currentPage,
    setPageNumber,
    topRef,
    createFormModalDisclosure,
  } = useWorkspaceForms()
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

  const EMERGENCY_CONTACT_KEY = useMemo(
    () => EMERGENCY_CONTACT_KEY_PREFIX + user?._id,
    [user],
  )

  const [hasSeenEmergencyContact, setHasSeenEmergencyContact] =
    useLocalStorage<boolean>(EMERGENCY_CONTACT_KEY)

  const isEmergencyContactModalOpen = useMemo(
    () =>
      !isUserLoading &&
      // Open emergency contact modal after the rollout announcement modal
      Boolean(hasSeenAnnouncement) &&
      !hasSeenEmergencyContact &&
      !user?.contact,
    [isUserLoading, hasSeenAnnouncement, hasSeenEmergencyContact, user],
  )

  return (
    <>
      <CreateFormModal
        isOpen={createFormModalDisclosure.isOpen}
        onClose={createFormModalDisclosure.onClose}
      />
      {totalFormCount === 0 ? (
        <EmptyWorkspace
          handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
          isLoading={isLoading}
        />
      ) : (
        <Grid
          bg="neutral.100"
          templateColumns="1fr"
          templateRows="auto 1fr auto"
          minH="100vh"
          templateAreas="'header' 'main' 'footer'"
        >
          <Container
            gridArea="header"
            maxW={CONTAINER_MAXW}
            borderBottom="1px solid var(--chakra-colors-neutral-300)"
            px="2rem"
            py="1rem"
          >
            <WorkspaceHeader
              isLoading={isLoading}
              totalFormCount={totalFormCount}
              handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
            />
          </Container>
          <Box gridArea="main">
            <Box ref={topRef} />
            <RolloutAnnouncementModal
              onClose={() => setHasSeenAnnouncement(true)}
              isOpen={isAnnouncementModalOpen}
            />
            <EmergencyContactModal
              onClose={() => setHasSeenEmergencyContact(true)}
              isOpen={isEmergencyContactModalOpen}
            />
            <WorkspaceFormRows rows={paginatedData} isLoading={isLoading} />
          </Box>
          <Container
            gridArea="footer"
            py={{ base: '1rem', md: '3rem' }}
            px="2rem"
            maxW={CONTAINER_MAXW}
            borderTop="1px solid var(--chakra-colors-neutral-300)"
          >
            <Pagination
              isDisabled={isLoading}
              currentPage={currentPage}
              totalCount={totalFormCount ?? 0}
              onPageChange={setPageNumber}
              pageSize={PAGE_DEFAULTS.size}
            />
          </Container>
        </Grid>
      )}
    </>
  )
}
