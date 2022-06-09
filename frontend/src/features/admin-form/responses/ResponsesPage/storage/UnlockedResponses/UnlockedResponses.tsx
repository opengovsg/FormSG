import { useMemo, useState } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~components/Pagination'

import { useFormResponses } from '~features/admin-form/responses/queries'

import { DownloadButton } from './DownloadButton'
import { ResponsesTable } from './ResponsesTable'

export const UnlockedResponses = (): JSX.Element => {
  const { data: { count, metadata } = {}, isLoading } = useFormResponses()
  const [currentPage, setCurrentPage] = useState(1)

  const prettifiedResponsesCount = useMemo(() => {
    if (!count) return
    return simplur` ${[count]}response[|s] to date`
  }, [count])

  return (
    <Flex flexDir="column" h="100%">
      <Grid
        mb="1rem"
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto', md: 'auto 1fr' }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        gridTemplateAreas={{
          base: "'submissions submissions' 'export'",
          md: "'submissions export'",
        }}
      >
        <Box gridArea="submissions">
          <Text textStyle="h4">
            <Text as="span" color="primary.500">
              {count?.toLocaleString()}
            </Text>
            {prettifiedResponsesCount}
          </Text>
        </Box>
        <DownloadButton />
      </Grid>
      <Box mb="3rem" overflow="auto" flex={1}>
        <ResponsesTable
          metadata={metadata ?? []}
          currentPage={currentPage - 1}
        />
      </Box>
      <Box display={isLoading || count === 0 ? 'none' : ''}>
        <Pagination
          totalCount={count ?? 0}
          currentPage={currentPage} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Flex>
  )
}
