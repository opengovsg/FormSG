import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Container, Grid, useDisclosure } from '@chakra-ui/react'
import { chunk } from 'lodash'

import Pagination from '~components/Pagination'

import CreateFormModal from './components/CreateFormModal'
import { WorkspaceFormRows } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useDashboard } from './queries'

const PAGE_DEFAULTS = {
  size: 20,
  pageNumber: 1,
}

export const CONTAINER_MAXW = '69.5rem'

const useWorkspaceForms = () => {
  const { data: dashboardForms, isLoading } = useDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortedForms, setSortedForms] = useState(dashboardForms)
  const [isManipulating, setIsManipulating] = useState(false)

  const createFormModalDisclosure = useDisclosure()

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
    /**
     * Scroll to top on workspace page on change. Use scrollTo(0,0) instead of a ref on workspace container
     * because mobile view has headers on top of the workspace container
     */
    window.scrollTo(0, 0)
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
    createFormModalDisclosure,
  }
}

interface WorkspaceContentProps {
  workspaceId: string
}

export const WorkspaceContent = ({
  workspaceId,
}: WorkspaceContentProps): JSX.Element => {
  // TODO (hans): Use workspaceId to fetch workspace data once API created (depends on final design decision)
  const {
    isLoading,
    totalFormCount,
    paginatedData,
    currentPage,
    setPageNumber,
    createFormModalDisclosure,
  } = useWorkspaceForms()

  return (
    <>
      <CreateFormModal
        isOpen={createFormModalDisclosure.isOpen}
        onClose={createFormModalDisclosure.onClose}
      />
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
    </>
  )
}
