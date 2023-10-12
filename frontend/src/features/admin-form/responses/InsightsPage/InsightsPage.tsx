import { useMemo, useState } from 'react'
import { Chart, GoogleChartWrapperChartType } from 'react-google-charts'
import { BiBarChartAlt2, BiTable } from 'react-icons/bi'
import ReactWordcloud from 'react-wordcloud'
import {
  Divider,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import { addDays, format, isValid } from 'date-fns'
import simplur from 'simplur'
import { removeStopwords } from 'stopword'

import { BasicField, DateString, FormFieldDto } from '~shared/types'
import { FormResponseMode } from '~shared/types/form'

import { useToast } from '~hooks/useToast'
import { DateRangeValue } from '~components/Calendar'
import { DateRangePicker } from '~components/DateRangePicker'
import IconButton from '~components/IconButton'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmptyResponses } from '../ResponsesPage/common/EmptyResponses'
import { ResponsesPageSkeleton } from '../ResponsesPage/ResponsesPageSkeleton'
import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'

import { useAllSubmissionData } from './queries'

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

export const InsightsPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  const toast = useToast({ status: 'danger' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
    return <ResponsesPageSkeleton />
  }

  if (form.responseMode === FormResponseMode.Email) {
    return <></>
  }

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? <InternalInsights /> : <SecretKeyVerification />
}

type Word = { text: string; value: number }

