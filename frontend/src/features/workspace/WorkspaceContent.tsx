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
import { EmptyWorkspace } from './components/EmptyWorkspace'
import { WorkspaceFormRows } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useDashboard } from './queries'

const PAGE_DEFAULTS = {
  size: 20,
  pageNumber: 1,
}

export const CONTAINER_MAXW = '69.5rem'
const VALID_NUM_ARG_RE = /^[1-9]\d*$/

const useWorkspaceForms = () => {
  const { data: dashboardForms, isLoading } = useDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortedForms, setSortedForms] = useState(dashboardForms)
  const [isManipulating, setIsManipulating] = useState(false)

  const createFormModalDisclosure = useDisclosure()

  const pageParam = searchParams.get('page') ?? ''
  const sizeParam = searchParams.get('size') ?? ''

  const currentPage = VALID_NUM_ARG_RE.test(pageParam)
    ? parseInt(pageParam)
    : PAGE_DEFAULTS.pageNumber
  const pageSize = VALID_NUM_ARG_RE.test(sizeParam)
    ? parseInt(sizeParam)
    : PAGE_DEFAULTS.size
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

export const WorkspaceContent = (): JSX.Element => {
  const {
    isLoading,
    totalFormCount,
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
          overflowY="scroll"
        >
          <Container
            gridArea="header"
            maxW={CONTAINER_MAXW}
            borderBottom="1px solid var(--chakra-colors-neutral-300)"
            px="2rem"
            py="1rem"
          >
            <WorkspaceHeader
              handleOpenCreateFormModal={createFormModalDisclosure.onOpen}
            />
          </Container>
          <Box gridArea="main">
            <WorkspaceFormRows />
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
