import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { BiX } from 'react-icons/bi'
import { useQuery } from 'react-query'
import { Box, Container, Flex, Grid, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~/components/Pagination'

import { SingleSelect } from '~components/Dropdown'
import Searchbar, { useSearchbar } from '~components/Searchbar'

import { getBillingInfo } from '~features/user/billing/BillingService'

import IconButton from '../../../../components/IconButton'
import { EsrvcIdFormInputs } from '../BillingForm'
import { DateRange, dateRangeToString, stringToDateRange } from '../DateRange'

import { BillingDownloadButton } from './components/BillingDownloadButton'
import { BillingNoChargesContent } from './components/BillingNoChargesContent'
import { BillingTable } from './components/BillingTable'
import { BillingTableSkeleton } from './components/BillingTableSkeleton'

export type BillChargesProps = {
  esrvcId: string
  dateRange: DateRange
  todayDateRange: DateRange
  setDateRange: Dispatch<SetStateAction<DateRange>>
  onSubmitEsrvcId: (inputs: EsrvcIdFormInputs) => Promise<void>
}

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
}: BillChargesProps): JSX.Element => {
  const [currentPage, setCurrentPage] = useState<number>(1)

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
      loginStats?.reduce((acc, { total }) => {
        return acc + total
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

  // Searchbar props

  const { inputRef, isExpanded, handleExpansion, handleCollapse } =
    useSearchbar()

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
        <Stack spacing="0.5rem">
          <Text as="h2" textStyle="h2" whiteSpace="pre-line">
            Bill charges
          </Text>
          <Text>Export monthly bill charges</Text>
        </Stack>
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
                (isExpanded ? "logincount' 'search " : '') +
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
                  ref={inputRef}
                  onSearch={(esrvcId) =>
                    esrvcId ? onSubmitEsrvcId({ esrvcId }) : null
                  }
                  onSearchIconClick={() => handleExpansion()}
                  placeholder="e-service ID"
                  isExpanded={isExpanded}
                  rightElement={
                    <IconButton
                      ml="1px"
                      aria-label="Close search bar"
                      icon={<BiX />}
                      variant="clear"
                      colorScheme="secondary"
                      onClick={() => handleCollapse()}
                    ></IconButton>
                  }
                ></Searchbar>
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
            <BillingTableSkeleton />
          ) : statsCount === 0 ? (
            <Box mt="2rem">
              <BillingNoChargesContent />
            </Box>
          ) : (
            <>
              <Box mb="3rem" overflow="auto" flex={1}>
                <BillingTable
                  loginStats={loginStats}
                  currentPage={currentPage - 1}
                />
              </Box>
              <Box>
                <Pagination
                  totalCount={statsCount ?? 0}
                  currentPage={currentPage} //1-indexed
                  pageSize={10}
                  onPageChange={setCurrentPage}
                />
              </Box>
            </>
          )}
        </Flex>
      </Stack>
    </Container>
  )
}