const InternalInsights = () => {
  const { data: encryptedContent } = useAllSubmissionData()
  const { data: form } = useAdminForm()
  const { dateRange, setDateRange } = useStorageResponsesContext()

  const filteredEncryptedData = useMemo(() => {
    if (!encryptedContent) return []
    if (dateRange.length === 2) {
      const resultArr: typeof encryptedContent = []
      encryptedContent.forEach((content) => {
        if (
          content.submissionTime &&
          Date.parse(content.submissionTime) >= Date.parse(dateRange[0]) &&
          Date.parse(content.submissionTime) <=
            addDays(Date.parse(dateRange[1]), 1).getTime()
        )
          resultArr.push(content)
      })
      return resultArr
    }
    return encryptedContent
  }, [encryptedContent, dateRange])

  const aggregateSubmissionData = (
    id: string,
    formField: FormFieldDto,
  ): [string, number | string][] => {
    const hashMap = new Map<string, number>()
    if (formField.fieldType === BasicField.Rating) {
      for (let i = 1; i <= formField.ratingOptions.steps; i += 1) {
        hashMap.set(String(i), 0)
      }
    }

    filteredEncryptedData?.forEach((content) => {
      content.responses.forEach((field) => {
        if (field._id === id && field.answer) {
          hashMap.set(field.answer, (hashMap.get(field.answer) || 0) + 1)
        } else if (field._id === id && field.answerArray) {
          field.answerArray.forEach((answer) => {
            if (typeof answer === 'string')
              return hashMap.set(answer, (hashMap.get(answer) || 0) + 1)
          })
        }
      })
    })

    return Array.from(hashMap)
  }

  const aggregateWordCloud = (id: string): Word[] => {
    const hashMap = new Map<string, number>()

    const resultArr: Word[] = []

    // use key-value pair for faster
    filteredEncryptedData?.forEach((content) => {
      content.responses.forEach((field) => {
        if (field._id === id && field.answer) {
          const answerArray = field.answer.split(' ')
          const ansNoStopW = removeStopwords(answerArray)
          ansNoStopW.forEach((word) => {
            const wordNoPunc = word.replace(/\W|_/g, '')
            const wordLower = wordNoPunc.toLowerCase()
            hashMap.set(wordLower, (hashMap.get(wordLower) || 0) + 1)
          })
        }
      })
    })
    hashMap.forEach((val, key) => resultArr.push({ text: key, value: val }))
    return resultArr
  }

  const prettifiedResponsesCount = useMemo(
    () =>
      dateRange.length === 2
        ? simplur` ${[filteredEncryptedData.length ?? 0]}result[|s] found`
        : simplur` ${[filteredEncryptedData.length ?? 0]}response[|s] to date`,
    [filteredEncryptedData, dateRange],
  )

  return (
    <>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        justifySelf={{ base: 'start', sm: 'end' }}
        alignSelf="center"
        maxW="100%"
        mb="2.5rem"
        alignItems={{ base: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        w="100%"
        gap="1rem"
      >
        <Text textStyle="h4" mb="0.5rem">
          <Text as="span" color="primary.500">
            {filteredEncryptedData.length}
          </Text>
          {prettifiedResponsesCount}
        </Text>
        <DateRangePicker
          value={transform.input(dateRange)}
          onChange={(nextDateRange) =>
            setDateRange(transform.output(nextDateRange))
          }
        />
      </Flex>
      <VStack divider={<Divider />} gap="1.5rem">
        {form?.form_fields.map((formField, idx) => {
          if (filteredEncryptedData.length === 0) return null
          if (
            formField.fieldType === BasicField.ShortText ||
            formField.fieldType === BasicField.LongText
          ) {
            const words = aggregateWordCloud(formField._id)
            if (!words.length) return null
            return (
              <VStack w="100%" gap="0" key={idx}>
                <Text textStyle="h4">{`${idx + 1}. ${formField.title}`}</Text>
                <ReactWordcloud key={idx} words={words} />
              </VStack>
            )
          }

          const dataValues = aggregateSubmissionData(formField._id, formField)

          let mean = undefined
          if (formField.fieldType === BasicField.Rating) {
            mean = 0
            let count = 0
            dataValues.forEach((data) => {
              mean += Number(data[0]) * Number(data[1])
              count += Number(data[1])
            })
            mean = mean / count
          }
          // add header to values
          dataValues.unshift(['Answer', 'Count'])
          if (
            !FIELD_TO_CHART.get(formField.fieldType) ||
            dataValues.length <= 1 ||
            Number.isNaN(mean)
          )
            return null

          return (
            <FormChart
              title={`${idx + 1}. ${formField.title}`}
              formField={formField}
              data={dataValues}
              key={idx}
              mean={mean}
            />
          )
        })}
      </VStack>
    </>
  )
}

const FormChart = ({
  title,
  formField,
  data,
  mean,
}: {
  title: string
  formField: FormFieldDto
  data: [string, number | string][]
  mean?: number
}) => {
  const [isTable, setIsTable] = useState(false)

  const chartType: GoogleChartWrapperChartType = useMemo(() => {
    if (isTable) return 'Table'
    return FIELD_TO_CHART.get(formField.fieldType) || 'PieChart'
  }, [isTable, formField])

  if (
    !isTable &&
    (formField.fieldType === BasicField.Checkbox || BasicField.Rating)
  )
    data.forEach((val) => {
      if (val[1] === 'Count') {
        val.push({ role: 'style' })
      } else {
        val.push(
          '#' +
            (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6),
        )
      }
    })

  const options = {
    legend: { position: chartType === 'PieChart' ? undefined : 'none' },
    chartArea: { width: '50%' },
  }
  return (
    <VStack w="100%" gap="0">
      <Flex alignItems="center" justifyContent="space-between" w="100%">
        <Text textStyle="h4" mr="1rem">
          {title}
        </Text>
        <Flex gap="0.5rem">
          <IconButton
            aria-label="chart"
            onClick={() => setIsTable(false)}
            icon={<BiBarChartAlt2 />}
            variant="clear"
            isActive={!isTable}
          />

          <IconButton
            aria-label="table"
            onClick={() => setIsTable(true)}
            icon={<BiTable />}
            variant="clear"
            isActive={isTable}
          />
        </Flex>
      </Flex>
      {isTable ? (
        <TableChart data={data} />
      ) : (
        <Chart
          data={data}
          chartType={chartType}
          options={options}
          width="100%"
          height="400px"
        />
      )}
      {mean && (
        <Text textStyle="h4">
          Average: {Math.round((mean + Number.EPSILON) * 100) / 100}
        </Text>
      )}
    </VStack>
  )
}

const FIELD_TO_CHART = new Map<BasicField, GoogleChartWrapperChartType>([
  [BasicField.Rating, 'ColumnChart'],
  [BasicField.Radio, 'PieChart'],
  [BasicField.Checkbox, 'BarChart'],
  [BasicField.Dropdown, 'PieChart'],
  [BasicField.CountryRegion, 'PieChart'],
  [BasicField.YesNo, 'PieChart'],
])

const TableChart = ({ data }: { data: [string, number | string][] }) => {
  return (
    <TableContainer>
      <Table variant="simple" my="1rem">
        <Thead>
          <Tr>
            <Th>Answer</Th>
            <Th isNumeric>Count</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((val, idx) => {
            if (typeof val[1] === 'number')
              return (
                <TableChartRows
                  answer={val[0]}
                  value={Number(val[1])}
                  key={idx}
                />
              )
            return null
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

const TableChartRows = ({
  answer,
  value,
}: {
  answer: string
  value: number
}) => {
  return (
    <Tr>
      <Td>{answer}</Td>
      <Td>{value}</Td>
    </Tr>
  )
}
