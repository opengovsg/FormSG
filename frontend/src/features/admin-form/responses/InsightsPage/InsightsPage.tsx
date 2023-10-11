import { Chart, GoogleChartWrapperChartType } from 'react-google-charts'
import { Divider, Text, VStack } from '@chakra-ui/react'

import { BasicField } from '~shared/types'
import { FormResponseMode } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmptyResponses } from '../ResponsesPage/common/EmptyResponses'
import { ResponsesPageSkeleton } from '../ResponsesPage/ResponsesPageSkeleton'
import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'

import { useAllSubmissionData } from './queries'

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

const InternalInsights = () => {
  const { data: encryptedContent } = useAllSubmissionData()
  const { data: form } = useAdminForm()

  const aggregateSubmissionData = (id: string): [string, number | string][] => {
    const hashMap = new Map<string, number>()

    // use key-value pair for faster
    encryptedContent?.forEach((content) => {
      content.responses.forEach((field) => {
        if (field._id === id && field.answer) {
          console.log(field)
          hashMap.set(field.answer, (hashMap.get(field.answer) || 0) + 1)
        } else if (field._id === id && field.answerArray) {
          field.answerArray.forEach((answer) => {
            if (typeof answer === 'string')
              return hashMap.set(answer, (hashMap.get(answer) || 0) + 1)
          })
        }
      })
    })
    console.log(hashMap)
    return Array.from(hashMap)
  }

  // For each form field in form
  // Aggregate submission data based on _id
  // Render into react google charts

  return (
    <VStack divider={<Divider />} gap="1.5rem">
      {form?.form_fields.map((formField, idx) => {
        let dataValues = aggregateSubmissionData(formField._id)

        if (formField.fieldType === BasicField.Date) {
          dataValues = dataValues.map((data) => [new Date(data[0]), data[1]])
        }

        let mean = undefined
        if (formField.fieldType === BasicField.Rating) {
          mean = 0
          dataValues.forEach((data) => {
            mean += Number(data[0]) * Number(data[1])
          })
          mean = mean / dataValues.length
        }
        // add header to values
        dataValues.unshift(['Answer', 'Count'])

        if (formField.fieldType === BasicField.Checkbox || BasicField.Rating)
          dataValues.map((val, idx) => {
            if (val[1] === 'Count') {
              val.push({ role: 'style' })
              val.push({
                sourceColumn: 0,
                role: 'annotation',
                type: 'string',
                calc: 'stringify',
              })
            } else {
              val.push(
                '#' +
                  (0x1000000 + Math.random() * 0xffffff)
                    .toString(16)
                    .substr(1, 6),
              )
              val.push(null)
            }
          })

        if (!FIELD_TO_CHART.get(formField.fieldType)) return <></>

        return (
          <FormChart
            title={formField.title}
            chartType={FIELD_TO_CHART.get(formField.fieldType) || 'PieChart'}
            data={dataValues}
            key={idx}
            mean={mean}
          />
        )
      })}
    </VStack>
  )
}

const FormChart = ({
  title,
  chartType,
  data,
  mean,
}: {
  title: string
  chartType: GoogleChartWrapperChartType
  data: [string, number | string][]
  mean?: number
}) => {
  const options = {
    title,
    legend: { position: chartType === 'PieChart' ? undefined : 'none' },
  }
  return (
    <VStack w="100%" gap="0">
      <Chart data={data} chartType={chartType} options={options} width="100%" />
      {mean && <Text textStyle="h2">Average: {mean}</Text>}
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
