import { useMemo } from 'react'
import { Divider, Flex, Text, VStack } from '@chakra-ui/react'
import { addDays, format, isValid } from 'date-fns'
import simplur from 'simplur'
import { removeStopwords } from 'stopword'

import { BasicField, DateString, FormFieldDto } from '~shared/types'

import { DateRangeValue } from '~components/Calendar'
import { DateRangePicker } from '~components/DateRangePicker'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useStorageResponsesContext } from '../../ResponsesPage/storage'
import { useAllSubmissionData } from '../queries'

import { FIELD_TO_CHART, FormChart } from './FormChart'
import WordCloud, { WordCloudProps } from './WordCloud'

export const UnlockedInsights = () => {
  const { data: decryptedContent } = useAllSubmissionData()
  const { data: form } = useAdminForm()
  const { dateRange, setDateRange } = useStorageResponsesContext()

  const filteredDecryptedData = useMemo(() => {
    if (!decryptedContent) return []
    if (dateRange.length === 2) {
      const resultArr: typeof decryptedContent = []
      decryptedContent.forEach((content) => {
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
    return decryptedContent
  }, [decryptedContent, dateRange])

  // transform filtered data into an array of answer to count
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

    filteredDecryptedData?.forEach((content) => {
      content.responses.forEach((field) => {
        if (field._id === id && field.answer) {
          // singular answer fields
          hashMap.set(field.answer, (hashMap.get(field.answer) || 0) + 1)
        } else if (field._id === id && field.answerArray) {
          // multi answer fields, like checkboxes
          field.answerArray.forEach((answer) => {
            if (typeof answer === 'string')
              return hashMap.set(answer, (hashMap.get(answer) || 0) + 1)
          })
        }
      })
    })

    return Array.from(hashMap)
  }

  // transform filtered text data into an array of {word: count}
  const aggregateWordCloud = (id: string): WordCloudProps['words'] => {
    const hashMap = new Map<string, number>()

    const resultArr: WordCloudProps['words'] = []

    filteredDecryptedData?.forEach((content) => {
      content.responses.forEach((field) => {
        if (field._id === id && field.answer) {
          // split to words
          const answerArray = field.answer.split(' ')
          // remove stop words from array
          const ansNoStopW = removeStopwords(answerArray)
          ansNoStopW.forEach((word) => {
            // remove punctuations
            const wordNoPunc = word.replace(/\W|_/g, '')
            // normalise to lower case
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
        ? simplur` ${[filteredDecryptedData.length ?? 0]}result[|s] found`
        : simplur` ${[filteredDecryptedData.length ?? 0]}response[|s] to date`,
    [filteredDecryptedData, dateRange],
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
            {filteredDecryptedData.length}
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
        {filteredDecryptedData.length > 0 &&
          form?.form_fields.map((formField, idx) => {
            const questionTitle = `${idx + 1}. ${formField.title}`

            // if field type is text, create word cloud
            if (
              formField.fieldType === BasicField.ShortText ||
              formField.fieldType === BasicField.LongText
            ) {
              const words = aggregateWordCloud(formField._id)
              if (!words.length) return null
              return (
                <WordCloud
                  words={words}
                  questionTitle={questionTitle}
                  key={idx}
                />
              )
            }

            // if field type is not within the chart types, do not render chart
            if (!FIELD_TO_CHART.get(formField.fieldType)) return null

            const dataValues = aggregateSubmissionData(formField._id, formField)
            if (dataValues.length === 0) return null
            return (
              <FormChart
                title={questionTitle}
                formField={formField}
                data={dataValues}
                key={idx}
              />
            )
          })}
      </VStack>
    </>
  )
}

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
