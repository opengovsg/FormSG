import { Chart, GoogleChartWrapperChartType } from 'react-google-charts'

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
          field.answerArray.forEach((answer) =>
            hashMap.set(answer, (hashMap.get(answer) || 0) + 1),
          )
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
    <>
      {form?.form_fields.map((formField, idx) => {
        const dataValues = aggregateSubmissionData(formField._id)
        // add header to values
        dataValues.unshift(['Answer', 'Count'])
        return (
          <FormChart
            title={formField.title}
            chartType="PieChart"
            data={dataValues}
            key={idx}
          />
        )
      })}
    </>
  )
}

const FormChart = ({
  title,
  chartType,
  data,
}: {
  title: string
  chartType: GoogleChartWrapperChartType
  data: [string, number | string][]
}) => {
  return (
    <Chart data={data} chartType={chartType} options={{ title }} width="100%" />
  )
}
