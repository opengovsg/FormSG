import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { BiX } from 'react-icons/bi'
import { useQuery } from 'react-query'
import {
  Box,
  Container,
  Flex,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~/components/Pagination'

import { SingleSelect } from '~components/Dropdown'
import Searchbar from '~components/Searchbar'
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
  const [searchBarOpen, setSearchBarOpen] = useState<boolean>(false)

  // Query for billing info
  const {
    data: { loginStats } = { loginStats: [] },
    isLoading,
    isRefetching,
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

  const isLoadingOrRefetching = useMemo(
    () => isLoading || isRefetching,
    [isLoading, isRefetching],
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
            gridGap={'0.5rem'}
            gridTemplateAreas={{
              base:
                "'logincount " +
                // Mobile: if searchbar is expanded, split it into its own line
                (searchBarOpen ? "logincount' 'search " : '') +
                "search' 'dateselect export'",
              md: "'logincount space search dateselect export'",
            }}
          >
            <Box gridArea="logincount">
              <Text textStyle="h4" mb="0.5rem">
                {isLoadingOrRefetching ? (
                  'Loading logins for '
                ) : (
                  <>
                    <Text as="span" color="primary.500">
                      {loginCount}
                    </Text>
                    {prettifiedLoginCount}
                  </>
                )}
                <Text as="span" color="primary.500">
                  {esrvcId}
                </Text>
                {isLoadingOrRefetching ? '...' : ''}
              </Text>
            </Box>

            <Box gridArea="search" alignSelf="center" alignItems="center">
              <Flex justifyContent="right">
                <Searchbar
                  onSearch={(esrvcId) => onSubmitEsrvcId({ esrvcId })}
                  isExpanded={searchBarOpen}
                  onSearchIconClick={() => setSearchBarOpen(true)}
                  placeholder="e-service ID"
                ></Searchbar>
                {searchBarOpen ? (
                  <IconButton
                    aria-label="Close search"
                    icon={<BiX />}
                    variant="clear"
                    colorScheme="secondary"
                    onClick={() => setSearchBarOpen(false)}
                    marginLeft="2px"
                  />
                ) : (
                  <></>
                )}
              </Flex>
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

          {isLoadingOrRefetching ? (
            <Flex mb="3rem" justifyContent="center">
              <Spinner
                label={"Hang on, we're getting your bill charges ready!"}
                fontSize={90}
              ></Spinner>
            </Flex>
          ) : (
            <>
              <Box mb="3rem" overflow="auto" flex={1}>
                <BillingTable
                  loginStats={loginStats}
                  currentPage={currentPage - 1}
                />
              </Box>
              {statsCount === 0 ? (
                // No charges found
                <Text
                  as="h2"
                  textStyle="h2"
                  whiteSpace="pre-line"
                  align="center"
                >
                  {'No charges found for '}
                  <Text as="span" color="primary.500">
                    {esrvcId}
                  </Text>
                  {' in '}
                  <Text as="span" color="primary.500">
                    {dateRangeToString(dateRange)}
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
            </>
          )}
        </Flex>
      </Stack>
    </Container>
  )
}
