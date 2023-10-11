import { useMemo, useState } from 'react'
import { BiData } from 'react-icons/bi'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { Box, Flex, Grid, Icon, Skeleton, Stack, Text } from '@chakra-ui/react'
import { format, isValid } from 'date-fns'
import simplur from 'simplur'

import { DateString } from '~shared/types'

import { DateRangeValue } from '~components/Calendar'
import { DateRangePicker } from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import Button from '../../../../../../components/Button'
import { MOEResultsComponent } from '../../../../../../plugins'
import { getDecryptedSubmissionById } from '../../../AdminSubmissionsService'
import { useStorageResponsesContext } from '../StorageResponsesContext'

import { DownloadButton } from './DownloadButton'
import { ResponsesTable } from './ResponsesTable'
import { SubmissionSearchbar } from './SubmissionSearchbar'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

const transform = {
  input: (range: DateString[]) => {
    const [start, end] = range
    // Convert to Date objects
    const startDate = new Date(start)
    const endDate = new Date(end)
    const result: (Date | null)[] = [null, null]
    // Check if dates are valid
    if (isValid(startDate)) {
      result[0] = startDate
    }
    if (isValid(endDate)) {
      result[1] = endDate
    }
    return result as DateRangeValue
  },
  output: (range: DateRangeValue) => {
    const [start, end] = range
    const result: DateString[] = []
    if (start) {
      result.push(format(start, 'yyyy-MM-dd') as DateString)
    }
    if (end) {
      result.push(format(end, 'yyyy-MM-dd') as DateString)
    }
    return result
  },
}

export const UnlockedResponses = (): JSX.Element => {
  const {
    currentPage,
    setCurrentPage,
    count,
    filteredCount,
    isLoading,
    submissionId,
    setSubmissionId,
    isAnyFetching,
    metadata,
  } = useUnlockedResponses()

  const { secretKey } = useStorageResponsesContext()
  const { formId } = useParams()

  const { data: decryptedResponses } = useQuery(
    ['decryptedResponse', { formId }],
    async () =>
      await Promise.all(
        metadata.map((response) => {
          return getDecryptedSubmissionById({
            formId: formId || '',
            submissionId: response.refNo,
            secretKey,
          })
        }),
      ),
    {
      enabled: !!(metadata.length && formId),
    },
  )

  const countToUse = useMemo(
    () => (submissionId ? filteredCount : count),
    [submissionId, filteredCount, count],
  )

  const { dateRange, setDateRange } = useStorageResponsesContext()

  const prettifiedResponsesCount = useMemo(
    () =>
      submissionId
        ? simplur` ${[filteredCount ?? 0]}result[|s] found`
        : simplur` ${[count ?? 0]}response[|s] to date`,
    [submissionId, filteredCount, count],
  )

  // FOR PLUGINS
  const [isPluginConnected, setIsPluginConnected] = useState(false)
  const [pluginSelectedState, setPluginSelectedState] = useState('')

  const pluginComponent = new MOEResultsComponent(
    decryptedResponses,
    pluginSelectedState,
    setPluginSelectedState,
  )

  pluginComponent.initialise()
  const pluginComponentDataForCSV =
    pluginComponent.generateSubmittedStudentsForInjection()
  const pluginCSVAdditionalFieldNames = pluginComponent.generateCSVFieldNames()

  return (
    <Flex flexDir="column" h="100%">
      <Grid
        mb="1rem"
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto 1fr', lg: 'auto 1fr auto' }}
        gridGap="0.5rem"
        gridTemplateAreas={{
          base: "'submissions search' 'export export'",
          lg: "'submissions search export'",
        }}
      >
        {/* Plugin code goes here */}
        {decryptedResponses && isPluginConnected && pluginComponent.render()}
        {/* End of plugin code */}
        <Stack
          align="center"
          spacing="1rem"
          direction="row"
          gridArea="submissions"
        >
          <Skeleton isLoaded={!isAnyFetching}>
            <Text textStyle="h4" mb="0.5rem">
              <Text as="span" color="primary.500">
                {countToUse?.toLocaleString()}
              </Text>
              {prettifiedResponsesCount} {'    '}
              <Button
                variant="clear"
                rightIcon={<Icon as={BiData} fontSize="1.5rem" />}
                onClick={() => setIsPluginConnected(true)}
              >
                {/* underline text */}
                <Text as="u">Connect to MOE Database</Text>
              </Button>
            </Text>
          </Skeleton>
        </Stack>

        <Flex gridArea="search" justifySelf="end">
          <SubmissionSearchbar
            submissionId={submissionId}
            setSubmissionId={setSubmissionId}
            isAnyFetching={isAnyFetching}
          />
        </Flex>

        <Stack
          direction={{ base: 'column', sm: 'row' }}
          justifySelf={{ base: 'start', sm: 'end' }}
          gridArea="export"
          maxW="100%"
        >
          <DateRangePicker
            value={transform.input(dateRange)}
            onChange={(nextDateRange) =>
              setDateRange(transform.output(nextDateRange))
            }
          />
          <DownloadButton
            injectedDataFromPlugin={
              isPluginConnected ? pluginComponentDataForCSV : undefined
            }
            injectedCSVHeadersFromPlugin={
              isPluginConnected ? pluginCSVAdditionalFieldNames : undefined
            }
          />
        </Stack>
      </Grid>

      <Box mb="3rem" overflow="auto" flex={1}>
        <ResponsesTable />
      </Box>

      <Box display={isLoading || countToUse === 0 ? 'none' : ''}>
        <Pagination
          totalCount={countToUse ?? 0}
          currentPage={currentPage ?? 1} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Flex>
  )
}
