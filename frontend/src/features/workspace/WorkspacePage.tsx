import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Container, Divider, Flex, Stack } from '@chakra-ui/react'
import { chunk } from 'lodash'

import Pagination from '~components/Pagination'

import { WorkspaceFormRow } from './components/WorkspaceFormRow'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useWorkspace } from './queries'

const PAGE_DEFAULTS = {
  size: 20,
  pageNumber: 1,
}

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

  return (
    <Flex bg="neutral.100" flexDir="column" h="100vh" overflow="hidden">
      <Box flex={1} overflow="auto">
        <Container maxW="67.5rem">
          <WorkspaceHeader
            isLoading={isLoading}
            totalFormCount={totalFormCount}
          />
          <Stack divider={<Divider borderColor="neutral.300" />}>
            {paginatedData?.map((form) => (
              <WorkspaceFormRow key={form._id} formMeta={form} />
            ))}
          </Stack>
        </Container>
      </Box>
      <Flex justify="center">
        <Container
          p="3rem"
          maxW="67.5rem"
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
      </Flex>
    </Flex>
  )
}
