import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import {
  Box,
  Container,
  Flex,
  Grid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~/components/Pagination'

import { useIsMobile } from '~hooks/useIsMobile'
import { SingleSelect } from '~components/Dropdown'
import Spinner from '~components/Spinner'

import { getBillingInfo } from '~features/user/billing/BillingService'

import { EsrvcIdFormInputs } from '../BillingForm'
import { DateRange, dateRangeToString, stringToDateRange } from '../DateRange'

import { BillingDownloadButton } from './components/BillingDownloadButton'
import { BillingTable } from './components/BillingTable'

const getSelectDateDropdownItems = ({ yr, mth }: DateRange): string[] => {
  const selectDateDropdownItems: DateRange[] = []

  // Insert this yr's months first
  for (let loopMth = mth; loopMth >= 0; loopMth--) {
    selectDateDropdownItems.push({ yr, mth: loopMth })
  }

  // Go backwards until 2019
  for (let loopYr = yr - 1; loopYr >= 2019; loopYr--) {
    for (let loopMth = 11; loopMth >= 0; loopMth--) {
      selectDateDropdownItems.push({ yr: loopYr, mth: loopMth })
    }
  }
  return selectDateDropdownItems.map(dateRangeToString)
}

export const BillCharges = ({
  esrvcId,
  dateRange,
  todayDateRange,
  setDateRange,
  onSubmitEsrvcId,
}: {
  esrvcId: string
  dateRange: DateRange
  todayDateRange: DateRange
  setDateRange: Dispatch<SetStateAction<DateRange>>
  onSubmitEsrvcId: (inputs: EsrvcIdFormInputs) => Promise<void>
}): JSX.Element => {
  const [currentPage, setCurrentPage] = useState<number>(1)

  const isMobile = useIsMobile()

  // Query for billing info
  const {
    data: { loginStats } = { loginStats: [] },
    isLoading,
    isRefetching,
    isFetched,
    refetch,
  } = useQuery(esrvcId, () =>
    getBillingInfo({
      esrvcId,
      yr: dateRange.yr.toString(),
      mth: dateRange.mth.toString(),
    }),
  )

  useEffect(() => {
    refetch()
  }, [refetch, dateRange])

  // Compute some quantities for rendering

  const statsCount = useMemo(() => loginStats.length, [loginStats])

  const loginCount = useMemo(
    () =>
      loginStats
        ?.map(({ total }) => {
          return total
        })
        .reduce((acc, curr) => {
          return acc + curr
        }, 0) ?? 0,
    [loginStats],
  )

  const prettifiedLoginCount = useMemo(
    () => simplur` ${[loginCount]}login[|s] for `,
    [loginCount],
  )

  // Date range selection dropdown functions

  const selectDateDropdownItems = useMemo(
    () => getSelectDateDropdownItems(todayDateRange),
    [todayDateRange],
  )

  const selectDateDropdownValue = useMemo(
    () => dateRangeToString(dateRange),
    [dateRange],
  )

  const selectDateOnChange = (dateRangeString: string) => {
    setDateRange(stringToDateRange(dateRangeString))
  }

  // TODO: Add Searchbar for new esrvcid

  return (
    <Container
      overflowY="auto"
      p="1.5rem"
      maxW="69.5rem"
      flex={1}
      display="flex"
      flexDir="column"
    >
      <Stack spacing="2rem">
        <Skeleton isLoaded={true} w="fit-content">
          <Text as="h2" textStyle="h2" whiteSpace="pre-line">
            Bill charges
          </Text>
          Export monthly bill charges
        </Skeleton>
        <Flex flexDir="column" h="100%">
          <Grid
            mb="1rem"
            alignItems="end"
            color="secondary.500"
            gridTemplateColumns={{ base: 'auto', md: 'auto 1fr' }}
            gridGap={{ base: '0.5rem', md: '1.5rem' }}
            gridTemplateAreas={{
              base: "'submissions' 'search' 'dateselect' 'export'",
              md: "'submissions search dateselect export'",
            }}
          >
            <Box gridArea="submissions">
              <Text textStyle="h4" mb="0.5rem">
                <Text as="span" color="primary.500">
                  {loginCount}
                </Text>
                {prettifiedLoginCount}
                <Text as="span" color="primary.500">
                  {esrvcId}
                </Text>
              </Text>
            </Box>
            <Box gridArea="dateselect">
              <SingleSelect
                value={selectDateDropdownValue}
                onChange={selectDateOnChange}
                name={'selectDate'}
                items={selectDateDropdownItems}
                isClearable={false}
              />
            </Box>
            <Box gridArea="export" justifySelf="flex-end">
              <BillingDownloadButton
                esrvcId={esrvcId}
                dateRange={dateRange}
                loginStats={loginStats}
                isDisabled={loginCount === 0}
              />
            </Box>
          </Grid>

          {isLoading || isRefetching ? (
            <Flex mb="3rem" justifyContent="center">
              <Spinner
                label={"Hang on, we're getting your bill charges ready!"}
                fontSize={90}
              ></Spinner>
            </Flex>
          ) : (
            <Box mb="3rem" overflow="auto" flex={1}>
              <BillingTable
                loginStats={loginStats}
                currentPage={currentPage - 1}
              />
            </Box>
          )}

          {isFetched && statsCount === 0 ? (
            // No charges found
            <Text as="h2" textStyle="h2" whiteSpace="pre-line" align="center">
              {'No charges found for '}
              <Text as="span" color="primary.500">
                {esrvcId}
              </Text>
            </Text>
          ) : (
            <Box>
              <Pagination
                totalCount={statsCount ?? 0}
                currentPage={currentPage} //1-indexed
                pageSize={10}
                onPageChange={setCurrentPage}
              />
            </Box>
          )}
        </Flex>
      </Stack>
    </Container>
  )
}
