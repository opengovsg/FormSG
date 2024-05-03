import { useMemo } from 'react'
import { Container, Divider, Flex, Stack, Text, VStack } from '@chakra-ui/react'
import { DateRangePicker } from '@opengovsg/design-system-react'
import simplur from 'simplur'
import { removeStopwords } from 'stopword'

import { BasicField, FormFieldDto } from '~shared/types'
import { isNonEmpty } from '~shared/utils/isNonEmpty'

import {
  datePickerValueToDateString,
  dateStringToDatePickerValue,
} from '~utils/date'

import { useAdminForm } from '~features/admin-form/common/queries'

import { DecryptedSubmission } from '../../AdminSubmissionsService'
import { useStorageResponsesContext } from '../../ResponsesPage/storage'
import { useAllSubmissionData } from '../queries'

import { EmptyChartsContainer } from './components/EmptyChartsContainer'
import { FIELD_TO_CHART, FormChart } from './components/FormChart'
import WordCloud, { WordCloudProps } from './components/WordCloud'

// transform filtered data into an array of answer to count
const aggregateSubmissionData = (
  id: string,
  formField: FormFieldDto,
  data: DecryptedSubmission[],
): [string, number][] => {
  const hashMap = new Map<string, number>()
  if (formField.fieldType === BasicField.Rating) {
    for (let i = 1; i <= formField.ratingOptions.steps; i += 1) {
      hashMap.set(String(i), 0)
    }
  }

  data.forEach((content) => {
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
const aggregateWordCloud = (
  id: string,
  data: DecryptedSubmission[],
): WordCloudProps['words'] => {
  const hashMap = new Map<string, number>()

  const resultArr: WordCloudProps['words'] = []

  data.forEach((content) => {
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

export const UnlockedChartsContainer = () => {
  const { data: form } = useAdminForm()
  const { dateRange, setDateRange } = useStorageResponsesContext()
  const { data: decryptedContent } = useAllSubmissionData(dateRange)

  const filteredDecryptedData = useMemo(() => {
    if (!decryptedContent) return []
    return decryptedContent
  }, [decryptedContent])

  const prettifiedResponsesCount = useMemo(
    () =>
      simplur` ${[filteredDecryptedData.length ?? 0]}response[|s] retrieved`,
    [filteredDecryptedData],
  )

  if (!form) return null

  const renderedCharts = form.form_fields
    .map((formField, idx) => {
      const questionTitle = `${idx + 1}. ${formField.title}`

      // if field type is text, create word cloud
      if (
        formField.fieldType === BasicField.ShortText ||
        formField.fieldType === BasicField.LongText
      ) {
        const words = aggregateWordCloud(formField._id, filteredDecryptedData)
        if (!words.length) return null
        return (
          <WordCloud words={words} questionTitle={questionTitle} key={idx} />
        )
      }

      // if field type is not within the chart types, do not render chart
      if (!FIELD_TO_CHART.get(formField.fieldType)) return null

      const dataValues = aggregateSubmissionData(
        formField._id,
        formField,
        filteredDecryptedData,
      )

      if (dataValues.length === 0) return null
      return (
        <FormChart
          title={questionTitle}
          rawTitle={formField.title}
          formField={formField}
          data={dataValues}
          key={idx}
        />
      )
    })
    .filter(isNonEmpty)

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
        <Flex direction="column">
          <Text textStyle="h4" mb="0.125rem">
            <Text as="span" color="brand.primary.500">
              {filteredDecryptedData.length}
            </Text>
            {prettifiedResponsesCount}
          </Text>
        </Flex>
        <DateRangePicker
          value={dateStringToDatePickerValue(dateRange)}
          onChange={(nextDateRange) => {
            setDateRange(datePickerValueToDateString(nextDateRange))
          }}
        />
      </Flex>
      {renderedCharts.length > 0 ? (
        <VStack divider={<Divider />} gap="1.5rem">
          {renderedCharts}
        </VStack>
      ) : filteredDecryptedData.length === 0 ? (
        <Container p={0} maxW="42.5rem">
          <Stack spacing="1rem" align="center">
            <Text
              as="h2"
              color="brand.primary.500"
              textStyle="h4"
              whiteSpace="pre-wrap"
            >
              No charts generated for this date range
            </Text>
            <Text
              textStyle="body-1"
              color="brand.secondary.500"
              mb="0.5rem"
              align="center"
            >
              There were no responses collected within this date range.
              <br />
              Try selecting a different date range.
            </Text>
          </Stack>
        </Container>
      ) : (
        <EmptyChartsContainer
          title="No charts generated yet."
          subtitle="You need at least one supported field in your form to generate charts."
        />
      )}
    </>
  )
}
