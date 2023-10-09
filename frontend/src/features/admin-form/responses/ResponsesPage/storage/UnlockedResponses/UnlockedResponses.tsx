import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  Grid,
  HStack,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { format, isValid } from 'date-fns'
import simplur from 'simplur'

import { DateString } from '~shared/types'

import { DateRangeValue } from '~components/Calendar'
import { DateRangePicker } from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

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

// Mock MOE data
const HARDCODED_MOE_DATA = [
  {
    class: '1A',
    school: 'Red Rose Primary School',
    level: 'Primary 4',
    students: [
      { register_no: '111', nric: 'S1234567D', name: 'ah boy' },
      { register_no: '112', nric: 'S1234568B', name: 'another boy' },
    ],
  },
  {
    class: '1B',
    school: 'Red Rose Primary School',
    level: 'Primary 4',
    students: [
      { register_no: '113', nric: 'S1234432E', name: 'ah girl' },
      { register_no: '114', nric: 'S1234499F', name: 'another girl' },
    ],
  },
]

export type SubmittedStudentsForInjection = {
  register_no: string
  nric: string
  name: string
  className: string
  school: string
  level: string
}[]

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

  const { data } = useQuery(
    ['decryptedResponse', { formId, submissionId, secretKey }],
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
    { refetchInterval: 1000 },
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

  console.log('submissionId:', submissionId)

  const responseNRICs = data?.map((response) => {
    return response?.responses[0].answer ?? ''
  })

  const [selectedClass, setSelectedClass] = useState('')

  const generateSubmittedStudentsForInjection = (
    nric: string[],
  ): SubmittedStudentsForInjection => {
    const submittedStudentsForInjection = HARDCODED_MOE_DATA.map(
      (classData) => {
        const { class: className, school, level, students } = classData
        const submittedStudents = students.filter((student) =>
          nric.includes(student.nric),
        )

        const submittedStudentsByRow = submittedStudents.map((answer) => {
          return { ...answer, className, school, level }
        })

        return submittedStudentsByRow
      },
    ).flat()
    return submittedStudentsForInjection
  }

  const generateResponseCountByClass = (nric: string[]) => {
    // Application logic

    const results = HARDCODED_MOE_DATA.map((classData) => {
      const { class: className, students } = classData
      const submittedStudents = students.filter((student) =>
        nric.includes(student.nric),
      )

      const count = submittedStudents.length

      return { className, count, submittedStudents }
    })

    // Add render logic
    // Return a table with the header 'Classes' and 'Responses'
    // and populate with className and count
    return (
      <HStack>
        <Table>
          <Thead>
            <Tr>
              <Th>Class</Th>
              <Th>Responses</Th>
            </Tr>
          </Thead>
          <Tbody>
            {results.map((result) => {
              const { className, count } = result
              return (
                // turn grey on hover
                <Tr
                  _hover={{ bgColor: 'secondary.100' }}
                  onClick={() => {
                    setSelectedClass(className)
                  }}
                >
                  <Td>{className}</Td>
                  <Td>{count}</Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
        <Text>Selected Class: {selectedClass}</Text>
        {selectedClass ? (
          <Table

          // display students in selected class
          >
            <Thead>
              <Tr>
                <Th>Respondents</Th>
                <Th>Class</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results
                .filter((result) => result.className === selectedClass)
                .map((classResult) => {
                  const { submittedStudents, className } = classResult
                  return submittedStudents.map((student) => {
                    return (
                      <Tr>
                        <Td>{student.name}</Td>
                        <Td>{className}</Td>
                      </Tr>
                    )
                  })
                })}
            </Tbody>
          </Table>
        ) : null}
      </HStack>
    )
  }

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
        {/* Assume that 1) NRIC/FIN is first field */}
        <Flex flexDir="row" justifyContent={'space-between'}>
          {/* <Text>{JSON.stringify(data)}</Text> */}
          {/* <Text>COlumn 2</Text> */}
          {generateResponseCountByClass(responseNRICs || [])}
        </Flex>
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
              {prettifiedResponsesCount}
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
            injectedData={generateSubmittedStudentsForInjection(
              responseNRICs || [],
            )}
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
