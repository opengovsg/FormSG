/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Container, Divider, Grid, Stack } from '@chakra-ui/react'
import { chunk } from 'lodash'

import Pagination from '~components/Pagination'

import { WorkspaceFormRow } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useWorkspace } from './queries'

const PAGE_DEFAULTS = {
  size: 20,
  pageNumber: 1,
}

const CONTAINER_MAXW = '69.5rem'

const useWorkspaceForms = () => {
  const { data: dashboardForms, isLoading } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortedForms, setSortedForms] = useState(dashboardForms)
  const [isManipulating, setIsManipulating] = useState(false)

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
  }
}

export const WorkspacePage = (): JSX.Element => {
  const {
    isLoading,
    totalFormCount,
    paginatedData,
    currentPage,
    setPageNumber,
  } = useWorkspaceForms()

  useLayoutEffect(() => {
    // Scroll to top on page change
    // block='center' is required or overflow will happen.
    topRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [currentPage])

  const topRef = useRef<HTMLDivElement>(null)

  return (
    <Grid
      bg="neutral.100"
      templateColumns="1fr"
      templateRows="auto 1fr auto"
      templateAreas="'header' 'main' 'footer'"
      h="100vh"
      overflow="auto"
    >
      <Container
        gridArea="header"
        maxW={CONTAINER_MAXW}
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        p="2rem"
      >
        <WorkspaceHeader
          isLoading={isLoading}
          totalFormCount={totalFormCount}
        />
      </Container>
      <Box gridArea="main" overflow={{ base: 'initial', md: 'auto' }}>
        <Box ref={topRef} />
        <Stack
          maxW={CONTAINER_MAXW}
          m="auto"
          divider={<Divider borderColor="neutral.300" />}
        >
          {paginatedData?.map((form) => (
            <WorkspaceFormRow px="2rem" key={form._id} formMeta={form} />
          ))}
        </Stack>
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
  )
}
